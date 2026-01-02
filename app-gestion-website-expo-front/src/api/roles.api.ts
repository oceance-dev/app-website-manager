import { api } from './apiRequest';
import { API_CONFIG, ApiResponse, handleApiResponse, getAuthHeaders, fetchWithTimeout } from './config';
import { UrlApi } from './url.api';

// Types pour les rôles
export interface Role {
  id: number;
  name: string;
  displayName: string;
  level: number;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: number;
  name: string;
  displayName: string;
  category: string;
  description?: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface GetRolesResponse {
  roles: Role[];
  total: number;
}

export const RolesApi = {
  /**
   * Récupérer tous les rôles (authentifié)
   */
  async getAll(): Promise<ApiResponse<GetRolesResponse>> {
    const data = await api.get<GetRolesResponse>(UrlApi.rolesApi.getAll);
    return { success: true, data };
  },
  /**
   * Récupérer les détails d'un rôle (authentifié)
   */
  async getById(id: number): Promise<ApiResponse<{ role: RoleWithPermissions }>> {
    const data = await api.get<{ role: RoleWithPermissions }>(UrlApi.rolesApi.get.replace(':id', id.toString()));
    return { success: true, data };
  },

  /**
   * Récupérer les rôles assignables par l'utilisateur courant (authentifié)
   */
  async getAssignable(): Promise<ApiResponse<{ roles: Role[] }>> {
    const data = await api.get<{ roles: Role[] }>(UrlApi.rolesApi.assignable);
    return { success: true, data };
  },
  /**
   * Récupérer mes permissions (authentifié)
   */
  async getMyPermissions(): Promise<ApiResponse<{ permissions: Permission[] }>> {
    const data = await api.get<{ permissions: Permission[] }>(UrlApi.rolesApi.myPermissions);
    return { success: true, data };
  },

  /**
   * Récupérer toutes les permissions disponibles (authentifié)
   */
  async getAllPermissions(): Promise<ApiResponse<{ permissions: Permission[] }>> {
    const data = await api.get<{ permissions: Permission[] }>(UrlApi.rolesApi.permissions);
    return { success: true, data };
  },
};
