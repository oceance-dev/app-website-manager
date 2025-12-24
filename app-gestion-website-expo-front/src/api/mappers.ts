import { User } from '../types';
import { CadetResponse } from './types';

/**
 * Mappe les rôles du backend (snake_case) vers le frontend (PascalCase/Français)
 */
export const mapBackendRoleToFrontend = (backendRole: string): User['role'] => {
  const roleMapping: Record<string, User['role']> = {
    'super_admin': 'SuperAdmin',
    'admin': 'Admin',
    'président': 'Président',
    'tresorier': 'Trésorier',
    'directeur_formation': 'Encadrant',
    'formateur': 'Encadrant',
    'cadet': 'Cadet',
    'cadet_breveter': 'Ancien Cadet',
    'candidat': 'Candidat',
  };

  return roleMapping[backendRole] || 'Candidat';
};

/**
 * Convertit une date du format DD/MM/YYYY vers YYYY-MM-DD
 * @param dateStr - Date au format DD/MM/YYYY
 * @returns Date au format YYYY-MM-DD ou undefined
 */
export const convertDateFormat = (dateStr?: string): string | undefined => {
  if (!dateStr) return undefined;

  try {
    // Si la date est déjà au format YYYY-MM-DD, la retourner telle quelle
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // Convertir DD/MM/YYYY vers YYYY-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month}-${day}`;
    }

    return undefined;
  } catch (error) {
    console.error('Error converting date:', error);
    return undefined;
  }
};

/**
 * Mappe les données d'un cadet depuis l'API vers le format User
 * @param cadetResponse - Données du cadet depuis l'API
 * @returns Objet User compatible avec l'application
 */
export const mapCadetResponseToUser = (cadetResponse: CadetResponse): User => {
  return {
    id: typeof cadetResponse.id === 'string'
      ? parseInt(cadetResponse.id.replace(/\D/g, ''), 10) || 0
      : cadetResponse.id,
    lastname: cadetResponse.lastname,
    firstname: cadetResponse.firstname,
    email: cadetResponse.email,
    role: cadetResponse.role,
    statut: cadetResponse.status,  // Conversion status -> statut
    dateOfbirth: convertDateFormat(cadetResponse.dateOfBirth),  // Conversion format date
    sexe: cadetResponse.sexe,
    phone: cadetResponse.phone,
    courseAccess: cadetResponse.courseAccess,
  };
};

/**
 * Mappe un tableau de cadets depuis l'API vers le format User[]
 * @param cadets - Tableau de cadets depuis l'API
 * @returns Tableau d'objets User
 */
export const mapCadetsArrayToUsers = (cadets: CadetResponse[]): User[] => {
  return cadets.map(mapCadetResponseToUser);
};

/**
 * Convertit un objet User vers le format attendu par l'API pour la mise à jour
 * @param user - Objet User
 * @returns Objet au format API
 */
export const mapUserToCadetRequest = (user: Partial<User>): Partial<CadetResponse> => {
  const request: Partial<CadetResponse> = {};

  if (user.lastname) request.lastname = user.lastname;
  if (user.firstname) request.firstname = user.firstname;
  if (user.email) request.email = user.email;
  if (user.role) request.role = user.role as 'Cadet' | 'Cadet Breveté' | 'Ancien Cadet';
  if (user.statut) request.status = user.statut;
  if (user.phone) request.phone = user.phone;
  if (user.sexe !== undefined) request.sexe = user.sexe;
  if (user.courseAccess !== undefined) request.courseAccess = user.courseAccess;

  // Convertir la date si présente
  if (user.dateOfbirth) {
    // Convertir YYYY-MM-DD vers DD/MM/YYYY pour l'API
    const [year, month, day] = user.dateOfbirth.split('-');
    request.dateOfBirth = `${day}/${month}/${year}`;
  }

  return request;
};
