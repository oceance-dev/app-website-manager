import { User, UserRole } from '../types';

/**
 * Obtenir le displayName du rôle d'un utilisateur
 * Compatible avec l'ancien format (string) et le nouveau format (object)
 */
export function getRoleDisplayName(user: User | null): string {
  if (!user || !user.role) return '';

  // Nouveau format (object)
  if (typeof user.role === 'object') {
    return user.role.displayName;
  }

  // Ancien format (string)
  return user.role;
}

/**
 * Obtenir le nom technique du rôle d'un utilisateur
 */
export function getRoleName(user: User | null): string {
  if (!user || !user.role) return '';

  // Nouveau format (object)
  if (typeof user.role === 'object') {
    return user.role.name;
  }

  // Ancien format (string) - convertir en nom technique
  const roleMapping: Record<string, string> = {
    'SuperAdmin': 'super_admin',
    'Admin': 'admin',
    'Président': 'president',
    'Directeur de formation': 'directeur_formation',
    'Trésorier': 'tresorier',
    'Encadrant': 'formateur',
    'Cadet': 'cadet',
    'Candidat': 'candidat',
  };

  return roleMapping[user.role] || user.role.toLowerCase();
}

/**
 * Vérifier si l'utilisateur a un rôle spécifique
 * @param user L'utilisateur
 * @param roleName Le nom technique du rôle (ex: 'admin', 'president', 'candidat')
 */
export function hasRole(user: User | null, roleName: string): boolean {
  if (!user) return false;

  return getRoleName(user) === roleName;
}

/**
 * Vérifier si l'utilisateur a l'un des rôles spécifiés
 * @param user L'utilisateur
 * @param roleNames Liste des noms techniques de rôles
 */
export function hasAnyRole(user: User | null, roleNames: string[]): boolean {
  if (!user) return false;

  const userRoleName = getRoleName(user);
  return roleNames.includes(userRoleName);
}
