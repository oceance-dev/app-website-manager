import { ApiResponse } from './config';
import { api } from './apiRequest';
import { API_ROUTES } from './url.api';
import { Role, Permission, RoleWithPermissions } from './roles.api';

// Types pour StaffApp
export interface CreateRoleData {
  name: string;
  displayName: string;
  level: number;
  description?: string;
}

export interface UpdateRoleData {
  name?: string;
  displayName?: string;
  level?: number;
  description?: string;
  isActive?: boolean;
}

export interface UpdatePermissionsData {
  permissionIds: number[];
}

export interface UserWithRole {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export const StaffAppApi = {
  /**
   * Créer un nouveau rôle (Super Admin)
   */
  async createRole(roleData: CreateRoleData): Promise<ApiResponse<{ role: Role }>> {
    const data = await api.post<{ role: Role }>(
      API_ROUTES.staffApp.roles.create,
      roleData as unknown as Record<string, unknown>
    );
    return { success: true, data };
  },

  /**
   * Mettre à jour un rôle (Super Admin)
   */
  async updateRole(id: number, roleData: UpdateRoleData): Promise<ApiResponse<{ role: Role }>> {
    const data = await api.put<{ role: Role }>(
      API_ROUTES.staffApp.roles.update(id),
      roleData as unknown as Record<string, unknown>
    );
    return { success: true, data };
  },

  /**
   * Supprimer un rôle (Super Admin)
   */
  async deleteRole(id: number): Promise<ApiResponse<void>> {
    await api.delete(API_ROUTES.staffApp.roles.delete(id));
    return { success: true, data: undefined };
  },

  /**
   * Mettre à jour les permissions d'un rôle (Super Admin)
   */
  async updatePermissions(
    id: number,
    permissionsData: UpdatePermissionsData
  ): Promise<ApiResponse<{ role: RoleWithPermissions }>> {
    const data = await api.put<{ role: RoleWithPermissions }>(
      API_ROUTES.staffApp.roles.updatePermissions(id),
      permissionsData as unknown as Record<string, unknown>
    );
    return { success: true, data };
  },

  /**
   * Récupérer les utilisateurs ayant un rôle spécifique (Super Admin)
   */
  async getUsersByRole(roleId: number): Promise<ApiResponse<{ users: UserWithRole[] }>> {
    const data = await api.get<{ users: UserWithRole[] }>(
      API_ROUTES.staffApp.roles.getUserRole(roleId)
    );
    return { success: true, data };
  },
};
