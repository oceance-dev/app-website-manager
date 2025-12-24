import {
  API_CONFIG,
  ApiResponse,
  getAuthHeaders,
  handleApiResponse,
} from './config';
import {
  DocumentResponse,
  GetAllDocumentsResponse,
  GetCourseDocumentsResponse,
  UpdateDocumentPermissionsRequest,
  UpdateDocumentPermissionsResponse,
  DocumentsFilterParams,
} from './types';

/**
 * Service API pour la gestion des documents
 */
export class DocumentsApi {
  private static baseUrl = `${API_CONFIG.BASE_URL}/documents`;

  /**
   * Récupère tous les documents
   * @param params - Paramètres de filtrage et pagination (optionnel)
   * @param token - Token d'authentification (optionnel)
   * @returns Liste des documents avec pagination
   */
  static async getAllDocuments(
    params?: DocumentsFilterParams,
    token?: string
  ): Promise<ApiResponse<GetAllDocumentsResponse>> {
    try {
      // Construction de l'URL avec les paramètres de requête
      const queryParams = new URLSearchParams();

      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.folderId) queryParams.append('folderId', params.folderId.toString());
      if (params?.type) queryParams.append('type', params.type);
      if (params?.uploadedBy) queryParams.append('uploadedBy', params.uploadedBy.toString());
      if (params?.search) queryParams.append('search', params.search);

      const url = queryParams.toString()
        ? `${this.baseUrl}?${queryParams.toString()}`
        : this.baseUrl;

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });

      return handleApiResponse<GetAllDocumentsResponse>(response);
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  }

  /**
   * Récupère les documents de cours
   * @param token - Token d'authentification (optionnel)
   * @returns Liste des documents de cours
   */
  static async getCourseDocuments(
    token?: string
  ): Promise<ApiResponse<GetCourseDocumentsResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/courses`, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });

      return handleApiResponse<GetCourseDocumentsResponse>(response);
    } catch (error) {
      console.error('Error fetching course documents:', error);
      throw error;
    }
  }

  /**
   * Récupère un document par son ID
   * @param id - ID du document
   * @param token - Token d'authentification (optionnel)
   * @returns Informations du document
   */
  static async getDocumentById(
    id: number,
    token?: string
  ): Promise<ApiResponse<DocumentResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });

      return handleApiResponse<DocumentResponse>(response);
    } catch (error) {
      console.error(`Error fetching document ${id}:`, error);
      throw error;
    }
  }

  /**
   * Met à jour les permissions d'un document
   * @param id - ID du document
   * @param data - Nouvelles permissions
   * @param token - Token d'authentification (optionnel)
   * @returns Document mis à jour
   */
  static async updateDocumentPermissions(
    id: number,
    data: UpdateDocumentPermissionsRequest,
    token?: string
  ): Promise<ApiResponse<UpdateDocumentPermissionsResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/permissions`, {
        method: 'PATCH',
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });

      return handleApiResponse<UpdateDocumentPermissionsResponse>(response);
    } catch (error) {
      console.error(`Error updating document ${id} permissions:`, error);
      throw error;
    }
  }

  /**
   * Upload un nouveau document
   * @param file - Fichier à uploader
   * @param folderId - ID du dossier de destination
   * @param token - Token d'authentification (optionnel)
   * @returns Document créé
   */
  static async uploadDocument(
    file: File | Blob,
    folderId: number,
    token?: string
  ): Promise<ApiResponse<DocumentResponse>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderId', folderId.toString());

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      return handleApiResponse<DocumentResponse>(response);
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  /**
   * Supprime un document
   * @param id - ID du document
   * @param token - Token d'authentification (optionnel)
   * @returns Confirmation de suppression
   */
  static async deleteDocument(
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
      console.error(`Error deleting document ${id}:`, error);
      throw error;
    }
  }

  /**
   * Télécharge un document
   * @param id - ID du document
   * @param token - Token d'authentification (optionnel)
   * @returns URL de téléchargement ou Blob
   */
  static async downloadDocument(
    id: number,
    token?: string
  ): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/download`, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement du document');
      }

      return response.blob();
    } catch (error) {
      console.error(`Error downloading document ${id}:`, error);
      throw error;
    }
  }

  /**
   * Récupère les documents accessibles par un cadet
   * @param cadetId - ID du cadet
   * @param token - Token d'authentification (optionnel)
   * @returns Liste des documents accessibles
   */
  static async getDocumentsByCadet(
    cadetId: number,
    token?: string
  ): Promise<ApiResponse<GetCourseDocumentsResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/cadet/${cadetId}`, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });

      return handleApiResponse<GetCourseDocumentsResponse>(response);
    } catch (error) {
      console.error(`Error fetching documents for cadet ${cadetId}:`, error);
      throw error;
    }
  }
}

export default DocumentsApi;
