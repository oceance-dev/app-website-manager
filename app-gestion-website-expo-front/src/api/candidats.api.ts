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
import { api } from './apiRequest';
import { UrlApi } from './url.api';

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
   * Récupère toutes les candidatures pour l'association (admin)
   * Utilise le nouveau système d'API avec auto-refresh des tokens
   */
  static async getAllCandidatures(): Promise<ApiResponse<{ candidatures: any[] }>> {
    try {
      const response = await api.get<{ candidats: any[]; meta?: any }>(
        UrlApi.associationsApi.admin.candidatures.getAll
      );

      // L'API retourne "candidats", on renomme en "candidatures" pour l'interface
      const data = {
        candidatures: response.candidats || [],
        meta: response.meta
      };

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching candidatures:', error);
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
   * Valide une candidature (admin) - Nouveau système API
   * @param id - ID de la candidature
   * @returns Confirmation de validation
   */
  static async validateCandidature(
    id: number | string
  ): Promise<ApiResponse<{ message: string; cadetId: number }>> {
    try {
      const data = await api.post<{ message: string; cadetId: number }>(
        UrlApi.associationsApi.admin.candidatures.validate(id)
      );
      return { success: true, data };
    } catch (error) {
      console.error(`Error validating candidature ${id}:`, error);
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

  /**
   * Rejette une candidature (admin) - Nouveau système API
   * @param id - ID de la candidature
   * @param reason - Raison du rejet (optionnel)
   * @returns Confirmation de rejet
   */
  static async rejectCandidature(
    id: number | string,
    reason?: string
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const data = await api.post<{ message: string }>(
        UrlApi.associationsApi.admin.candidatures.reject(id),
        { reason }
      );
      return { success: true, data };
    } catch (error) {
      console.error(`Error rejecting candidature ${id}:`, error);
      throw error;
    }
  }

  /**
   * Récupérer les documents requis pour le candidat connecté
   */
  static async getDocumentRequirements(): Promise<ApiResponse<{ requirements: any[] }>> {
    try {
      const data = await api.get<{ requirements: any[] }>(
        UrlApi.candidatsApi.docRequirements
      );
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching document requirements:', error);
      throw error;
    }
  }

  /**
   * Vérifier la complétion du dossier du candidat connecté
   */
  static async getCompletion(): Promise<ApiResponse<any>> {
    try {
      const data = await api.get<any>(UrlApi.candidatsApi.completion);
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching completion:', error);
      throw error;
    }
  }

  /**
   * Vérifier si le candidat peut soumettre son dossier
   */
  static async canSubmit(): Promise<ApiResponse<{ canSubmit: boolean; reason?: string; missingDocuments?: string[] }>> {
    try {
      const data = await api.get<{ canSubmit: boolean; reason?: string; missingDocuments?: string[] }>(
        UrlApi.candidatsApi.canSubmit
      );
      return { success: true, data };
    } catch (error) {
      console.error('Error checking can submit:', error);
      throw error;
    }
  }

  /**
   * Récupérer mes documents
   */
  static async getMyDocuments(): Promise<ApiResponse<{ documents: any[] }>> {
    try {
      const data = await api.get<{ documents: any[] }>(
        UrlApi.candidatsApi.getMyDocuments
      );
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching my documents:', error);
      throw error;
    }
  }

  /**
   * Récupérer les documents d'un candidat spécifique (pour admin)
   * @param candidatId - ID du candidat
   */
  static async getCandidatDocuments(candidatId: number | string): Promise<ApiResponse<{ documents: any[] }>> {
    try {
      const data = await api.get<{ documents: any[] }>(
        `${UrlApi.candidatsApi.getMyDocuments}?userId=${candidatId}`
      );
      return { success: true, data };
    } catch (error) {
      console.error(`Error fetching documents for candidat ${candidatId}:`, error);
      throw error;
    }
  }

  /**
   * Télécharger un document (upload)
   */
  static async uploadDocument(formData: FormData): Promise<ApiResponse<{ document: any }>> {
    try {
      // Ne pas passer d'options headers - apiRequest.ts gère automatiquement FormData
      // et n'ajoute pas Content-Type pour laisser le navigateur définir la boundary
      const data = await api.post<{ document: any }>(
        UrlApi.candidatsApi.uploadDocument,
        formData
      );
      return { success: true, data };
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  /**
   * Télécharger un document (download)
   * @param documentId - ID du document
   */
  static async downloadDocument(documentId: number | string): Promise<ApiResponse<Blob>> {
    try {
      const data = await api.get<Blob>(
        UrlApi.candidatsApi.downloadDocument(documentId)
      );
      return { success: true, data };
    } catch (error) {
      console.error(`Error downloading document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Supprimer un document
   * @param documentId - ID du document
   */
  static async deleteDocument(documentId: number | string): Promise<ApiResponse<{ message: string }>> {
    try {
      const data = await api.delete<{ message: string }>(
        UrlApi.candidatsApi.deleteDocument(documentId)
      );
      return { success: true, data };
    } catch (error) {
      console.error(`Error deleting document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Visualiser un document
   * @param documentId - ID du document
   */
  static async getDocument(documentId: number | string): Promise<ApiResponse<any>> {
    try {
      const data = await api.get<any>(
        UrlApi.candidatsApi.getDocument(documentId)
      );
      return { success: true, data };
    } catch (error) {
      console.error(`Error getting document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Remplacer un document existant
   * @param documentId - ID du document à remplacer
   * @param formData - Nouveau document
   */
  static async replaceDocument(documentId: number | string, formData: FormData): Promise<ApiResponse<{ document: any }>> {
    try {
      const data = await api.put<{ document: any }>(
        UrlApi.candidatsApi.replaceDocument(documentId),
        formData
      );
      return { success: true, data };
    } catch (error) {
      console.error(`Error replacing document ${documentId}:`, error);
      throw error;
    }
  }
}

export default CandidatsApi;
