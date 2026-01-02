import { ApiResponse, API_CONFIG } from './config';
import { api } from './apiRequest';
import { UrlApi } from './url.api';

// Types pour les documents
export interface Document {
  id: number;
  name: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  folderId?: number;
  associationId: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface GetAllDocumentsResponse {
  documents: Document[];
  total: number;
}

export type DocumentVisibility = 'private' | 'staff' | 'members' | 'cadet_breveter' | 'cadet' | 'candidat' | 'public';
export type DocumentCategory = 'identity' | 'medical' | 'training' | 'administrative' | 'photo' | 'certificate' | 'report' | 'other';

export interface UploadDocumentData {
  name: string;
  file: File | Blob;
  folderId?: number;
  visibility?: DocumentVisibility;
  category?: DocumentCategory;
  description?: string;
}

export interface DocumentWithDownloadUrl extends Document {
  downloadUrl: string;
}

export const DocumentsApi = {
  /**
   * Récupérer tous les documents
   */
  async getAll(): Promise<ApiResponse<GetAllDocumentsResponse>> {
    const data = await api.get<GetAllDocumentsResponse>(UrlApi.documentsApi.getAll);
    return { success: true, data };
  },

  /**
   * Voir un document par ID (avec URL de téléchargement)
   */
  async viewDocument(id: number): Promise<ApiResponse<{ document: DocumentWithDownloadUrl }>> {
    const data = await api.get<{ document: DocumentWithDownloadUrl }>(UrlApi.documentsApi.viewDocument(id));
    return { success: true, data };
  },

  /**
   * Uploader un document
   */
  async upload(uploadData: UploadDocumentData): Promise<ApiResponse<{ document: Document }>> {
    const formData = new FormData();
    formData.append('name', uploadData.name);
    formData.append('file', uploadData.file);

    if (uploadData.folderId) {
      formData.append('folderId', uploadData.folderId.toString());
    }

    if (uploadData.visibility) {
      formData.append('visibility', uploadData.visibility);
    }

    if (uploadData.category) {
      formData.append('category', uploadData.category);
    }

    if (uploadData.description) {
      formData.append('description', uploadData.description);
    }

    // Ne pas définir Content-Type pour FormData - le navigateur le gère automatiquement avec boundary
    const data = await api.post<{ document: Document }>(
      UrlApi.documentsApi.create,
      formData
    );
    return { success: true, data };
  },

  /**
   * Télécharger un document
   * Retourne l'URL complète pour télécharger le fichier
   */
  downloadDocument(id: number): string {
    const path = UrlApi.documentsApi.downloadDocument(id);
    return `${API_CONFIG.BASE_URL}${path}`;
  },
};
