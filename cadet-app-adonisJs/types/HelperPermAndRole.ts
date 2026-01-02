import { permission } from "process";


/**
 * Status d'une association
 */

export enum AssociationStatus {
    PENDING = 'pending', // En attente de validation
    ACTIVE = 'active', // Active (Abonnement valide)
    SUSPENDED = 'suspended', // Suspendue (impayé, etc...)
    CANCELLED = 'cancelled', // Résiliée
}
/**
 * ========================================
 * TYPES POUR RÔLES ET PERMISSIONS
 * Utilisable côté back ET front
 * ========================================
 */

/**
 * Noms des rôles système
 */
export const RoleNames = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  PRESIDENT: 'president',
  DIRECTEUR_FORMATION: 'directeur_formation',
  TRESORIER: 'tresorier',
  SECRETAIRE: 'secretaire',
  STAFF: 'staff',
  FORMATEUR: 'formateur',
  CADET_BREVETE: 'cadet_brevete',
  CADET: 'cadet',
  CANDIDAT: 'candidat',
} as const

export type RoleName = (typeof RoleNames)[keyof typeof RoleNames]

/**
 * Niveaux des rôles (pour comparaison hiérarchique)
 */
export const RoleLevels: Record<RoleName, number> = {
  super_admin: 100,
  admin: 95,
  president: 90,
  directeur_formation: 80,
  tresorier: 75,
  secretaire: 70,
  staff: 60,
  formateur: 55,
  cadet_brevete: 40,
  cadet: 30,
  candidat: 10,
}

/**
 * Labels des rôles (pour affichage)
 */
export const RoleLabels: Record<RoleName, string> = {
  super_admin: 'Super Administrateur',
  admin: 'Administrateur',
  president: 'Président',
  directeur_formation: 'Directeur de Formation',
  tresorier: 'Trésorier',
  secretaire: 'Secrétaire',
  staff: 'Staff',
  formateur: 'Formateur',
  cadet_brevete: 'Cadet Breveté',
  cadet: 'Cadet',
  candidat: 'Candidat',
}

/**
 * Groupes de permissions
 */
export const PermissionGroups = {
  ASSOCIATIONS: 'associations',
  USERS: 'users',
  CADETS: 'cadets',
  CANDIDATES: 'candidates',
  DOCUMENTS: 'documents',
  FORMATIONS: 'formations',
  FINANCES: 'finances',
  ROLES: 'roles',
  DASHBOARD: 'dashboard',
} as const

export type PermissionGroup = (typeof PermissionGroups)[keyof typeof PermissionGroups]

/**
 * Noms des permissions
 */
export const PermissionNames = {
  // Associations
  ASSOCIATIONS_READ: 'associations.read',
  ASSOCIATIONS_CREATE: 'associations.create',
  ASSOCIATIONS_UPDATE: 'associations.update',
  ASSOCIATIONS_DELETE: 'associations.delete',
  ASSOCIATIONS_APPROVE: 'associations.approve',
  ASSOCIATIONS_SUSPEND: 'associations.suspend',

  // Users
  USERS_READ: 'users.read',
  USERS_READ_OWN: 'users.read_own',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_UPDATE_OWN: 'users.update_own',
  USERS_DELETE: 'users.delete',
  USERS_RESET_PASSWORD: 'users.reset_password',

  // Cadets
  CADETS_READ: 'cadets.read',
  CADETS_READ_OWN: 'cadets.read_own',
  CADETS_CREATE: 'cadets.create',
  CADETS_UPDATE: 'cadets.update',
  CADETS_UPDATE_OWN: 'cadets.update_own',
  CADETS_DELETE: 'cadets.delete',
  CADETS_VALIDATE: 'cadets.validate',
  CADETS_GRADUATE: 'cadets.graduate',

  // Candidates
  CANDIDATES_READ: 'candidates.read',
  CANDIDATES_READ_OWN: 'candidates.read_own',
  CANDIDATES_CREATE: 'candidates.create',
  CANDIDATES_UPDATE: 'candidates.update',
  CANDIDATES_UPDATE_OWN: 'candidates.update_own',
  CANDIDATES_DELETE: 'candidates.delete',
  CANDIDATES_VALIDATE: 'candidates.validate',
  CANDIDATES_REJECT: 'candidates.reject',

  // Documents
  DOCUMENTS_READ: 'documents.read',
  DOCUMENTS_READ_OWN: 'documents.read_own',
  DOCUMENTS_UPLOAD: 'documents.upload',
  DOCUMENTS_DELETE: 'documents.delete',
  DOCUMENTS_VALIDATE: 'documents.validate',

  // Formations
  FORMATIONS_READ: 'formations.read',
  FORMATIONS_CREATE: 'formations.create',
  FORMATIONS_UPDATE: 'formations.update',
  FORMATIONS_DELETE: 'formations.delete',
  FORMATIONS_MANAGE: 'formations.manage',

  // Finances
  FINANCES_READ: 'finances.read',
  FINANCES_CREATE: 'finances.create',
  FINANCES_UPDATE: 'finances.update',
  FINANCES_DELETE: 'finances.delete',
  FINANCES_EXPORT: 'finances.export',
  FINANCES_MANAGE: 'finances.manage',

  // Roles
  ROLES_READ: 'roles.read',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',
  PERMISSIONS_READ: 'permissions.read',

  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  STATS_VIEW: 'stats.view',
  STATS_EXPORT: 'stats.export',
} as const

