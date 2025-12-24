export const RESOURCES = {
    CADET: 'cadet',
    CANDIDAT: 'candidat',
    DOCUMENT: 'document',
    USER: 'user',
    ROLE: 'role',
    ABSENCE: 'absence'
} as const;

export const ACTIONS = {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    READ_OWN: 'read_own',
    UPDATE_OWN: 'update_own',
    DELETE_OWN: 'delete_own',
    MANAGE: 'manage'
} as const;

export type Resource = typeof RESOURCES[keyof typeof RESOURCES];
export type Action = typeof ACTIONS[keyof typeof ACTIONS];

export interface Permission {
    resource: Resource;
    actions: Action[];
    conditions?: {
        ownerOnly?: boolean;
        fields?: string[];
    };
}

export const DEFAULT_ROLES: Record<string, Permission[]> = {
    admin: [
        { resource: RESOURCES.CANDIDAT, actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: RESOURCES.DOCUMENT, actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: RESOURCES.USER, actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: RESOURCES.ROLE, actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: RESOURCES.ABSENCE, actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: RESOURCES.CADET, actions: ['create', 'read', 'update', 'delete', 'manage'] },
    ]
}