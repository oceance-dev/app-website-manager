import { API_CONFIG, ApiError, ApiResponse, handleApiResponse, fetchWithTimeout } from './config';

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

export interface AuthUser {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  role: string;
  isActive: boolean;
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
    role: string;
  };
}

export interface RegisterMemberResponse {
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
    const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/v1/auth/registerAssociation`, {
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
    const url = `${API_CONFIG.BASE_URL}/v1/auth/registerMemberAssociation`;
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
   * Connexion
   */
  async login(data: LoginData): Promise<ApiResponse<LoginResponse>> {
    const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/v1/auth/login`, {
      method: 'POST',
      headers: API_CONFIG.DEFAULT_HEADERS,
      body: JSON.stringify(data),
    });

    return handleApiResponse<LoginResponse>(response);
  },

  /**
   * Rafraîchir les tokens
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<LoginResponse>> {
    const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/v1/auth/refresh`, {
      method: 'POST',
      headers: API_CONFIG.DEFAULT_HEADERS,
      body: JSON.stringify({ refreshToken }),
    });

    return handleApiResponse<LoginResponse>(response);
  },

  /**
   * Récupérer l'utilisateur connecté
   */
  async getMe(accessToken: string): Promise<ApiResponse<{ user: AuthUser; association: AuthAssociation | null }>> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/v1/auth/me`, {
      method: 'GET',
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return handleApiResponse<{ user: AuthUser; association: AuthAssociation | null }>(response);
  },

  /**
   * Déconnexion
   */
  async logout(accessToken: string, refreshToken?: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/v1/auth/logout`, {
      method: 'POST',
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refreshToken }),
    });

    return handleApiResponse<void>(response);
  },
};
