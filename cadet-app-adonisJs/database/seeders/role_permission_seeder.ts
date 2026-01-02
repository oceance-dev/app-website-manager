import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Role from '#models/role'
import Permission from '#models/permission'

export default class extends BaseSeeder {
  async run() {
    /**
     * ===========================================
     * PERMISSIONS
     * ===========================================
     */
    const permissionsData = [
      // Associations
      { name: 'associations.read', displayName: 'Voir les associations', group: 'associations', description: 'Permet de voir la liste des associations' },
      { name: 'associations.create', displayName: 'Créer une association', group: 'associations', description: 'Permet de créer une nouvelle association' },
      { name: 'associations.update', displayName: 'Modifier une association', group: 'associations', description: 'Permet de modifier une association' },
      { name: 'associations.delete', displayName: 'Supprimer une association', group: 'associations', description: 'Permet de supprimer une association' },
      { name: 'associations.approve', displayName: 'Approuver une association', group: 'associations', description: 'Permet d\'approuver une association en attente' },
      { name: 'associations.suspend', displayName: 'Suspendre une association', group: 'associations', description: 'Permet de suspendre une association' },

      // Utilisateurs
      { name: 'users.read', displayName: 'Voir les utilisateurs', group: 'users', description: 'Permet de voir la liste des utilisateurs' },
      { name: 'users.read_own', displayName: 'Voir son profil', group: 'users', description: 'Permet de voir son propre profil' },
      { name: 'users.create', displayName: 'Créer un utilisateur', group: 'users', description: 'Permet de créer un nouvel utilisateur' },
      { name: 'users.update', displayName: 'Modifier un utilisateur', group: 'users', description: 'Permet de modifier un utilisateur' },
      { name: 'users.update_own', displayName: 'Modifier son profil', group: 'users', description: 'Permet de modifier son propre profil' },
      { name: 'users.delete', displayName: 'Supprimer un utilisateur', group: 'users', description: 'Permet de supprimer un utilisateur' },
      { name: 'users.reset_password', displayName: 'Réinitialiser un mot de passe', group: 'users', description: 'Permet de réinitialiser le mot de passe d\'un utilisateur' },

      // Cadets
      { name: 'cadets.read', displayName: 'Voir les cadets', group: 'cadets', description: 'Permet de voir la liste des cadets' },
      { name: 'cadets.read_own', displayName: 'Voir son dossier cadet', group: 'cadets', description: 'Permet de voir son propre dossier cadet' },
      { name: 'cadets.create', displayName: 'Créer un cadet', group: 'cadets', description: 'Permet de créer un nouveau cadet' },
      { name: 'cadets.update', displayName: 'Modifier un cadet', group: 'cadets', description: 'Permet de modifier un cadet' },
      { name: 'cadets.update_own', displayName: 'Modifier son dossier cadet', group: 'cadets', description: 'Permet de modifier son propre dossier cadet' },
      { name: 'cadets.delete', displayName: 'Supprimer un cadet', group: 'cadets', description: 'Permet de supprimer un cadet' },
      { name: 'cadets.validate', displayName: 'Valider une inscription cadet', group: 'cadets', description: 'Permet de valider l\'inscription d\'un cadet' },
      { name: 'cadets.graduate', displayName: 'Breveter un cadet', group: 'cadets', description: 'Permet de breveter un cadet' },

      // Candidats
      { name: 'candidates.read', displayName: 'Voir les candidats', group: 'candidates', description: 'Permet de voir la liste des candidats' },
      { name: 'candidates.read_own', displayName: 'Voir sa candidature', group: 'candidates', description: 'Permet de voir sa propre candidature' },
      { name: 'candidates.create', displayName: 'Créer une candidature', group: 'candidates', description: 'Permet de créer une candidature' },
      { name: 'candidates.update', displayName: 'Modifier une candidature', group: 'candidates', description: 'Permet de modifier une candidature' },
      { name: 'candidates.update_own', displayName: 'Modifier sa candidature', group: 'candidates', description: 'Permet de modifier sa propre candidature' },
      { name: 'candidates.delete', displayName: 'Supprimer une candidature', group: 'candidates', description: 'Permet de supprimer une candidature' },
      { name: 'candidates.validate', displayName: 'Valider une candidature', group: 'candidates', description: 'Permet de valider une candidature' },
      { name: 'candidates.reject', displayName: 'Rejeter une candidature', group: 'candidates', description: 'Permet de rejeter une candidature' },

      // Documents
      { name: 'documents.read', displayName: 'Voir les documents', group: 'documents', description: 'Permet de voir tous les documents' },
      { name: 'documents.read_own', displayName: 'Voir ses documents', group: 'documents', description: 'Permet de voir ses propres documents' },
      { name: 'documents.upload', displayName: 'Uploader un document', group: 'documents', description: 'Permet d\'uploader un document' },
      { name: 'documents.delete', displayName: 'Supprimer un document', group: 'documents', description: 'Permet de supprimer un document' },
      { name: 'documents.validate', displayName: 'Valider un document', group: 'documents', description: 'Permet de valider un document' },

      // Folders
      { name: 'folders.create', displayName: 'Créer un dossier', group: 'folders', description: 'Permet de créer un nouveau dossier' },
      { name: 'folders.read', displayName: 'Voir les dossiers', group: 'folders', description: 'Permet de voir les dossiers' },
      { name: 'folders.update', displayName: 'Modifier un dossier', group: 'folders', description: 'Permet de modifier un dossier' },
      { name: 'folders.delete', displayName: 'Supprimer un dossier', group: 'folders', description: 'Permet de supprimer un dossier' },
      { name: 'folders.manage', displayName: 'Gérer les dossiers', group: 'folders', description: 'Permet de gérer entièrement les dossiers' },

      // Formations
      { name: 'formations.read', displayName: 'Voir les formations', group: 'formations', description: 'Permet de voir la liste des formations' },
      { name: 'formations.create', displayName: 'Créer une formation', group: 'formations', description: 'Permet de créer une formation' },
      { name: 'formations.update', displayName: 'Modifier une formation', group: 'formations', description: 'Permet de modifier une formation' },
      { name: 'formations.delete', displayName: 'Supprimer une formation', group: 'formations', description: 'Permet de supprimer une formation' },
      { name: 'formations.manage', displayName: 'Gérer les formations', group: 'formations', description: 'Permet de gérer entièrement les formations' },

      // Finances
      { name: 'finances.read', displayName: 'Voir les finances', group: 'finances', description: 'Permet de voir les informations financières' },
      { name: 'finances.create', displayName: 'Créer une transaction', group: 'finances', description: 'Permet de créer une transaction' },
      { name: 'finances.update', displayName: 'Modifier une transaction', group: 'finances', description: 'Permet de modifier une transaction' },
      { name: 'finances.delete', displayName: 'Supprimer une transaction', group: 'finances', description: 'Permet de supprimer une transaction' },
      { name: 'finances.export', displayName: 'Exporter les finances', group: 'finances', description: 'Permet d\'exporter les données financières' },
      { name: 'finances.manage', displayName: 'Gérer les finances', group: 'finances', description: 'Permet de gérer entièrement les finances' },

      // Rôles & Permissions (super_admin uniquement)
      { name: 'roles.read', displayName: 'Voir les rôles', group: 'roles', description: 'Permet de voir la liste des rôles' },
      { name: 'roles.create', displayName: 'Créer un rôle', group: 'roles', description: 'Permet de créer un nouveau rôle' },
      { name: 'roles.update', displayName: 'Modifier un rôle', group: 'roles', description: 'Permet de modifier un rôle' },
      { name: 'roles.delete', displayName: 'Supprimer un rôle', group: 'roles', description: 'Permet de supprimer un rôle' },
      { name: 'permissions.read', displayName: 'Voir les permissions', group: 'roles', description: 'Permet de voir la liste des permissions' },

      // Dashboard & Stats
      { name: 'dashboard.view', displayName: 'Voir le tableau de bord', group: 'dashboard', description: 'Permet d\'accéder au tableau de bord' },
      { name: 'stats.view', displayName: 'Voir les statistiques', group: 'dashboard', description: 'Permet de voir les statistiques' },
      { name: 'stats.export', displayName: 'Exporter les statistiques', group: 'dashboard', description: 'Permet d\'exporter les statistiques' },
    ]

    // Créer les permissions
    const permissions: Record<string, Permission> = {}
    for (const perm of permissionsData) {
      const permission = await Permission.updateOrCreate(
        { name: perm.name },
        { ...perm, isActive: true }
      )
      permissions[perm.name] = permission
    }

    console.log(`✅ ${Object.keys(permissions).length} permissions créées/mises à jour`)

    /**
     * ===========================================
     * RÔLES
     * ===========================================
     */
    const rolesData = [
      // ===== SUPER ADMIN CADEP =====
      {
        name: 'super_admin',
        displayName: 'Super Administrateur',
        description: 'Administrateur CADEP avec accès total à toutes les associations',
        level: 100,
        isSystem: true,
        permissions: Object.keys(permissions), // Toutes les permissions
      },

      // ===== ADMIN ASSOCIATION =====
      {
        name: 'admin',
        displayName: 'Administrateur',
        description: 'Administrateur technique de l\'association',
        level: 95,
        isSystem: true,
        permissions: [
          'users.read', 'users.read_own', 'users.create', 'users.update', 'users.update_own', 'users.delete', 'users.reset_password',
          'cadets.read', 'cadets.create', 'cadets.update', 'cadets.delete', 'cadets.validate', 'cadets.graduate',
          'candidates.read', 'candidates.create', 'candidates.update', 'candidates.delete', 'candidates.validate', 'candidates.reject',
          'documents.read', 'documents.read_own', 'documents.upload', 'documents.delete', 'documents.validate',
          'folders.create', 'folders.read', 'folders.update', 'folders.delete', 'folders.manage',
          'formations.read', 'formations.create', 'formations.update', 'formations.delete', 'formations.manage',
          'finances.read', 'finances.create', 'finances.update', 'finances.delete', 'finances.export', 'finances.manage',
          'roles.read',
          'dashboard.view', 'stats.view', 'stats.export',
        ],
      },

      // ===== PRÉSIDENT =====
      {
        name: 'president',
        displayName: 'Président',
        description: 'Président de l\'association avec pouvoirs étendus',
        level: 90,
        isSystem: true,
        isUnique: true,
        permissions: [
          'users.read', 'users.read_own', 'users.create', 'users.update', 'users.update_own', 'users.delete',
          'cadets.read', 'cadets.create', 'cadets.update', 'cadets.delete', 'cadets.validate', 'cadets.graduate',
          'candidates.read', 'candidates.create', 'candidates.update', 'candidates.delete', 'candidates.validate', 'candidates.reject',
          'documents.read', 'documents.read_own', 'documents.upload', 'documents.delete', 'documents.validate',
          'formations.read', 'formations.create', 'formations.update', 'formations.delete', 'formations.manage',
          'finances.read', 'finances.create', 'finances.update', 'finances.delete', 'finances.export', 'finances.manage',
          'roles.read',
          'dashboard.view', 'stats.view', 'stats.export',
        ],
      },

      // ===== DIRECTEUR DE FORMATION =====
      {
        name: 'directeur_formation',
        displayName: 'Directeur de Formation',
        description: 'Responsable de la formation des cadets',
        level: 80,
        isSystem: true,
        isUnique: true,
        permissions: [
          'users.read', 'users.read_own', 'users.update_own',
          'cadets.read', 'cadets.create', 'cadets.update', 'cadets.validate', 'cadets.graduate',
          'candidates.read', 'candidates.update', 'candidates.validate', 'candidates.reject',
          'documents.read', 'documents.read_own', 'documents.upload', 'documents.validate',
          'formations.read', 'formations.create', 'formations.update', 'formations.delete', 'formations.manage',
          'dashboard.view', 'stats.view',
        ],
      },

      // ===== TRÉSORIER =====
      {
        name: 'tresorier',
        displayName: 'Trésorier',
        description: 'Responsable des finances de l\'association',
        level: 75,
        isSystem: true,
        isUnique: true,
        permissions: [
          'users.read', 'users.read_own', 'users.update_own',
          'cadets.read',
          'candidates.read',
          'documents.read', 'documents.read_own', 'documents.upload',
          'finances.read', 'finances.create', 'finances.update', 'finances.delete', 'finances.export', 'finances.manage',
          'dashboard.view', 'stats.view', 'stats.export',
        ],
      },

      // ===== SECRÉTAIRE =====
      {
        name: 'secretaire',
        displayName: 'Secrétaire',
        description: 'Secrétaire de l\'association',
        level: 70,
        isSystem: true,
        isUnique: true,
        permissions: [
          'users.read', 'users.read_own', 'users.create', 'users.update', 'users.update_own',
          'cadets.read', 'cadets.create', 'cadets.update',
          'candidates.read', 'candidates.create', 'candidates.update', 'candidates.validate', 'candidates.reject',
          'documents.read', 'documents.read_own', 'documents.upload', 'documents.delete', 'documents.validate',
          'dashboard.view', 'stats.view',
        ],
      },

      // ===== STAFF =====
      {
        name: 'staff',
        displayName: 'Staff',
        description: 'Membre du staff de l\'association',
        level: 60,
        isSystem: true,
        permissions: [
          'users.read', 'users.read_own', 'users.update_own',
          'cadets.read', 'cadets.update',
          'candidates.read',
          'documents.read', 'documents.read_own', 'documents.upload',
          'formations.read',
          'dashboard.view',
        ],
      },

      // ===== FORMATEUR =====
      {
        name: 'formateur',
        displayName: 'Formateur',
        description: 'Formateur/Instructeur des cadets',
        level: 55,
        isSystem: true,
        permissions: [
          'users.read_own', 'users.update_own',
          'cadets.read', 'cadets.update',
          'documents.read', 'documents.read_own', 'documents.upload',
          'formations.read', 'formations.create', 'formations.update',
          'dashboard.view',
        ],
      },

      // ===== CADET BREVETÉ =====
      {
        name: 'cadet_brevete',
        displayName: 'Cadet Breveté',
        description: 'Cadet ayant obtenu son brevet',
        level: 40,
        isSystem: true,
        permissions: [
          'users.read_own', 'users.update_own',
          'cadets.read_own', 'cadets.update_own',
          'documents.read_own', 'documents.upload',
          'formations.read',
          'dashboard.view',
        ],
      },

      // ===== CADET =====
      {
        name: 'cadet',
        displayName: 'Cadet',
        description: 'Cadet en formation',
        level: 30,
        isSystem: true,
        permissions: [
          'users.read_own', 'users.update_own',
          'cadets.read_own', 'cadets.update_own',
          'documents.read_own', 'documents.upload',
          'formations.read',
          'dashboard.view',
        ],
      },

      // ===== CANDIDAT =====
      {
        name: 'candidat',
        displayName: 'Candidat',
        description: 'Candidat en attente de validation',
        level: 10,
        isSystem: true,
        permissions: [
          'users.read_own', 'users.update_own',
          'candidates.read_own', 'candidates.update_own',
          'documents.read_own', 'documents.upload',
        ],
      },
    ]

    // Créer les rôles et attacher les permissions
    for (const roleData of rolesData) {
      const { permissions: rolePermissions, ...roleInfo } = roleData

      const role = await Role.updateOrCreate(
        { name: roleInfo.name },
        { ...roleInfo, isActive: true }
      )

      // Attacher les permissions
      const permissionIds = rolePermissions
        .map((permName) => permissions[permName]?.id)
        .filter((id): id is number => id !== undefined)

      await role.related('permissions').sync(permissionIds)

      console.log(`✅ Rôle "${role.displayName}" créé avec ${permissionIds.length} permissions`)
    }

    console.log('✅ Seeder roles_permissions terminé')
  }
}