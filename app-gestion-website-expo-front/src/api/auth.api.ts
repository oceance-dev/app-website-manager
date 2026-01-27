import { api } from './apiRequest';
import { API_CONFIG, ApiError, ApiResponse, handleApiResponse, fetchWithTimeout } from './config';
import { UrlApi } from './url.api';

// Types pour l'authentification
export interface RegisterAssociationData {
  association: {
    name: string;
    rna?: string;
    siret?: string;
    email?: string;
    phone?: string;
    address?: string;
    city: string;
    postalCode: string;
    country: string;
  };
  responsable: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    passwordConfirmation: string;
    city_code: string;
    phone?: string;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: {
    type: string;
    value: string;
    expiresAt: string | null;
  };
  refreshToken: {
    value: string;
    expiresAt: string;
  };
}

export interface AuthUserRole {
  id: number;
  name: string;
  displayName: string;
  level: number;
}

export interface AuthUser {
  id: number;
  email: string;
  firstname?: string;
  lastname?: string;
  firstName?: string;
  lastName?: string;
  role: AuthUserRole;
  isActive: boolean;
  isSuperAdmin?: boolean;
  isAdmin?: boolean;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthAssociation {
  id: number;
  name: string;
  rna: string;
  siret: string;
  city: string;
  postalCode: string;
  country: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterAssociationResponse {
  association: AuthAssociation;
  responsable: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface RegisterMemberData {
  associationMember: {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    passwordConfirmation: string;
    phone: string;
    city_code: string;
    dateOfBirth: string;
    sexe: 'Homme' | 'Femme';
    associationId: number;
    roleId: number;
  };
}

export interface RegisterMemberResponse {
  user: AuthUser;
}

export interface RegisterCandidatData {
  candidat: {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    passwordConfirmation: string;
    city_code: string;
    dateOfBirth: string; // Format: YYYY-MM-DD ou DD/MM/YYYY
    sexe: 'Homme' | 'Femme';
  };
  parent: {
    emailParent: string;
    phoneParent: string;
    firstNameParent: string;
    lastNameParent: string;
  };
}

export interface Candidat {
  id: number;
  userId: number;
  emailParent: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterCandidatResponse {
  candidat: Candidat;
  user: AuthUser;
}

export interface LoginResponse {
  user: AuthUser;
  association: AuthAssociation | null;
  accessToken: AuthTokens['accessToken'];
  refreshToken: AuthTokens['refreshToken'];
}

export const AuthApi = {
  /**
   * Inscription d'une nouvelle association
   */
  
  async registerAssociation(data: RegisterAssociationData): Promise<ApiResponse<RegisterAssociationResponse>> {
    const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/auth/registerAssociation`, {
      method: 'POST',
      headers: API_CONFIG.DEFAULT_HEADERS,
      body: JSON.stringify(data),
    });

    return handleApiResponse<RegisterAssociationResponse>(response);
  },

  /**
   * Inscription d'un membre d'association
   */
  async registerMember(data: RegisterMemberData): Promise<ApiResponse<RegisterMemberResponse>> {
    const url = `${API_CONFIG.BASE_URL}/auth/registerMemberAssociation`;
    console.log('🌐 API Call URL:', url);
    console.log('📦 Request body:', JSON.stringify(data, null, 2));

    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: API_CONFIG.DEFAULT_HEADERS,
      body: JSON.stringify(data),
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', response.headers);

    return handleApiResponse<RegisterMemberResponse>(response);
  },

  /**
   * Inscription d'un candidat
   */
  async registerCandidat(data: RegisterCandidatData): Promise<ApiResponse<RegisterCandidatResponse>> {
    const url = `${API_CONFIG.BASE_URL}/auth/registerCandidat`;
    console.log('🌐 API Call URL:', url);
    console.log('📦 Request body:', JSON.stringify(data, null, 2));

    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: API_CONFIG.DEFAULT_HEADERS,
      body: JSON.stringify(data),
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', response.headers);

    return handleApiResponse<RegisterCandidatResponse>(response);
  },

  /**
   * Connexion
   */
  async login(loginData: LoginData): Promise<ApiResponse<LoginResponse>> {
    const data = await api.post<LoginResponse>(UrlApi.authApi.login, loginData, { skipAuth: true });
    return { success: true, data };
  },

  /**
   * Rafraîchir les tokens
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<LoginResponse>> {
    const data = await api.post<LoginResponse>(UrlApi.authApi.refresh, { refreshToken });
    return { success: true, data };
  },

  /**
   * Récupérer l'utilisateur connecté
   */
  async getMe(): Promise<ApiResponse<{ user: AuthUser; association: AuthAssociation | null }>> {
    const data = await api.get<{ user: AuthUser; association: AuthAssociation | null }>(UrlApi.authApi.me);
    return { success: true, data };
  },

  /**
   * Déconnexion
   */
  async logout(refreshToken: string): Promise<ApiResponse<void>> {
    const data = await api.post<void>(UrlApi.authApi.logout, { refreshToken });
    return { success: true, data };
  },

  /**
   * Déconnexion de tous les appareils
   */
  async logoutAll(): Promise<ApiResponse<void>> {
    const data = await api.post<void>(UrlApi.authApi.logoutAll);
    return { success: true, data };
  },
};
