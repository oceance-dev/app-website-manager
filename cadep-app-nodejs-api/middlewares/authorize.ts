import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { ApiError } from '../utils/ApiError';
import { Resource, Action, DEFAULT_ROLES, Permission } from '../config/permissions';
import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2';

interface AuthorizeOptions {
    resource: Resource;
    action: Action;
    ownerField?: string;
    resourceIdParam?: string;
}

export function authorize(options: AuthorizeOptions) {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.userId) {
                throw ApiError.unauthorized('Non authentifié');
            }

            const { resource, action, ownerField, resourceIdParam } = options;
            const userPermissions = await getUserPermissions(req.userId?.id, req.userId.role);

            const permission = userPermissions.find(p => p.resource === resource);

            if (!permission) {
                throw ApiError.forbidden(`Accès refusé à la ressource ${resource}`);
            }

            const hasAction = permission.actions.includes(action);
            const hasOwnAction = permission.actions.includes(`${action}_own` as Action);
            const hasManage = permission.actions.includes('manage');

            if (!hasAction && !hasOwnAction && !hasManage) {
                throw ApiError.forbidden(`Action ${action} non autorisée sur ${resource}`);
            }

            // Si l'utilisateur a seulement l'action "own", vérifie la propriété
            if (!hasAction && !hasManage && hasOwnAction) {
                if (!ownerField || !resourceIdParam) {
                throw ApiError.forbidden('Accès limité aux propres ressources');
                }

                const resourceId = req.params[resourceIdParam];
                const isOwner = await checkOwnership(resource, resourceId, req.userId.id, ownerField);

                if (!isOwner) {
                throw ApiError.forbidden('Vous ne pouvez accéder qu\'à vos propres ressources');
                }

                // Stocke les champs autorisés si définis
                if (permission.conditions?.fields) {
                req.allowedFields = permission.conditions.fields;
                }
            }
            next();
        } catch (error) {
            next(error);
        }
    };
}

async function getUserPermissions(userId: number, roleName: string): Promise<Permission[]> {
  // Permissions de base du rôle
  const basePermissions = DEFAULT_ROLES[roleName] || [];

  // Permissions personnalisées de l'utilisateur
  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT p.resource, p.action, p.conditions
    FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE up.user_id = ? AND up.is_granted = true
  `, [userId]);

  // Permissions refusées explicitement
  const [denied] = await pool.execute<RowDataPacket[]>(`
    SELECT p.resource, p.action
    FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE up.user_id = ? AND up.is_granted = false
  `, [userId]);

  // Fusionne et filtre
  const deniedSet = new Set(denied.map(d => `${d.resource}:${d.action}`));
  
  const mergedPermissions = new Map<string, Permission>();

  // Ajoute les permissions de base
  for (const perm of basePermissions) {
    const filteredActions = perm.actions.filter(
      action => !deniedSet.has(`${perm.resource}:${action}`)
    );
    if (filteredActions.length > 0) {
      mergedPermissions.set(perm.resource, {
        ...perm,
        actions: filteredActions
      });
    }
  }

  // Ajoute les permissions personnalisées
  for (const row of rows) {
    const key = row.resource;
    const existing = mergedPermissions.get(key);
    if (existing) {
      if (!existing.actions.includes(row.action)) {
        existing.actions.push(row.action);
      }
    } else {
      mergedPermissions.set(key, {
        resource: row.resource,
        actions: [row.action],
        conditions: row.conditions ? JSON.parse(row.conditions) : undefined
      });
    }
  }

  return Array.from(mergedPermissions.values());
}

// Vérifie si l'utilisateur est propriétaire de la ressource
async function checkOwnership(
  resource: string,
  resourceId: string,
  userId: number,
  ownerField: string
): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT ${ownerField} FROM ${resource}s WHERE id = ?`,
    [resourceId]
  );

  if (rows.length === 0) {
    throw ApiError.notFound('Ressource non trouvée');
  }

  return rows[0][ownerField] === userId;
}

export function filterFields(req: AuthRequest, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);

  res.json = (data: any) => {
    if (req.allowedFields && data && typeof data === 'object') {
      if (Array.isArray(data)) {
        data = data.map(item => filterObject(item, req.allowedFields!));
      } else {
        data = filterObject(data, req.allowedFields);
      }
    }
    return originalJson(data);
  };

  next();
}

function filterObject(obj: Record<string, any>, allowedFields: string[]): Record<string, any> {
  const filtered: Record<string, any> = { id: obj.id };
  for (const field of allowedFields) {
    if (field in obj) {
      filtered[field] = obj[field];
    }
  }
  return filtered;
}