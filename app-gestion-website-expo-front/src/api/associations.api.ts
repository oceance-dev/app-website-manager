import { API_CONFIG, ApiResponse, handleApiResponse, getAuthHeaders, fetchWithTimeout } from './config';

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

export const AssociationsApi = {
  /**
   * Récupérer toutes les associations (public - pour inscription)
   */
  async getAllPublic(): Promise<ApiResponse<GetAllAssociationsResponse>> {
    const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/v1/associations`, {
      method: 'GET',
      headers: API_CONFIG.DEFAULT_HEADERS,
    });

    return handleApiResponse<GetAllAssociationsResponse>(response);
  },

  /**
   * Récupérer toutes les associations (Super Admin)
   */
  async getAll(accessToken: string): Promise<ApiResponse<GetAllAssociationsResponse>> {
    const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/v1/admin/associations`, {
      method: 'GET',
      headers: getAuthHeaders(accessToken),
    });

    return handleApiResponse<GetAllAssociationsResponse>(response);
  },

  /**
   * R�cup�rer les associations en attente (Super Admin)
   */
  async getPending(accessToken: string): Promise<ApiResponse<GetPendingAssociationsResponse>> {
    const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/v1/admin/associations/pending`, {
      method: 'GET',
      headers: getAuthHeaders(accessToken),
    });

    return handleApiResponse<GetPendingAssociationsResponse>(response);
  },

  /**
   * R�cup�rer les d�tails d'une association (Super Admin)
   */
  async getById(id: number, accessToken: string): Promise<ApiResponse<{ association: AssociationWithStats }>> {
    const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/v1/admin/associations/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(accessToken),
    });

    return handleApiResponse<{ association: AssociationWithStats }>(response);
  },

  /**
   * Mettre � jour une association (Super Admin)
   */
  async update(
    id: number,
    data: Partial<Association>,
    accessToken: string
  ): Promise<ApiResponse<{ association: Association }>> {
    const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/v1/admin/associations/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(accessToken),
      body: JSON.stringify(data),
    });

    return handleApiResponse<{ association: Association }>(response);
  },

  /**
   * Approuver une association (Super Admin)
   */
  async approve(id: number, accessToken: string): Promise<ApiResponse<{ association: Association }>> {
    const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/v1/admin/associations/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(accessToken),
    });

    return handleApiResponse<{ association: Association }>(response);
  },

  /**
   * Rejeter une association (Super Admin)
   */
  async reject(
    id: number,
    reason: string,
    accessToken: string
  ): Promise<ApiResponse<{ association: Association }>> {
    const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/v1/admin/associations/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(accessToken),
      body: JSON.stringify({ reason }),
    });

    return handleApiResponse<{ association: Association }>(response);
  },

  /**
   * Suspendre une association (Super Admin)
   */
  async suspend(
    id: number,
    reason: string,
    accessToken: string
  ): Promise<ApiResponse<{ association: Association }>> {
    const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/v1/admin/associations/${id}/suspend`, {
      method: 'POST',
      headers: getAuthHeaders(accessToken),
      body: JSON.stringify({ reason }),
    });

    return handleApiResponse<{ association: Association }>(response);
  },

  /**
   * R�activer une association (Super Admin)
   */
  async reactivate(id: number, accessToken: string): Promise<ApiResponse<{ association: Association }>> {
    const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/v1/admin/associations/${id}/reactivate`, {
      method: 'POST',
      headers: getAuthHeaders(accessToken),
    });

    return handleApiResponse<{ association: Association }>(response);
  },

  /**
   * Prolonger l'abonnement d'une association (Super Admin)
   */
  async extendSubscription(
    id: number,
    months: number,
    accessToken: string
  ): Promise<ApiResponse<{ association: Association }>> {
    const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/v1/admin/associations/${id}/extend-subscription`, {
      method: 'POST',
      headers: getAuthHeaders(accessToken),
      body: JSON.stringify({ months }),
    });

    return handleApiResponse<{ association: Association }>(response);
  },
};
