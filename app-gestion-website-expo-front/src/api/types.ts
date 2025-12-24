import { User, Document, DocumentPermission } from '../types';


// ============================================
// Types pour les réponses API - Documents
// ============================================

export interface DocumentResponse {
  id: number;
  nameDoc: string;
  folderId: number;
  length: string;
  date: string;
  type: 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'OTHER';
  uploadedBy: number;
  uri?: string;
  mimeType?: string;
  permissions?: DocumentPermission[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GetAllDocumentsResponse {
  documents: DocumentResponse[];
  total: number;
}

export interface GetCourseDocumentsResponse {
  documents: DocumentResponse[];
  total: number;
}

export interface UpdateDocumentPermissionsRequest {
  permissions: DocumentPermission[];
}

export interface UpdateDocumentPermissionsResponse {
  document: DocumentResponse;
  message: string;
}

// ============================================
// Types pour les réponses API - Authentification
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface RegisterCandidatRequest {
  lastname: string;
  firstname: string;
  email: string;
  emailParent?: string;
  password: string;
  phone: string;
  cityCode?: string;
  dateOfbirth?: string;
  sexe?: number;
}

export interface RegisterCandidatResponse {
  candidat: RegisterCandidatRequest;
  message: string;
}

export interface RegisterRequest {
  lastname: string;
  firstname: string;
  email: string;
  password: string;
  phone: string;
  dateOfbirth?: string;
  sexe?: number;
}

export interface RegisterResponse {
  user: User;
  message: string;
}

// ============================================
// Types pour les filtres et pagination
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface DocumentsFilterParams extends PaginationParams {
  folderId?: number;
  type?: 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'OTHER';
  uploadedBy?: number;
  search?: string;
}
