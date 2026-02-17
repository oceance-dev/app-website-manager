/**
 * Point d'entrée centralisé pour tous les services API
 *
 * Usage:
 * ```typescript
 * import { CadetsApi, DocumentsApi, mapCadetsArrayToUsers } from '@/api';
 *
 * // Récupérer tous les cadets
 * const response = await CadetsApi.getAllCadets();
 * if (response.success && response.data) {
 *   const users = mapCadetsArrayToUsers(response.data.cadets);
 * }
 *
 * // Récupérer les documents de cours
 * const docs = await DocumentsApi.getCourseDocuments();
 * ```
 */

// Export des services API
export { CadetsApi } from "@/src/api/features/cadets.api";
export { DocumentsApi } from "@/src/api/features/documents.api";
export { FoldersApi } from "@/src/api/folders.api";
export { CandidatsApi } from "@/src/api/features/candidats.api";
export { AuthApi } from "@/src/api/features/auth.api";
export { AssociationsApi } from "@/src/api/features/associations.api";
export { UsersApi } from "@/src/api/users.api";
export { RolesApi } from "@/src/api/roles.api";
export { StaffAppApi } from "@/src/api/staffApp.api";
export { DocumentRequirementsApi } from "@/src/api/features/document-requirements.api";

// Export de la configuration et des utilitaires
export {
  API_CONFIG,
  ApiError,
  getAuthHeaders,
  handleApiResponse,
} from "@/src/api/config";
export type { ApiResponse, PaginatedResponse } from "@/src/api/config";

export { apiRequest, api } from "./apiRequest";

// Export des utilitaires de storage et events (NOUVEAU)
export { tokenStorage } from "./tokenStorage";
export type { AuthTokens } from "./tokenStorage";
export { authEventEmitter } from "./authEventEmitter";
export type { AuthEventType, AuthEventData } from "./authEventEmitter";

// Export des mappers
export {
  mapCadetResponseToUser,
  mapCadetsArrayToUsers,
  mapUserToCadetRequest,
  convertDateFormat,
  mapBackendRoleToFrontend,
} from "./mappers";

// Export des types de base
export type {
  // Authentification
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  RegisterCandidatRequest,
  RegisterCandidatResponse,

  // Pagination
  PaginationParams,

  // Cadets
  CadetResponse,
  GetAllCadetsResponse,
  GetCadetByIdResponse,
  UpdateCadetRoleRequest,
  UpdateCadetRoleResponse,
  CadetsFilterParams,

  // Candidats
  GetAllCandidatsResponse,
} from "@/src/api/types";

// Documents
export type {
  Document,
  GetAllDocumentsResponse as DocumentsGetAllResponse,
  UploadDocumentData,
  DocumentWithDownloadUrl,
  DocumentType as DocumentTypeModel,
  CreateDocumentTypeData,
  UpdateDocumentTypeData,
  DocumentTypeCategory,
  RequiredFor as DocumentRequiredFor,
} from "./features/documents.api";

// Auth (types spécifiques de auth.api)
export type {
  RegisterAssociationData,
  RegisterMemberData,
  RegisterMemberResponse,
  LoginData,
  AuthTokens as AuthApiTokens,
  AuthUser,
  AuthAssociation,
  RegisterAssociationResponse,
  LoginResponse,
} from "@/src/api/features/auth.api";

// Associations
export type {
  Association,
  AssociationWithStats,
  GetAllAssociationsResponse,
  GetPendingAssociationsResponse,
} from "./features/associations.api";

// Users
export type {
  UserResponse,
  GetAllUsersResponse,
  UsersFilterParams,
} from "./users.api";

// Roles
export type {
  Role,
  Permission,
  RoleWithPermissions,
  GetRolesResponse,
} from "./roles.api";

// Folders
export type {
  Folder,
  FolderMember,
  FolderWithMembers,
  CreateFolderData,
  UpdateFolderData,
  AddFolderMemberData,
  UpdateFolderMemberData,
  MoveDocumentData,
} from "./folders.api";

// StaffApp
export type {
  CreateRoleData,
  UpdateRoleData,
  UpdatePermissionsData,
  UserWithRole,
} from "./staffApp.api";

// Document Requirements
export type {
  DocumentType,
  DocumentRequirement,
  GetAllRequirementsResponse,
  CreateRequirementData,
  UpdateRequirementData,
  UserDocumentCompletion,
  CompletionCheckResponse,
  RequiredFor,
  RequiredAt,
} from "@/src/api/features/document-requirements.api";

export {
  RequiredForLabels,
  RequiredAtLabels,
} from "@/src/api/features/document-requirements.api";