export type PermissionName = (typeof PermissionNames)[keyof typeof PermissionNames]

/**
 * Interface Role (réponse API)
 */
export interface IRole {
  id: number
  name: RoleName
  displayName: string
  description: string | null
  level: number
  isSystem: boolean
  isActive: boolean
  permissions?: IPermission[]
  createdAt?: string
  updatedAt?: string
}

/**
 * Interface Role basique (sans permissions)
 */
export interface IRoleBasic {
  id: number
  name: RoleName
  displayName: string
  level: number
}

/**
 * Interface Permission (réponse API)
 */
export interface IPermission {
  id: number
  name: PermissionName
  displayName: string
  description: string | null
  group: PermissionGroup
  isActive: boolean
}

/**
 * Interface pour les permissions de l'utilisateur connecté
 */
export interface IUserPermissions {
  role: IRoleBasic | null
  permissions: PermissionName[]
  isSuperAdmin: boolean
  isAdmin: boolean
}

/**
 * ========================================
 * HELPERS POUR LE FRONT
 * ========================================
 */

/**
 * Vérifie si l'utilisateur a une permission
 */
export function hasPermission(
  userPermissions: PermissionName[],
  permission: PermissionName
): boolean {
  return userPermissions.includes(permission)
}

/**
 * Vérifie si l'utilisateur a toutes les permissions
 */
export function hasAllPermissions(
  userPermissions: PermissionName[],
  permissions: PermissionName[]
): boolean {
  return permissions.every((p) => userPermissions.includes(p))
}

/**
 * Vérifie si l'utilisateur a au moins une des permissions
 */
export function hasAnyPermission(
  userPermissions: PermissionName[],
  permissions: PermissionName[]
): boolean {
  return permissions.some((p) => userPermissions.includes(p))
}

/**
 * Vérifie si un rôle est supérieur ou égal à un autre
 */
export function isRoleHigherOrEqual(role: RoleName, targetRole: RoleName): boolean {
  return RoleLevels[role] >= RoleLevels[targetRole]
}

/**
 * Vérifie si un rôle est strictement supérieur à un autre
 */
export function isRoleHigher(role: RoleName, targetRole: RoleName): boolean {
  return RoleLevels[role] > RoleLevels[targetRole]
}

/**
 * Retourne les rôles assignables par un utilisateur donné
 * (tous les rôles de niveau strictement inférieur)
 */
export function getAssignableRoles(userRole: RoleName): RoleName[] {
  const userLevel = RoleLevels[userRole]
  return (Object.entries(RoleLevels) as [RoleName, number][])
    .filter(([_, level]) => level < userLevel)
    .map(([name]) => name)
}