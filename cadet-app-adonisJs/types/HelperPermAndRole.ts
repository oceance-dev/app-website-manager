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
 * Rôle disponibles dans l'application
 * - super_admin
 * - admin
 * - president
 * - directeur de formation
 * - trésoriere
 * - personnel administratif
 * - formateur
 * - cadet
 * - cadet breveter
 * - candidat
 */
export enum UserRole {
    SUPER_ADMIN = 'super_admin',
    ADMIN = 'admin',
    PRESIDENT = 'president',
    TRESORIER = 'tresorier',
    SECRETAIRE = 'secretaire',
    //STAFF_ASSOCIATION = 'Personnel administratif',
    DIRECTEUR_FORMATION = 'directeur_formation',
    FORMATEUR = 'formateur',
    CADET = 'cadet',
    CADET_BREVETER = 'cadet_breveter',
    CANDIDAT = 'candidat'
}

export enum Permission {

    // Associations (admin uniquement)
    ASSOCIATIONS_READ = 'associations:read',
    ASSOCIATIONS_CREATE = 'associations:create',
    ASSOCIATIONS_UPDATE = 'associations:update',
    ASSOCIATIONS_DELETE = 'associations:delete',
    ASSOCIATIONS_APPROVE = 'associations:approve',

    USERS_READ = 'user:read',
    USERS_CREATE = 'user:create',
    USERS_UPDATE = 'user:update',
    USERS_DELETE = 'user:delete',
    USERS_MANAGE_ROLES = 'user:manage_roles',

    // Candidat
    CANDIDAT_READ = 'candidat:read',
    CANDIDAT_CREATE = 'candidat:create',
    CANDIDAT_UPDATE = 'candidat:update',

    // Cadet 
    CADETS_READ = 'cadets:read',
    CADETS_READ_OWN = 'cadets:readt_own',
    CADETS_CREATE = 'cadets:create',
    CADETS_UPDATE = 'cadets:update',
    CADETS_UPDATE_OWN = 'cadets:update_own',
    CADETS_DELETE = 'cadets:delete',
    CADETS_EXPORT = 'cadets:export',

    // INSCRIPTION ASSOCIATION
    REGISTRATIONS_ORGANIZATION_READ = 'registration_organization:read',
    REGISTRATIONS_ORGANIZATION_CREATE = 'registratio_organization:create',

    // INSCRIPTION MEMBRE ASSOCIATION 

    REGISTRATIONS_MEMBER_ORGANIZATION_READ = 'registration_member_organization:read',
    REGISTRATIONS_MEMBER_ORGANIZATION_CREATE = 'registration_member_organization:create',

    // DOCUMENT
    DOCUMENTS_READ = 'document:read',
    DOCUMENTS_READ_OWN = 'document:read_own',
    DOCUMENTS_CREATE = 'document:create',
    DOCUMENTS_UPLOAD = 'document:upload',
    DOCUMENTS_UPLOAD_OWN = 'document:upload_own',
    DOCUMENTS_DELETE = 'document:delete',
    DOCUMENTS_DELETE_OWN = 'document:delete_own',
    DOCUMENTS_DOWNLOAD = 'document:download',

    // ABSENCES 
    ABSENCES_READ = 'absences:read',
    ABSENCES_READ_OWN = 'absences:read_own',
    ABSENCES_CREATE = 'absences:create',
    ABSENCES_UPDATE = 'absences:update',
    ABSENCES_DELETE = 'absences:delete',
    ABSENCES_JUSTIFY = 'absences:justify',

    // STOCK
    EQUIPMENT_READ = 'equipement:read',
    EQUIPMENT_CREATE = 'equipement:create',
    EQUIPMENT_UPDATE = 'equipement:update',
    EQUIPMENT_DELETE = 'equipement:delete',
    EQUIPMENT_ASSIGN = 'equipement:assign',

    // RAPPORTS
    REPORTS_READ = 'reports:read',
    REPORTS_GENERATE = 'reports:generate',
    REPORTS_EXPORT = 'reports:export',

    // SYSTEME
    SYSTEM_SETTINGS = 'system:settings',
    SYSTEM_AUDIT_LOGS = 'system:audit_logs',
    SYSTEM_BACKUP = 'system:backup',
}


/**
 * Mapping des rôles vers leurs permissions par défaut
 * 
 */
