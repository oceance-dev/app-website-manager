import { api } from './apiRequest';
import { API_CONFIG, ApiResponse, handleApiResponse, getAuthHeaders, fetchWithTimeout } from './config';

// Types pour les utilisateurs
export interface UserRoleResponse {
  id: number;
  name: string;
  displayName: string;
  level: number;
}

export interface UserResponse {
  id: number;
  associationId: number | null;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phone?: string;
  city_code?: string;
  sexe?: 'Homme' | 'Femme';
  role: UserRoleResponse;
  permissions?: string[];
  isActive: boolean;
  isSuperAdmin?: boolean;
  isAdmin?: boolean;
  emailVerifiedAt?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface GetAllUsersResponse {
  users: UserResponse[];
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
  };
}

export interface UsersFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
  sortBy?: 'createdAt' | 'firstname' | 'lastname' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export interface GetPendingUsersResponse {
  users: UserResponse[];
  count: number;
}

export const UsersApi = {
  /**
   * Récupérer tous les utilisateurs
   * - Super Admin : voit tous les utilisateurs
   * - Admin : voit uniquement les utilisateurs de son association
   */
  async getAll(filters?: UsersFilterParams): Promise<ApiResponse<GetAllUsersResponse>> {
    const queryParams = new URLSearchParams();
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    if (filters?.search) queryParams.append('search', filters.search);
   
    const url = `${API_CONFIG.BASE_URL}/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await api.get<GetAllUsersResponse>(url);
    return { success: true, data };
  },


  /**
   * Approuver un utilisateur
   */
  async approve(userId: number, accessToken: string): Promise<ApiResponse<{ user: UserResponse }>> {
    const url = `${API_CONFIG.BASE_URL}/users/${userId}/approve`;
    console.log('🌐 UsersApi.approve - URL:', url);
    console.log('🌐 UsersApi.approve - userId:', userId);
    console.log('🌐 UsersApi.approve - token:', accessToken ? 'Present' : 'Missing');

    try {
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: getAuthHeaders(accessToken),
      });

      console.log('📡 UsersApi.approve - Response status:', response.status);
      console.log('📡 UsersApi.approve - Response ok:', response.ok);

      const result = await handleApiResponse<{ user: UserResponse }>(response);
      console.log('✅ UsersApi.approve - Result:', result);
      return result;
    } catch (error) {
      console.error('❌ UsersApi.approve - Error:', error);
      throw error;
    }
  },

  /**
   * Rejeter un utilisateur
   */
  async reject(userId: number, reason: string, accessToken: string): Promise<ApiResponse<{ reason: string }>> {
    const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/users/${userId}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(accessToken),
      body: JSON.stringify({ reason }),
    });

    return handleApiResponse<{ reason: string }>(response);
  },
};
