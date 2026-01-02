import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration de l'API
export const API_CONFIG = {
  // URL de base de l'API - à modifier selon votre environnement
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1',

  // Timeout des requêtes (en millisecondes) - réduit à 5 secondes
  TIMEOUT: 5000,

  // Headers par défaut
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Types pour les réponses de l'API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Classe pour gérer les erreurs API
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Fonction utilitaire pour créer les headers avec authentification
export const getAuthHeaders = (token?: string): HeadersInit => {
  const headers: HeadersInit = { ...API_CONFIG.DEFAULT_HEADERS };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Fonction utilitaire pour créer une requête avec timeout
export const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout: number = API_CONFIG.TIMEOUT
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ApiError('La requête a expiré. Vérifiez votre connexion.', 408);
    }
    throw error;
  }
};

// Fonction utilitaire pour faire des requêtes API avec auto-refresh des tokens
export const apiRequest = async (
  url: string,
  options: RequestInit = {},
  timeout: number = API_CONFIG.TIMEOUT
): Promise<Response> => {
  const accessToken = await AsyncStorage.getItem('accessToken');

  const makeRequest = () =>
    fetchWithTimeout(
      url,
      {
        ...options,
        headers: {
          ...API_CONFIG.DEFAULT_HEADERS,
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...options.headers,
        },
      },
      timeout
    );

  const response = await makeRequest();

  // Si 401, handleApiResponse va tenter le refresh et réessayer
  if (response.status === 401) {
    // Créer une fonction de retry qui récupère le nouveau token
    const retryRequest = async () => {
      const newToken = await AsyncStorage.getItem('accessToken');
      return fetchWithTimeout(
        url,
        {
          ...options,
          headers: {
            ...API_CONFIG.DEFAULT_HEADERS,
            ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
            ...options.headers,
          },
        },
        timeout
      );
    };

    // Note: handleApiResponse sera appelé par les fonctions d'API individuelles
    // On retourne juste la response avec la capacité de retry
    (response as any).__retryRequest = retryRequest;
  }

  return response;
};

// ============================================
// SYSTÈME DE RAFRAÎCHISSEMENT DES TOKENS
// ============================================

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = await AsyncStorage.getItem('refreshToken');

  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  console.log('🔄 Refreshing access token...');

  const response = await fetch(`${API_CONFIG.BASE_URL}/v1/auth/refresh`, {
    method: 'POST',
    headers: API_CONFIG.DEFAULT_HEADERS,
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    // Refresh token expiré → déconnecter
    console.error('❌ Refresh token expired');
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    throw new Error('Session expired');
  }

  const data = await response.json();

  if (data.success && data.data) {
    const newAccessToken = data.data.accessToken.value;
    const newRefreshToken = data.data.refreshToken.value;

    await AsyncStorage.setItem('accessToken', newAccessToken);
    await AsyncStorage.setItem('refreshToken', newRefreshToken);

    console.log('✅ Token refreshed successfully');
    return newAccessToken;
  }

  throw new Error('Invalid refresh response');
}

// Fonction utilitaire pour gérer les réponses de l'API
export const handleApiResponse = async <T>(
  response: Response,
  retryRequest?: () => Promise<Response>
): Promise<ApiResponse<T>> => {
  // Récupérer la fonction de retry attachée par apiRequest si elle existe
  const retry = retryRequest || (response as any).__retryRequest;

  if (response.status === 401 && retry) {
    // Token expiré → tenter un refresh
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        onTokenRefreshed(newToken);

        // Réessayer la requête originale
        const retryResponse = await retry();
        return handleApiResponse<T>(retryResponse);
      } catch (error) {
        isRefreshing = false;
        throw new ApiError(
          'Votre session a expiré. Veuillez vous reconnecter.',
          401
        );
      }
    } else {
      // Un refresh est déjà en cours, attendre
      return new Promise<ApiResponse<T>>((resolve, reject) => {
        subscribeTokenRefresh(async () => {
          try {
            const retryResponse = await retry();
            resolve(handleApiResponse<T>(retryResponse));
          } catch (error) {
            reject(error);
          }
        });
      });
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new ApiError(
      errorData.message || 'Une erreur est survenue',
      response.status,
      errorData
    );
  }

  return response.json();
};
