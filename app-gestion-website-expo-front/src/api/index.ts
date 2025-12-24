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
export { CandidatsApi } from './candidats.api';
export { AuthApi } from './auth.api';
export { AssociationsApi } from './associations.api';
export { UsersApi } from './users.api';

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

  // Documents
  DocumentResponse,
  GetAllDocumentsResponse,
  GetCourseDocumentsResponse,
  UpdateDocumentPermissionsRequest,
  UpdateDocumentPermissionsResponse,
  DocumentsFilterParams,

  // Authentification
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,

  // Pagination
  PaginationParams,
} from './types';

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