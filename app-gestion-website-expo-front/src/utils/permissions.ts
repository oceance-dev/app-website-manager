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

  const userPermission = folder.permissions.find((p) => p.userId === userId);
  return userPermission ? userPermission.role : null;
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
    const userPermission = folder.permissions.find((p) => p.userId === userId);
    if (!userPermission) return false;

    if (!minRole) return true;

    const roleHierarchy = { viewer: 1, editor: 2, admin: 3 };
    return roleHierarchy[userPermission.role] >= roleHierarchy[minRole];
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
