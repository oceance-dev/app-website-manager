import {
  API_CONFIG,
  ApiResponse,
  getAuthHeaders,
  handleApiResponse,
} from './config';
import {
  RegisterCandidatRequest,
  RegisterCandidatResponse,
  GetAllCandidatsResponse,
} from './types/candidat';

/**
 * Service API pour l'inscription des candidats (futurs cadets)
 */
export class CandidatsApi {
  private static baseUrl = `${API_CONFIG.BASE_URL}/candidats`;

  /**
   * Inscription d'un nouveau candidat (cadet)
   * @param data - Données du candidat
   * @returns Réponse de l'inscription
   */
  static async registerCandidat(
    data: RegisterCandidatRequest
  ): Promise<ApiResponse<RegisterCandidatResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/register`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      return handleApiResponse<RegisterCandidatResponse>(response);
    } catch (error) {
      console.error('Error registering candidat:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les candidats (demandes d'inscription en attente)
   * @param token - Token d'authentification (requis pour admin/formateur)
   * @returns Liste des candidats
   */
  static async getAllCandidats(
    token?: string
  ): Promise<ApiResponse<GetAllCandidatsResponse>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });

      return handleApiResponse<GetAllCandidatsResponse>(response);
    } catch (error) {
      console.error('Error fetching candidats:', error);
      throw error;
    }
  }

  /**
   * Récupère un candidat par ID
   * @param id - ID du candidat
   * @param token - Token d'authentification
   * @returns Informations du candidat
   */
  static async getCandidatById(
    id: number | string,
    token?: string
  ): Promise<ApiResponse<{ candidat: RegisterCandidatRequest }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });

      return handleApiResponse<{ candidat: RegisterCandidatRequest }>(response);
    } catch (error) {
      console.error(`Error fetching candidat ${id}:`, error);
      throw error;
    }
  }

  /**
   * Valide un candidat (le transforme en cadet)
   * @param id - ID du candidat
   * @param token - Token d'authentification
   * @returns Confirmation de validation
   */
  static async validateCandidat(
    id: number | string,
    token: string
  ): Promise<ApiResponse<{ message: string; cadetId: number }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/validate`, {
        method: 'POST',
        headers: getAuthHeaders(token),
      });

      return handleApiResponse<{ message: string; cadetId: number }>(response);
    } catch (error) {
      console.error(`Error validating candidat ${id}:`, error);
      throw error;
    }
  }

  /**
   * Rejette une candidature
   * @param id - ID du candidat
   * @param reason - Raison du rejet (optionnel)
   * @param token - Token d'authentification
   * @returns Confirmation de rejet
   */
  static async rejectCandidat(
    id: number | string,
    reason?: string,
    token?: string
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ reason }),
      });

      return handleApiResponse<{ message: string }>(response);
    } catch (error) {
      console.error(`Error rejecting candidat ${id}:`, error);
      throw error;
    }
  }
}

export default CandidatsApi;
