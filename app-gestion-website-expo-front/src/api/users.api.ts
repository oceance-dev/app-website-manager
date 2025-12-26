import { API_CONFIG, ApiResponse, handleApiResponse, getAuthHeaders, fetchWithTimeout } from './config';

// Types pour les utilisateurs
export interface UserResponse {
  id: number;
  associationId: number | null;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  city_code: string;
  sexe: 'Homme' | 'Femme';
  role: string;
  permissions: string[];
  isActive: boolean;
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

export const UsersApi = {
  /**
   * Récupérer tous les utilisateurs
   * - Super Admin : voit tous les utilisateurs
   * - Admin : voit uniquement les utilisateurs de son association
   */
  async getAll(
    accessToken: string,
    filters?: UsersFilterParams
  ): Promise<ApiResponse<GetAllUsersResponse>> {
    const queryParams = new URLSearchParams();

    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.role) queryParams.append('role', filters.role);
    if (filters?.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());
    if (filters?.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

    const url = `${API_CONFIG.BASE_URL}/v1/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: getAuthHeaders(accessToken),
    });

    return handleApiResponse<GetAllUsersResponse>(response);
  },
};
