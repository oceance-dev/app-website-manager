import { ApiResponse } from '@/src/api/config';
import { api } from '@/src/api/apiRequest';
import { API_ROUTES } from '@/src/api/url.api';

// Types pour les exigences documentaires
export type RequiredFor = 'all' | 'cadets' | 'candidates' | 'staff';
export type RequiredAt = 'registration' | 'approval' | 'anytime';

export const RequiredForLabels: Record<RequiredFor, string> = {
  all: 'Tous les membres',
  cadets: 'Cadets uniquement',
  candidates: 'Candidats uniquement',
  staff: 'Staff uniquement',
};

export const RequiredAtLabels: Record<RequiredAt, string> = {
  registration: "À l'inscription",
  approval: "Avant approbation",
  anytime: "N'importe quand",
};

export interface DocumentType {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  category: string;
  isGlobal: boolean;
  validityDays?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRequirement {
  id: number;
  associationId: number;
  documentTypeId: number;
  documentType?: DocumentType;
  isEnabled: boolean;
  isRequired: boolean;
  requiredFor?: RequiredFor;
  requiredAt?: RequiredAt;
  customInstructions?: string;
  customName?: string;
  sortOrder: number;
  customValidityDays?: number;
  templateDocumentId?: number | null;
  templateDocument?: {
    id: number;
    name: string;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GetAllRequirementsResponse {
  requirements: DocumentRequirement[];
  total: number;
}

export interface CreateRequirementData {
  documentTypeId: number;
  isEnabled?: boolean;
  isRequired?: boolean;
  requiredFor?: RequiredFor;
  requiredAt?: RequiredAt;
  customInstructions?: string;
  customName?: string;
  sortOrder?: number;
  customValidityDays?: number;
  templateDocumentId?: number | null;
}

export interface UpdateRequirementData {
  documentTypeId?: number;
  isEnabled?: boolean;
  isRequired?: boolean;
  requiredFor?: RequiredFor;
  requiredAt?: RequiredAt;
  customInstructions?: string;
  customName?: string;
  sortOrder?: number;
  customValidityDays?: number;
  templateDocumentId?: number | null;
}

export interface UserDocumentCompletion {
  requirement: DocumentRequirement;
  isComplete: boolean;
  document?: any;
  missingReason?: string;
}

export interface CompletionCheckResponse {
  userId: number;
  completionRate: number;
  totalRequired: number;
  totalCompleted: number;
  missingDocuments: DocumentRequirement[];
  completedDocuments: UserDocumentCompletion[];
}

export const DocumentRequirementsApi = {
  /**
   * Récupérer toutes les exigences documentaires de l'association
   */
  async getAll(): Promise<ApiResponse<GetAllRequirementsResponse>> {
    const data = await api.get<GetAllRequirementsResponse>(API_ROUTES.documentRequirements.list);
    return { success: true, data };
  },

  /**
   * Récupérer une exigence documentaire par ID
   */
  async get(id: number): Promise<ApiResponse<{ requirement: DocumentRequirement }>> {
    const data = await api.get<{ requirement: DocumentRequirement }>(API_ROUTES.documentRequirements.get(id));
    return { success: true, data };
  },

  /**
   * Créer une nouvelle exigence documentaire
   */
  async create(requirementData: CreateRequirementData): Promise<ApiResponse<{ requirement: DocumentRequirement }>> {
    const data = await api.post<{ requirement: DocumentRequirement }>(
      API_ROUTES.documentRequirements.create,
      requirementData
    );
    return { success: true, data };
  },

  /**
   * Mettre à jour une exigence documentaire
   */
  async update(id: number, updateData: UpdateRequirementData): Promise<ApiResponse<{ requirement: DocumentRequirement }>> {
    const data = await api.put<{ requirement: DocumentRequirement }>(
      API_ROUTES.documentRequirements.update(id),
      updateData as unknown as Record<string, unknown>
    );
    return { success: true, data };
  },

  /**
   * Supprimer une exigence documentaire
   */
  async delete(id: number): Promise<ApiResponse<void>> {
    await api.delete(API_ROUTES.documentRequirements.delete(id));
    return { success: true, data: undefined };
  },

  /**
   * Activer/Désactiver une exigence documentaire
   */
  async toggle(id: number): Promise<ApiResponse<{ requirement: DocumentRequirement }>> {
    const data = await api.post<{ requirement: DocumentRequirement }>(API_ROUTES.documentRequirements.toggle(id), {});
    return { success: true, data };
  },

  /**
   * Réorganiser les exigences documentaires
   */
  async reorder(requirementIds: number[]): Promise<ApiResponse<{ requirements: DocumentRequirement[] }>> {
    const data = await api.post<{ requirements: DocumentRequirement[] }>(
      API_ROUTES.documentRequirements.reorder,
      { requirementIds }
    );
    return { success: true, data };
  },

  /**
   * Mise à jour en masse des exigences
   */
  async bulkUpdate(updates: Array<{ id: number; data: UpdateRequirementData }>): Promise<ApiResponse<{ requirements: DocumentRequirement[] }>> {
    const data = await api.post<{ requirements: DocumentRequirement[] }>(
      API_ROUTES.documentRequirements.bulkUpdate,
      { updates }
    );
    return { success: true, data };
  },

  /**
   * Initialiser les exigences par défaut pour l'association
   */
  async initialize(): Promise<ApiResponse<{ requirements: DocumentRequirement[] }>> {
    const data = await api.post<{ requirements: DocumentRequirement[] }>(
      API_ROUTES.documentRequirements.initialize,
      {}
    );
    return { success: true, data };
  },

  /**
   * Réinitialiser aux valeurs par défaut
   */
  async reset(): Promise<ApiResponse<{ requirements: DocumentRequirement[] }>> {
    const data = await api.post<{ requirements: DocumentRequirement[] }>(
      API_ROUTES.documentRequirements.reset,
      {}
    );
    return { success: true, data };
  },

  /**
   * Récupérer ma complétion de documents
   */
  async getMyCompletion(): Promise<ApiResponse<CompletionCheckResponse>> {
    const data = await api.get<CompletionCheckResponse>(API_ROUTES.documentRequirements.myCompletion);
    return { success: true, data };
  },

  /**
   * Vérifier la complétion d'un utilisateur
   */
  async checkUserCompletion(userId: number): Promise<ApiResponse<CompletionCheckResponse>> {
    const data = await api.get<CompletionCheckResponse>(API_ROUTES.documentRequirements.checkUser(userId));
    return { success: true, data };
  },

  /**
   * Vérifier si un utilisateur peut être approuvé (tous les documents requis sont fournis)
   */
  async canApprove(userId: number): Promise<ApiResponse<{ canApprove: boolean; reason?: string }>> {
    const data = await api.get<{ canApprove: boolean; reason?: string }>(
      API_ROUTES.documentRequirements.canApprove(userId)
    );
    return { success: true, data };
  },

  /**
   * Récupérer les types de documents disponibles
   */
  async getAvailableTypes(): Promise<ApiResponse<{ types: DocumentType[] }>> {
    const data = await api.get<{ types: DocumentType[] }>(API_ROUTES.documentRequirements.availableTypes);
    return { success: true, data };
  },
};
