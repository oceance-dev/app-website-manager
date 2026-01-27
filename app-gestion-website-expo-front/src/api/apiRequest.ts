/**
 * ========================================
 * API Request avec auto-refresh des tokens
 * Adapté pour React Native
 * ========================================
 */

import { API_CONFIG } from './config';
import { tokenStorage, type AuthTokens } from './tokenStorage';
import { authEventEmitter } from './authEventEmitter';

// ========================================
// API ERROR CLASS
// ========================================

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public code: string = 'API_ERROR',
    public status: number = 500,
    public errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }

  static fromResponse(data: any, status: number): ApiRequestError {
    return new ApiRequestError(
      data.message || 'Une erreur est survenue',
      data.code || 'API_ERROR',
      status,
      data.errors
    );
  }
}

// ========================================
// REFRESH TOKEN LOGIC
// ========================================

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (callback: (token: string) => void): void => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (token: string): void => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const onRefreshError = (): void => {
  refreshSubscribers = [];
};

/**
 * Rafraîchit le token d'accès
 */
async function refreshAccessToken(): Promise<string> {
  const refreshToken = await tokenStorage.getRefreshToken();

  if (!refreshToken) {
    throw new ApiRequestError('No refresh token available', 'NO_REFRESH_TOKEN', 401);
  }

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      // Refresh token invalide ou expiré → déconnexion
      await tokenStorage.clearTokens();
      // Émettre l'événement de session expirée
      authEventEmitter.emitSessionExpired();
      throw new ApiRequestError(
        data.message || 'Session expired',
        data.code || 'REFRESH_FAILED',
        response.status
      );
    }

    // Sauvegarder les nouveaux tokens
    const tokens: AuthTokens = {
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1h par défaut
    };

    await tokenStorage.setTokens(tokens);

    return tokens.accessToken;
  } catch (error) {
    await tokenStorage.clearTokens();
    // Émettre l'événement de session expirée
    authEventEmitter.emitSessionExpired();
    throw error;
  }
}

/**
 * Gère le refresh avec déduplication des appels
 */
async function handleTokenRefresh(): Promise<string> {
  if (isRefreshing && refreshPromise) {
    // Un refresh est déjà en cours, attendre le résultat
    return new Promise<string>((resolve, reject) => {
      subscribeTokenRefresh((token) => {
        resolve(token);
      });
      // Timeout de sécurité
      setTimeout(() => reject(new Error('Refresh timeout')), 10000);
    });
  }

  isRefreshing = true;
  refreshPromise = refreshAccessToken();

  try {
    const newToken = await refreshPromise;
    onTokenRefreshed(newToken);
    return newToken;
  } catch (error) {
    onRefreshError();
    throw error;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}

// ========================================
// MAIN API REQUEST FUNCTION
// ========================================

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown> | FormData;
  skipAuth?: boolean;
  retryCount?: number;
  timeout?: number;
}

/**
 * Fonction principale pour les appels API avec auto-refresh
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    body,
    skipAuth = false,
    retryCount = 0,
    timeout = API_CONFIG.TIMEOUT,
    ...fetchOptions
  } = options;

  // Construire les headers
  const headers: Record<string, string> = {};

  // Pour FormData, ne pas ajouter Content-Type (le navigateur le gère automatiquement avec boundary)
  if (!(body instanceof FormData)) {
    Object.assign(headers, API_CONFIG.DEFAULT_HEADERS);
  }

  // Ajouter les headers custom
  Object.assign(headers, fetchOptions.headers || {});

  // Ajouter le token d'authentification
  if (!skipAuth) {
    const accessToken = await tokenStorage.getAccessToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
  }

  // Construire la requête
  const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`;

  const requestInit: RequestInit = {
    ...fetchOptions,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  };

  // Timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...requestInit,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json();

    // Token expiré → tenter un refresh
    // Ne pas tenter de refresh si c'est une erreur de compte inactif ou d'association inactive
    const isAccountError = data.code === 'ACCOUNT_INACTIVE' ||
                          data.code === 'ASSOCIATION_INACTIVE' ||
                          data.message?.includes('compte n\'est pas encore activé') ||
                          data.message?.includes('association n\'est pas active');

    if (response.status === 401 && !skipAuth && retryCount < 1 && !isAccountError) {
      try {
        await handleTokenRefresh();

        // Réessayer la requête avec le nouveau token
        return apiRequest<T>(endpoint, {
          ...options,
          retryCount: retryCount + 1,
        });
      } catch (refreshError) {
        // Échec du refresh → l'utilisateur doit se reconnecter
        throw new ApiRequestError(
          'Votre session a expiré. Veuillez vous reconnecter.',
          'SESSION_EXPIRED',
          401
        );
      }
    }

    // Gérer les erreurs
    if (!response.ok || data.success === false) {
      throw ApiRequestError.fromResponse(data, response.status);
    }

    return data.data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error instanceof ApiRequestError) {
      throw error;
    }

    if (error.name === 'AbortError') {
      throw new ApiRequestError(
        'La requête a expiré. Vérifiez votre connexion.',
        'TIMEOUT',
        408
      );
    }

    // Erreur réseau
    throw new ApiRequestError(
      'Impossible de contacter le serveur. Vérifiez votre connexion.',
      'NETWORK_ERROR',
      0
    );
  }
}

// ========================================
// API METHODS HELPERS
// ========================================

export const api = {
  get: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = unknown>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T = unknown>(endpoint: string, body?: Record<string, unknown>, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T = unknown>(endpoint: string, body?: Record<string, unknown>, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