export const RolePermissions: Record<UserRole, Permission[]> = {
    [UserRole.SUPER_ADMIN]: Object.values(Permission),

    [UserRole.ADMIN]: [
        Permission.USERS_READ,
        Permission.USERS_CREATE,
        Permission.USERS_UPDATE,
        Permission.USERS_DELETE,
        Permission.CANDIDAT_CREATE,
        Permission.CANDIDAT_READ,
        Permission.CANDIDAT_UPDATE,
        Permission.CADETS_READ,
        Permission.CADETS_CREATE,
        Permission.CADETS_UPDATE,
        Permission.CADETS_DELETE,
        Permission.CADETS_EXPORT,
        Permission.REGISTRATIONS_ORGANIZATION_READ,
        Permission.REGISTRATIONS_ORGANIZATION_CREATE,
        Permission.REGISTRATIONS_ORGANIZATION_READ,
        Permission.REGISTRATIONS_MEMBER_ORGANIZATION_CREATE,
        Permission.DOCUMENTS_READ,
        Permission.DOCUMENTS_UPLOAD,
        Permission.DOCUMENTS_DELETE,
        Permission.DOCUMENTS_DOWNLOAD,
        Permission.ABSENCES_READ,
        Permission.ABSENCES_CREATE,
        Permission.ABSENCES_UPDATE,
        Permission.ABSENCES_DELETE,
        Permission.ABSENCES_JUSTIFY,
        Permission.EQUIPMENT_READ,
        Permission.EQUIPMENT_CREATE,
        Permission.EQUIPMENT_UPDATE,
        Permission.EQUIPMENT_DELETE,
        Permission.EQUIPMENT_ASSIGN,
        Permission.REPORTS_READ,
        Permission.REPORTS_GENERATE,
        Permission.REPORTS_EXPORT,
        Permission.SYSTEM_AUDIT_LOGS,
    ],
    
    [UserRole.PRESIDENT]: [
        Permission.USERS_READ,
        Permission.USERS_CREATE,
        Permission.USERS_UPDATE,
        Permission.USERS_DELETE,
        Permission.CANDIDAT_CREATE,
        Permission.CANDIDAT_READ,
        Permission.CANDIDAT_UPDATE,
        Permission.CADETS_READ,
        Permission.CADETS_CREATE,
        Permission.CADETS_UPDATE,
        Permission.CADETS_DELETE,
        Permission.CADETS_EXPORT,
        Permission.REGISTRATIONS_ORGANIZATION_READ,
        Permission.REGISTRATIONS_ORGANIZATION_CREATE,
        Permission.REGISTRATIONS_ORGANIZATION_READ,
        Permission.REGISTRATIONS_MEMBER_ORGANIZATION_CREATE,
        Permission.DOCUMENTS_READ,
        Permission.DOCUMENTS_UPLOAD,
        Permission.DOCUMENTS_DELETE,
        Permission.DOCUMENTS_DOWNLOAD,
        Permission.ABSENCES_READ,
        Permission.ABSENCES_CREATE,
        Permission.ABSENCES_UPDATE,
        Permission.ABSENCES_DELETE,
        Permission.ABSENCES_JUSTIFY,
        Permission.EQUIPMENT_READ,
        Permission.EQUIPMENT_CREATE,
        Permission.EQUIPMENT_UPDATE,
        Permission.EQUIPMENT_DELETE,
        Permission.EQUIPMENT_ASSIGN,
        Permission.REPORTS_READ,
        Permission.REPORTS_GENERATE,
        Permission.REPORTS_EXPORT,
    ],

    [UserRole.TRESORIER]: [
        Permission.USERS_READ,
        Permission.CANDIDAT_READ,
        Permission.CADETS_READ,
        Permission.CADETS_EXPORT,
        Permission.DOCUMENTS_READ,
        Permission.DOCUMENTS_UPLOAD,
        Permission.DOCUMENTS_DELETE,
        Permission.DOCUMENTS_DOWNLOAD,
        Permission.EQUIPMENT_READ,
        Permission.REPORTS_READ,
        Permission.REPORTS_GENERATE,
        Permission.REPORTS_EXPORT,
    ], 

    [UserRole.SECRETAIRE]: [
        Permission.DOCUMENTS_CREATE,
        Permission.DOCUMENTS_READ_OWN,
        Permission.DOCUMENTS_UPLOAD_OWN,
        Permission.DOCUMENTS_DELETE_OWN
    ],

    [UserRole.DIRECTEUR_FORMATION]: [
        Permission.USERS_READ,
        Permission.USERS_CREATE,
        Permission.USERS_UPDATE,
        Permission.USERS_DELETE,
        Permission.CANDIDAT_CREATE,
        Permission.CANDIDAT_READ,
        Permission.CANDIDAT_UPDATE,
        Permission.CADETS_READ,
        Permission.CADETS_CREATE,
        Permission.CADETS_UPDATE,
        Permission.CADETS_DELETE,
        Permission.CADETS_EXPORT,
        Permission.DOCUMENTS_READ,
        Permission.DOCUMENTS_UPLOAD,
        Permission.DOCUMENTS_DELETE,
        Permission.DOCUMENTS_DOWNLOAD,
        Permission.ABSENCES_READ,
        Permission.ABSENCES_CREATE,
        Permission.ABSENCES_UPDATE,
        Permission.ABSENCES_DELETE,
        Permission.ABSENCES_JUSTIFY,
        Permission.EQUIPMENT_READ,
        Permission.EQUIPMENT_CREATE,
        Permission.EQUIPMENT_UPDATE,
        Permission.EQUIPMENT_DELETE,
        Permission.EQUIPMENT_ASSIGN,
        Permission.REPORTS_READ,
        Permission.REPORTS_GENERATE,
        Permission.REPORTS_EXPORT,
    ],

    [UserRole.FORMATEUR]: [
        Permission.USERS_READ,
        Permission.CANDIDAT_READ,
        Permission.CADETS_READ,
        Permission.CADETS_CREATE,
        Permission.CADETS_UPDATE,
        Permission.CADETS_DELETE,
        Permission.CADETS_EXPORT,
        Permission.DOCUMENTS_READ,
        Permission.DOCUMENTS_UPLOAD,
        Permission.DOCUMENTS_DELETE,
        Permission.DOCUMENTS_DOWNLOAD,
        Permission.ABSENCES_READ,
        Permission.ABSENCES_CREATE,
        Permission.ABSENCES_UPDATE,
        Permission.ABSENCES_DELETE,
        Permission.ABSENCES_JUSTIFY,
        Permission.EQUIPMENT_READ,
        Permission.EQUIPMENT_CREATE,
        Permission.EQUIPMENT_UPDATE,
        Permission.EQUIPMENT_DELETE,
        Permission.EQUIPMENT_ASSIGN,
    ],

    [UserRole.CADET]: [
        Permission.USERS_READ,
        Permission.USERS_CREATE,
        Permission.USERS_UPDATE,
        Permission.USERS_DELETE,
        Permission.CANDIDAT_CREATE,
        Permission.CANDIDAT_READ,
        Permission.CANDIDAT_UPDATE,
        Permission.CADETS_READ_OWN,
        Permission.CADETS_CREATE,
        Permission.CADETS_UPDATE_OWN,
        Permission.DOCUMENTS_READ_OWN,
        Permission.ABSENCES_READ_OWN
    ],

    [UserRole.CADET_BREVETER]: [
        Permission.USERS_READ,
        Permission.USERS_CREATE,
        Permission.USERS_UPDATE,
        Permission.USERS_DELETE,
        Permission.CADETS_READ,
        Permission.DOCUMENTS_READ,
        Permission.ABSENCES_READ,
        Permission.ABSENCES_JUSTIFY,
    ],

    [UserRole.CANDIDAT]: [
        Permission.USERS_READ,
        Permission.USERS_CREATE,
        Permission.USERS_UPDATE,
        Permission.USERS_DELETE,
        Permission.CANDIDAT_CREATE,
        Permission.CANDIDAT_READ,
        Permission.CANDIDAT_UPDATE,
        Permission.DOCUMENTS_READ,
        Permission.DOCUMENTS_UPLOAD,
        Permission.DOCUMENTS_DELETE,
        Permission.DOCUMENTS_DOWNLOAD,
    ]
}


export interface AuthReponse {
    user: {
        id: number
        email: string
        firstName: string
        lastName: string
        role: UserRole
    }
    token: {
        type: 'bearer'
        value: string
        expiresAt: string | null
    }
    refreshToken?: {
        value: string
        expiresAt: string
    }
}

export interface TokenPayload {
    userId: number
    role: UserRole
    permissions: Permission[]
    type: 'access' | 'refresh'
}