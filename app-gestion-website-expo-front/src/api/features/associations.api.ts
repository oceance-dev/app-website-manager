import { API_CONFIG, ApiResponse, handleApiResponse, getAuthHeaders, fetchWithTimeout } from '../config';
import { api } from '../apiRequest';
import { API_ROUTES } from '../url.api';

// Types pour les associations
export interface Association {
  id: number;
  name: string;
  rna?: string;
  siret?: string;
  email?: string;
  phone?: string;
  address?: string;
  city: string;
  postalCode: string;
  country: string;
  status: 'active' | 'pending' | 'rejected' | 'suspended';
  subscriptionEndDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  city_code: string;
  dateOfBirth: string;
  sexe: string;
}

export interface GetMembersResponse {
  members: Member[];
  total: number;
}

export interface AssociationWithStats extends Association {
  usersCount?: number;
  activeUsersCount?: number;
  pendingUsersCount?: number;
}

export interface GetAllAssociationsResponse {
  associations: AssociationWithStats[];
  total: number;
}

export interface GetPendingAssociationsResponse {
  associations: Association[];
  total: number;
}

export interface AssociationStats {
  activeUsers: number;
  inactiveUsers: number;
  documentsCount: number;
  foldersCount: number;
  usersByRole: any[];
}

export const AssociationsApi = {
  /**
   * Récupérer toutes les associations (public - pour inscription)
   */
  async getAllPublic(): Promise<ApiResponse<GetAllAssociationsResponse>> {
    const data = await api.get<GetAllAssociationsResponse>(API_ROUTES.associations.list, { skipAuth: true });
    return { success: true, data };
  },

  /**
   * Récupérer les rôles occupés dans une association (public - pour inscription)
   */
  async getOccupiedRoles(associationId: number): Promise<ApiResponse<{ roles: string[] }>> {
    const data = await api.get<{ roles: string[] }>(API_ROUTES.associations.occupiedRoles(associationId), { skipAuth: true });
    return { success: true, data };
  },

  /**
   * Récupérer toutes les associations (Super Admin)
   */
  async getAll(): Promise<ApiResponse<GetAllAssociationsResponse>> {

    const data = await api.get<GetAllAssociationsResponse>(API_ROUTES.associations.staffApp.list);
    return { success: true, data };
  },


  /**
   * Récupérer tous les membres d'une association (admin)
   */
  async getMembers(
    filters?: { isActive?: boolean; search?: string; page?: number; limit?: number }
  ): Promise<ApiResponse<GetMembersResponse>> {
    // Construire les query params
    const queryParams = new URLSearchParams();
    if (filters?.isActive !== undefined) queryParams.append('isActive', String(filters.isActive));
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.page) queryParams.append('page', String(filters.page));
    if (filters?.limit) queryParams.append('limit', String(filters.limit));

    const url = `${API_ROUTES.associations.admin.members.list}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const members = await api.get<GetMembersResponse>(url);

    return {
      success: true,
      data: members,
    };
  },

  /**
   * Permet de récupérer les membres en attente de validation
   * @param filters
   * @returns
   */
  async getMembersPending(
    filters?: { isActive?: boolean; search?: string; page?: number; limit?: number }
  ): Promise<ApiResponse<GetMembersResponse>> {

    const queryParams = new URLSearchParams();
    if (filters?.isActive !== undefined) queryParams.append('isActive', String(filters.isActive));
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.page) queryParams.append('page', String(filters.page));
    if (filters?.limit) queryParams.append('limit', String(filters.limit));

    const url = `${API_ROUTES.associations.admin.members.list}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await api.get<GetMembersResponse>(url);
    return { success: true, data };
  },

  /**
   * Permet d'approuver un membre d'une association
   * @param id
   * @param roleId
   * @returns
   */
  async approveMember(id: number, roleId: number): Promise<ApiResponse<{ member: Member }>> {
    const data = await api.post<{ member: Member }>(API_ROUTES.associations.admin.members.approve(id), { roleId });
    return { success: true, data };
  },

  /**
   * Permet de rejeteer un membre d'une association
   * @param id
   * @param reason
   * @returns
   */
  async rejectMember(id: number, reason: string): Promise<ApiResponse<{ member: Member }>> {
    const data = await api.post<{ member: Member }>(API_ROUTES.associations.admin.members.reject(id), { reason });
    return { success: true, data };
  },

  /**
   * Suspendre un membre d'une association
   * @param id
   * @param reason
   * @returns
   */
  async suspendMember(id: number, reason: string): Promise<ApiResponse<{ member: Member }>> {
    const data = await api.post<{ member: Member }>(API_ROUTES.associations.admin.members.suspend(id), { reason });
    return { success: true, data };
  },

  /**
   * Supprimer un membre d'une association
   * @param id
   * @returns
   */
  async deleteMember(id: number): Promise<ApiResponse<void>> {
    await api.delete(API_ROUTES.associations.admin.members.delete(id));
    return { success: true, data: undefined };
  },

  /**
   * Récupérer les associations en attente (Super Admin)
   */
  async getPending(): Promise<ApiResponse<GetPendingAssociationsResponse>> {
    const data = await api.get<GetPendingAssociationsResponse>(API_ROUTES.associations.staffApp.list);
    return { success: true, data };
  },

  /**
   * Récupérer les détails d'une association (Super Admin)
   */
  async getById(id: number): Promise<ApiResponse<{ association: AssociationWithStats }>> {
    const data = await api.get<{ association: AssociationWithStats }>(API_ROUTES.associations.admin.get(id));
    return { success: true, data };
  },

  /**
   * Mettre à jour une association (Admin)
   */
  async update(
    id: number,
    data: Partial<Association>
  ): Promise<ApiResponse<{ association: Association }>> {
    const result = await api.put<{ association: Association }>(API_ROUTES.associations.admin.update(id), data);
    return { success: true, data: result };
  },

  /**
   * Approuver une association (Super Admin)
   */
  async approve(id: number): Promise<ApiResponse<{ association: Association }>> {
    const data = await api.post<{ association: Association }>(API_ROUTES.associations.staffApp.approve(id));
    return { success: true, data };
  },

  /**
   * Rejeter une association (Super Admin)
   */
  async reject(id: number, reason: string): Promise<ApiResponse<{ association: Association }>> {
    const data = await api.post<{ association: Association }>(API_ROUTES.associations.staffApp.reject(id), { reason });
    return { success: true, data };
  },

  /**
   * Suspendre une association (Super Admin)
   */
  async suspend(id: number, reason: string): Promise<ApiResponse<{ association: Association }>> {
    const data = await api.post<{ association: Association }>(API_ROUTES.associations.staffApp.suspend(id), { reason });
    return { success: true, data };
  },

  /**
   * Réactiver une association (Super Admin)
   */
  async reactivate(id: number): Promise<ApiResponse<{ association: Association }>> {
    const data = await api.post<{ association: Association }>(API_ROUTES.associations.staffApp.reactivate(id));
    return { success: true, data };
  },

  /**
   * Prolonger l'abonnement d'une association (Super Admin)
   */
  async extendSubscription(id: number, months: number): Promise<ApiResponse<{ association: Association }>> {
    const data = await api.post<{ association: Association }>(API_ROUTES.associations.admin.extendSubscription(id), { months });
    return { success: true, data };
  },

  /**
   * Récupérer les statistiques de mon association
   */
  async getMyStats(): Promise<ApiResponse<{ stats: AssociationStats }>> {
    const data = await api.get<{ stats: AssociationStats }>(API_ROUTES.associations.admin.stats);
    return { success: true, data };
  },
};

