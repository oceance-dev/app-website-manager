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
  isTemplate?: boolean;
}

export interface DocumentWithDownloadUrl extends Document {
  downloadUrl: string;
}

export type DocumentTypeCategory = 'identity' | 'medical' | 'parental_authorization' | 'insurance' | 'registration' | 'certificate' | 'report' | 'administrative' | 'training' | 'photo' | 'other';
export type RequiredFor = 'all' | 'cadets' | 'candidates' | 'staff' | 'minors';

export interface DocumentType {
  id: number;
  associationId: number | null;
  name: string;
  slug: string;
  description?: string;
  category: DocumentTypeCategory;
  isRequired: boolean;
  isActive: boolean;
  requiresValidation: boolean;
  hasExpiration: boolean;
  validityDays?: number;
  allowedExtensions?: string[];
  maxFileSize?: number;
  requiredFor: RequiredFor;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentTypeData {
  name: string;
  description?: string;
  category: DocumentTypeCategory;
  isRequired?: boolean;
  isActive?: boolean;
  requiresValidation?: boolean;
  hasExpiration?: boolean;
  validityDays?: number;
  allowedExtensions?: string[];
  maxFileSize?: number;
  requiredFor?: RequiredFor;
}

export interface UpdateDocumentTypeData {
  name?: string;
  description?: string;
  category?: DocumentTypeCategory;
  isRequired?: boolean;
  isActive?: boolean;
  requiresValidation?: boolean;
  hasExpiration?: boolean;
  validityDays?: number;
  allowedExtensions?: string[];
  maxFileSize?: number;
  requiredFor?: RequiredFor;
}

export const DocumentsApi = {
  /**
   * Récupérer tous les documents
   */
  async getAll(): Promise<ApiResponse<GetAllDocumentsResponse>> {
    const data = await api.get<GetAllDocumentsResponse>(UrlApi.documentsApi.getAll);
    return { success: true, data };
  },

  async getAllDocumentsByCandidat(candidatId: number): Promise<ApiResponse<GetAllDocumentsResponse>> {
    const data = await api.get<GetAllDocumentsResponse>(UrlApi.documentsApi.getAll);

    data.documents.filter((document: Document) => document.userId === candidatId);
    
    return {
      success: true,
      data: data,
    } 
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

    if (uploadData.isTemplate) {
      formData.append('isTemplate', 'true');
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

  /**
   * Mettre à jour un document (métadonnées uniquement)
   */
  async updateDocument(
    id: number,
    updateData: {
      name?: string;
      folderId?: number;
      visibility?: DocumentVisibility;
      category?: DocumentCategory;
      description?: string;
    }
  ): Promise<ApiResponse<{ document: Document }>> {
    const data = await api.put<{ document: Document }>(
      UrlApi.documentsApi.updateDocument(id),
      updateData
    );
    return { success: true, data };
  },

  /**
   * Remplacer le fichier d'un document existant
   */
  async replaceDocument(
    id: number,
    file: File | Blob,
    metadata?: {
      name?: string;
      folderId?: number;
      visibility?: DocumentVisibility;
      category?: DocumentCategory;
      description?: string;
    }
  ): Promise<ApiResponse<{ document: Document }>> {
    const formData = new FormData();
    formData.append('file', file);

    if (metadata?.name) {
      formData.append('name', metadata.name);
    }
    if (metadata?.folderId) {
      formData.append('folderId', metadata.folderId.toString());
    }
    if (metadata?.visibility) {
      formData.append('visibility', metadata.visibility);
    }
    if (metadata?.category) {
      formData.append('category', metadata.category);
    }
    if (metadata?.description) {
      formData.append('description', metadata.description);
    }

    const data = await api.put<{ document: Document }>(
      UrlApi.documentsApi.updateDocument(id),
      formData
    );
    return { success: true, data };
  },

  /**
   * Supprimer un document
   */
  async deleteDocument(id: number): Promise<ApiResponse<void>> {
    await api.delete(UrlApi.documentsApi.deleteDocument(id));
    return { success: true, data: undefined };
  },

  /**
   * ========================================
   * GESTION DES TYPES DE DOCUMENTS PERSONNALISÉS
   * ========================================
   */

  /**
   * Récupérer tous les types de documents (globaux + personnalisés)
   */
  async getAllTypes(): Promise<ApiResponse<{ types: DocumentType[] }>> {
    const data = await api.get<{ types: DocumentType[] }>(UrlApi.documentsApi.getAllTypes);
    return { success: true, data };
  },

  /**
   * Récupérer uniquement les types personnalisés de l'association
   */
  async getCustomTypes(): Promise<ApiResponse<{ types: DocumentType[] }>> {
    const data = await api.get<{ types: DocumentType[] }>(UrlApi.documentsApi.getCustomTypes);
    return { success: true, data };
  },

  /**
   * Créer un nouveau type de document personnalisé
   */
  async createType(typeData: CreateDocumentTypeData): Promise<ApiResponse<{ type: DocumentType }>> {
    const data = await api.post<{ type: DocumentType }>(
      UrlApi.documentsApi.createType,
      typeData
    );
    return { success: true, data };
  },

  /**
   * Mettre à jour un type de document personnalisé
   */
  async updateType(id: number, typeData: UpdateDocumentTypeData): Promise<ApiResponse<{ type: DocumentType }>> {
    const data = await api.put<{ type: DocumentType }>(
      UrlApi.documentsApi.updateType(id),
      typeData
    );
    return { success: true, data };
  },

  /**
   * Supprimer un type de document personnalisé
   */
  async deleteType(id: number): Promise<ApiResponse<void>> {
    await api.delete(UrlApi.documentsApi.deleteType(id));
    return { success: true, data: undefined };
  },
};
