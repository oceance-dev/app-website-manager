import { Folder, FolderPermission } from '../types';

/**
 * Vérifie si un utilisateur peut effectuer une action sur un dossier
 * @param userId - ID de l'utilisateur
 * @param folder - Le dossier à vérifier
 * @param action - L'action à effectuer ('view', 'add', 'delete')
 * @returns true si l'utilisateur a la permission, false sinon
 */
export function canUserAccessFolder(
  userId: number,
  folder: Folder | undefined,
  action: 'view' | 'add' | 'delete'
): boolean {
  if (!folder) return false;

  // Gérer les permissions du backend (format objet)
  if (folder.permissions && typeof folder.permissions === 'object' && !Array.isArray(folder.permissions)) {
    const backendPerms = folder.permissions as any;

    // Si l'utilisateur est le créateur du dossier, il a tous les droits
    if (folder.createdBy === userId) return true;

    switch (action) {
      case 'view':
        return backendPerms.canView === true;
      case 'add':
        return backendPerms.canUpload === true || backendPerms.canManage === true;
      case 'delete':
        return backendPerms.canManage === true;
      default:
        return false;
    }
  }

  // Gérer l'ancien format (tableau de permissions)
  if (Array.isArray(folder.permissions)) {
    const userPermission = folder.permissions.find((p) => p.userId === userId);
    if (!userPermission) return false;

    switch (action) {
      case 'view':
        return ['viewer', 'editor', 'admin'].includes(userPermission.role);
      case 'add':
        return ['editor', 'admin'].includes(userPermission.role);
      case 'delete':
        return userPermission.role === 'admin';
      default:
        return false;
    }
  }

  return false;
}

/**
 * Retourne le rôle d'un utilisateur sur un dossier
 * @param userId - ID de l'utilisateur
 * @param folder - Le dossier à vérifier
 * @returns Le rôle de l'utilisateur ou null s'il n'a pas accès
 */
export function getUserRoleOnFolder(
  userId: number,
  folder: Folder | undefined
): 'viewer' | 'editor' | 'admin' | null {
  if (!folder) return null;

  // Gérer les permissions du backend (format objet)
  if (folder.permissions && typeof folder.permissions === 'object' && !Array.isArray(folder.permissions)) {
    const backendPerms = folder.permissions as any;

    // Si l'utilisateur est le créateur du dossier
    if (folder.createdBy === userId) return 'admin';

    if (backendPerms.canManage) return 'admin';
    if (backendPerms.canUpload) return 'editor';
    if (backendPerms.canView) return 'viewer';
    return null;
  }

  // Gérer l'ancien format (tableau de permissions)
  if (Array.isArray(folder.permissions)) {
    const userPermission = folder.permissions.find((p) => p.userId === userId);
    return userPermission ? userPermission.role : null;
  }

  return null;
}

/**
 * Filtre les dossiers accessibles par un utilisateur
 * @param userId - ID de l'utilisateur
 * @param folders - Liste des dossiers
 * @param minRole - Rôle minimum requis (optionnel)
 * @returns Liste des dossiers accessibles
 */
export function getAccessibleFolders(
  userId: number,
  folders: Folder[],
  minRole?: 'viewer' | 'editor' | 'admin'
): Folder[] {
  return folders.filter((folder) => {
    const userRole = getUserRoleOnFolder(userId, folder);
    if (!userRole) return false;

    if (!minRole) return true;

    const roleHierarchy = { viewer: 1, editor: 2, admin: 3 };
    return roleHierarchy[userRole] >= roleHierarchy[minRole];
  });
}

/**
 * Vérifie si un utilisateur peut ajouter une permission sur un dossier
 * @param userId - ID de l'utilisateur
 * @param folder - Le dossier à vérifier
 * @returns true si l'utilisateur est admin du dossier
 */
export function canManagePermissions(
  userId: number,
  folder: Folder | undefined
): boolean {
  return canUserAccessFolder(userId, folder, 'delete');
}

/**
 * Retourne une icône et une couleur selon le rôle
 * @param role - Le rôle
 * @returns Objet avec l'icône et la couleur
 */
export function getRoleDisplay(role: 'viewer' | 'editor' | 'admin'): {
  icon: string;
  color: string;
  label: string;
} {
  switch (role) {
    case 'viewer':
      return { icon: '👁️', color: '#64748b', label: 'Lecteur' };
    case 'editor':
      return { icon: '✏️', color: '#3b82f6', label: 'Éditeur' };
    case 'admin':
      return { icon: '🔑', color: '#ef4444', label: 'Admin' };
  }
}
