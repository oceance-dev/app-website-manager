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
export { CadetsApi } from './cadets.api';
export { DocumentsApi } from './documents.api';
export { FoldersApi } from './folders.api';
export { CandidatsApi } from './candidats.api';
export { AuthApi } from './auth.api';
export { AssociationsApi } from './associations.api';
export { UsersApi } from './users.api';
export { RolesApi } from './roles.api';
export { StaffAppApi } from './staffApp.api';
export { DocumentRequirementsApi } from './document-requirements.api';

// Export de la configuration et des utilitaires
export { API_CONFIG, ApiError, getAuthHeaders, handleApiResponse } from './config';
export type { ApiResponse, PaginatedResponse } from './config';

// Export des mappers
export {
  mapCadetResponseToUser,
  mapCadetsArrayToUsers,
  mapUserToCadetRequest,
  convertDateFormat,
  mapBackendRoleToFrontend,
} from './mappers';

// Export des types
export type {

  // Authentification
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,

  // Pagination
  PaginationParams,
} from './types';

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
} from './documents.api';

// Cadets
export type {
  CadetResponse,
  GetAllCadetsResponse,
  GetCadetByIdResponse,
  UpdateCadetRoleRequest,
  UpdateCadetRoleResponse,
  CadetsFilterParams,
} from './types/cadet';

// Candidats
export type {
  RegisterCandidatRequest,
  RegisterCandidatResponse,
  GetAllCandidatsResponse,
} from './types/candidat';

// Auth
export type {
  RegisterAssociationData,
  RegisterMemberData,
  RegisterMemberResponse,
  LoginData,
  AuthTokens,
  AuthUser,
  AuthAssociation,
  RegisterAssociationResponse,
  LoginResponse,
} from './auth.api';

// Associations
export type {
  Association,
  AssociationWithStats,
  GetAllAssociationsResponse,
  GetPendingAssociationsResponse,
} from './associations.api';

// Users
export type {
  UserResponse,
  GetAllUsersResponse,
  UsersFilterParams,
} from './users.api';

// Roles
export type {
  Role,
  Permission,
  RoleWithPermissions,
  GetRolesResponse,
} from './roles.api';

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
} from './folders.api';

// StaffApp
export type {
  CreateRoleData,
  UpdateRoleData,
  UpdatePermissionsData,
  UserWithRole,
} from './staffApp.api';

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
} from './document-requirements.api';

export { RequiredForLabels, RequiredAtLabels } from './document-requirements.api';