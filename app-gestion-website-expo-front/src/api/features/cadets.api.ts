import {
  API_CONFIG,
  ApiResponse,
  PaginatedResponse,
  getAuthHeaders,
  handleApiResponse,
} from '@/src/api/config';
import {
  CadetResponse,
  GetAllCadetsResponse,
  GetCadetByIdResponse,
  UpdateCadetRoleRequest,
  UpdateCadetRoleResponse,
  CadetsFilterParams,
} from '@/src/api/types';

// Ré-export des types pour usage externe
export type {
  CadetResponse,
  GetAllCadetsResponse,
  GetCadetByIdResponse,
  UpdateCadetRoleRequest,
  UpdateCadetRoleResponse,
  CadetsFilterParams,
};

/**
 * Service API pour la gestion des cadets
 */
export class CadetsApi {
  private static baseUrl = `${API_CONFIG.BASE_URL}/cadets`;

  /**
   * Récupère tous les cadets
   * @param params - Paramètres de filtrage et pagination (optionnel)
   * @param token - Token d'authentification (optionnel)
   * @returns Liste des cadets avec pagination
   */
  static async getAllCadets(
    params?: CadetsFilterParams,
    token?: string
  ): Promise<ApiResponse<GetAllCadetsResponse>> {
    try {
      // Construction de l'URL avec les paramètres de requête
      const queryParams = new URLSearchParams();

      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.role) queryParams.append('role', params.role);
      if (params?.statut) queryParams.append('statut', params.statut);
      if (params?.search) queryParams.append('search', params.search);

      const url = queryParams.toString()
        ? `${this.baseUrl}?${queryParams.toString()}`
        : this.baseUrl;

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });

      return handleApiResponse<GetAllCadetsResponse>(response);
    } catch (error) {
      console.error('Error fetching cadets:', error);
      throw error;
    }
  }

  /**
   * Récupère un cadet par son ID
   * @param id - ID du cadet
   * @param token - Token d'authentification (optionnel)
   * @returns Informations du cadet
   */
  static async getCadetById(
    id: number,
    token?: string
  ): Promise<ApiResponse<GetCadetByIdResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });

      return handleApiResponse<GetCadetByIdResponse>(response);
    } catch (error) {
      console.error(`Error fetching cadet ${id}:`, error);
      throw error;
    }
  }

  /**
   * Met à jour le rôle d'un cadet
   * @param id - ID du cadet
   * @param data - Nouveau rôle
   * @param token - Token d'authentification (optionnel)
   * @returns Cadet mis à jour
   */
  static async updateCadetRole(
    id: number,
    data: UpdateCadetRoleRequest,
    token?: string
  ): Promise<ApiResponse<UpdateCadetRoleResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/role`, {
        method: 'PATCH',
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });

      return handleApiResponse<UpdateCadetRoleResponse>(response);
    } catch (error) {
      console.error(`Error updating cadet ${id} role:`, error);
      throw error;
    }
  }

  /**
   * Met à jour les informations d'un cadet
   * @param id - ID du cadet
   * @param data - Données à mettre à jour
   * @param token - Token d'authentification (optionnel)
   * @returns Cadet mis à jour
   */
  static async updateCadet(
    id: number,
    data: Partial<CadetResponse>,
    token?: string
  ): Promise<ApiResponse<CadetResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });

      return handleApiResponse<CadetResponse>(response);
    } catch (error) {
      console.error(`Error updating cadet ${id}:`, error);
      throw error;
    }
  }

  /**
   * Supprime un cadet
   * @param id - ID du cadet
   * @param token - Token d'authentification (optionnel)
   * @returns Confirmation de suppression
   */
  static async deleteCadet(
    id: number,
    token?: string
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });

      return handleApiResponse<{ message: string }>(response);
    } catch (error) {
      console.error(`Error deleting cadet ${id}:`, error);
      throw error;
    }
  }

  /**
   * Récupère les cadets actifs uniquement
   * @param token - Token d'authentification (optionnel)
   * @returns Liste des cadets actifs
   */
  static async getActiveCadets(
    token?: string
  ): Promise<ApiResponse<GetAllCadetsResponse>> {
    return this.getAllCadets({ statut: 'Actif' }, token);
  }

  /**
   * Récupère les cadets par rôle
   * @param role - Rôle du cadet
   * @param token - Token d'authentification (optionnel)
   * @returns Liste des cadets avec le rôle spécifié
   */
  static async getCadetsByRole(
    role: 'Cadet' | 'Cadet Breveté' | 'Ancien Cadet',
    token?: string
  ): Promise<ApiResponse<GetAllCadetsResponse>> {
    return this.getAllCadets({ role }, token);
  }

  /**
   * Recherche des cadets par nom ou email
   * @param search - Terme de recherche
   * @param token - Token d'authentification (optionnel)
   * @returns Liste des cadets correspondant à la recherche
   */
  static async searchCadets(
    search: string,
    token?: string
  ): Promise<ApiResponse<GetAllCadetsResponse>> {
    return this.getAllCadets({ search }, token);
  }
}

export default CadetsApi;
