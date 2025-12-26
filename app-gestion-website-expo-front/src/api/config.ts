// Configuration de l'API
export const API_CONFIG = {
  // URL de base de l'API - à modifier selon votre environnement
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',

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

// Fonction utilitaire pour gérer les réponses de l'API
export const handleApiResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
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
