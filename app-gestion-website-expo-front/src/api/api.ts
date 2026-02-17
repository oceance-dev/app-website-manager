/**
 * ========================================
 * CADEP - Service API avec gestion des tokens
 * ========================================
 */

// Configuration
// @ts-ignore - import.meta.env is for Vite, using fallback for Expo
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:3333/api/v1'

// Types
export interface ApiError {
  success: false
  message: string
  errors?: Array<{ field: string; message: string }>
  code?: string
}

export interface ApiSuccess<T = unknown> {
  success: true
  message?: string
  data: T
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: string
}

export interface User {
  id: number
  email: string
  firstname: string
  lastname: string
  phone: string
  role: {
    id: number
    name: string
    displayName: string
    level: number
  }
  permissions: string[]
  isSuperAdmin: boolean
  isAdmin: boolean
  associationId: number | null
}

// ========================================
// STORAGE HELPERS
// ========================================

const TOKEN_KEYS = {
  ACCESS: 'cadep_access_token',
  REFRESH: 'cadep_refresh_token',
  EXPIRES: 'cadep_token_expires',
  USER: 'cadep_user',
} as const

export const tokenStorage = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEYS.ACCESS)
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEYS.REFRESH)
  },

  getUser: (): User | null => {
    const user = localStorage.getItem(TOKEN_KEYS.USER)
    return user ? JSON.parse(user) : null
  },

  setTokens: (tokens: AuthTokens, user?: User): void => {
    localStorage.setItem(TOKEN_KEYS.ACCESS, tokens.accessToken)
    localStorage.setItem(TOKEN_KEYS.REFRESH, tokens.refreshToken)
    localStorage.setItem(TOKEN_KEYS.EXPIRES, tokens.expiresAt)
    if (user) {
      localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user))
    }
  },

  setUser: (user: User): void => {
    localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user))
  },

  clearTokens: (): void => {
    localStorage.removeItem(TOKEN_KEYS.ACCESS)
    localStorage.removeItem(TOKEN_KEYS.REFRESH)
    localStorage.removeItem(TOKEN_KEYS.EXPIRES)
    localStorage.removeItem(TOKEN_KEYS.USER)
  },

  isTokenExpired: (): boolean => {
    const expiresAt = localStorage.getItem(TOKEN_KEYS.EXPIRES)
    if (!expiresAt) return true

    // Considérer expiré 1 minute avant la vraie expiration (marge de sécurité)
    const expirationDate = new Date(expiresAt)
    const now = new Date()
    const marginMs = 60 * 1000 // 1 minute

    return now.getTime() >= expirationDate.getTime() - marginMs
  },

  isAuthenticated: (): boolean => {
    return !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired()
  },
}

// ========================================
// REFRESH TOKEN LOGIC
// ========================================

let isRefreshing = false
let refreshPromise: Promise<string> | null = null
let refreshSubscribers: Array<(token: string) => void> = []

const subscribeTokenRefresh = (callback: (token: string) => void): void => {
  refreshSubscribers.push(callback)
}

const onTokenRefreshed = (token: string): void => {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

const onRefreshError = (): void => {
  refreshSubscribers = []
}

/**
 * Rafraîchit le token d'accès
 */
async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefreshToken()

  if (!refreshToken) {
    throw new ApiRequestError('No refresh token available', 'NO_REFRESH_TOKEN', 401)
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      // Refresh token invalide ou expiré → déconnexion
      tokenStorage.clearTokens()
      throw new ApiRequestError(
        data.message || 'Session expired',
        data.code || 'REFRESH_FAILED',
        response.status
      )
    }

    // Sauvegarder les nouveaux tokens
    tokenStorage.setTokens({
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
      expiresAt: data.data.expiresAt,
    })

    return data.data.accessToken
  } catch (error) {
    tokenStorage.clearTokens()
    throw error
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
        resolve(token)
      })
      // Timeout de sécurité
      setTimeout(() => reject(new Error('Refresh timeout')), 10000)
    })
  }

  isRefreshing = true
  refreshPromise = refreshAccessToken()

  try {
    const newToken = await refreshPromise
    onTokenRefreshed(newToken)
    return newToken
  } catch (error) {
    onRefreshError()
    throw error
  } finally {
    isRefreshing = false
    refreshPromise = null
  }
}

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
    super(message)
    this.name = 'ApiRequestError'
  }

  static fromResponse(data: ApiError, status: number): ApiRequestError {
    return new ApiRequestError(data.message, data.code || 'API_ERROR', status, data.errors)
  }
}

// ========================================
// MAIN API REQUEST FUNCTION
// ========================================

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown> | FormData
  skipAuth?: boolean
  retryCount?: number
}

/**
 * Fonction principale pour les appels API
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, skipAuth = false, retryCount = 0, ...fetchOptions } = options

  // Construire les headers
  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  }

  // Ajouter Content-Type si pas FormData
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  // Ajouter le token d'authentification
  if (!skipAuth) {
    const accessToken = tokenStorage.getAccessToken()
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }
  }

  // Construire la requête
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`
  
  const requestInit: RequestInit = {
    ...fetchOptions,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  }

  try {
    const response = await fetch(url, requestInit)
    const data = await response.json()

    // Token expiré → tenter un refresh
    if (response.status === 401 && !skipAuth && retryCount < 1) {
      try {
        await handleTokenRefresh()
        
        // Réessayer la requête avec le nouveau token
        return apiRequest<T>(endpoint, {
          ...options,
          retryCount: retryCount + 1,
        })
      } catch (refreshError) {
        // Échec du refresh → rediriger vers login
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: 'session_expired' } }))
        throw new ApiRequestError('Votre session a expiré. Veuillez vous reconnecter.', 'SESSION_EXPIRED', 401)
      }
    }

    // Gérer les erreurs
    if (!response.ok || data.success === false) {
      throw ApiRequestError.fromResponse(data, response.status)
    }

    return data.data as T
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error
    }

    // Erreur réseau
    throw new ApiRequestError(
      'Impossible de contacter le serveur. Vérifiez votre connexion.',
      'NETWORK_ERROR',
      0
    )
  }
}

// ========================================
// API METHODS HELPERS
// ========================================

export const api = {
  get: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = unknown>(endpoint: string, body?: Record<string, unknown>, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T = unknown>(endpoint: string, body?: Record<string, unknown>, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T = unknown>(endpoint: string, body?: Record<string, unknown>, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
}

// ========================================
// AUTH API
// ========================================

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  association: {
    name: string
    rna: string
    siret: string
    email: string
    phone: string
    address: string
    city: string
    postalCode: string
  }
  responsable: {
    email: string
    password: string
    passwordConfirmation: string
    firstname: string
    lastname: string
    phone: string
    city_code: string
    dateOfBirth: string
    sexe: 'Homme' | 'Femme'
  }
}

export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
  expiresAt: string
}

export const authApi = {
  /**
   * Connexion
   */
  login: async (credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> => {
    const response = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: credentials,
      skipAuth: true,
    })

    const tokens: AuthTokens = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresAt: response.expiresAt,
    }

    // Sauvegarder les tokens
    tokenStorage.setTokens(tokens, response.user)

    return { user: response.user, tokens }
  },

  /**
   * Inscription d'une association
   */
  register: async (data: RegisterData): Promise<{ association: unknown; user: User }> => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: data,
      skipAuth: true,
    })
  },

  /**
   * Déconnexion
   */
  logout: async (): Promise<void> => {
    const refreshToken = tokenStorage.getRefreshToken()

    try {
      if (refreshToken) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: { refreshToken },
        })
      }
    } catch (error) {
      // Ignorer les erreurs de logout
      console.warn('Logout error:', error)
    } finally {
      tokenStorage.clearTokens()
      window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: 'user_logout' } }))
    }
  },

  /**
   * Déconnexion de tous les appareils
   */
  logoutAll: async (): Promise<void> => {
    try {
      await apiRequest('/auth/logout-all', { method: 'POST' })
    } finally {
      tokenStorage.clearTokens()
      window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: 'logout_all' } }))
    }
  },

  /**
   * Récupérer le profil courant
   */
  me: async (): Promise<User> => {
    const response = await apiRequest<{ user: User }>('/users/me')
    tokenStorage.setUser(response.user)
    return response.user
  },

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated: (): boolean => {
    return tokenStorage.isAuthenticated()
  },

  /**
   * Récupérer l'utilisateur courant depuis le storage
   */
  getCurrentUser: (): User | null => {
    return tokenStorage.getUser()
  },
}

// ========================================
// USERS API
// ========================================

export interface CreateUserData {
  roleId: number
  email: string
  password: string
  passwordConfirmation: string
  firstname: string
  lastname: string
  phone: string
  city_code: string
  dateOfBirth: string
  sexe: 'Homme' | 'Femme'
}

export interface UpdateUserData {
  firstname?: string
  lastname?: string
  phone?: string
  city_code?: string
  email?: string
  roleId?: number
  isActive?: boolean
}

export interface UsersListParams {
  page?: number
  limit?: number
  search?: string
  roleId?: number
  roleName?: string
  isActive?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  users: T[]
  meta: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
  }
}

export const usersApi = {
  /**
   * Lister les utilisateurs
   */
  list: async (params: UsersListParams = {}): Promise<PaginatedResponse<User>> => {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })
    const query = queryParams.toString()
    return api.get(`/users${query ? `?${query}` : ''}`)
  },

  /**
   * Récupérer un utilisateur
   */
  get: async (id: number): Promise<{ user: User }> => {
    return api.get(`/users/${id}`)
  },

  /**
   * Créer un utilisateur
   */
  create: async (data: CreateUserData): Promise<{ user: User }> => {
    return api.post('/users', data)
  },

  /**
   * Modifier un utilisateur
   */
  update: async (id: number, data: UpdateUserData): Promise<{ user: User }> => {
    return api.put(`/users/${id}`, data)
  },

  /**
   * Supprimer un utilisateur
   */
  delete: async (id: number): Promise<void> => {
    return api.delete(`/users/${id}`)
  },

  /**
   * Activer/Désactiver un utilisateur
   */
  toggleActive: async (id: number): Promise<{ user: User }> => {
    return api.post(`/users/${id}/toggle-active`)
  },

  /**
   * Réinitialiser le mot de passe
   */
  resetPassword: async (id: number, newPassword: string): Promise<void> => {
    return api.post(`/users/${id}/reset-password`, {
      newPassword,
      newPasswordConfirmation: newPassword,
    })
  },

  /**
   * Changer le rôle
   */
  changeRole: async (id: number, roleId: number): Promise<{ user: User }> => {
    return api.put(`/users/${id}/change-role`, { roleId })
  },

  /**
   * Lister les candidats en attente
   */
  pending: async (params: UsersListParams = {}): Promise<PaginatedResponse<User>> => {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })
    const query = queryParams.toString()
    return api.get(`/users/pending${query ? `?${query}` : ''}`)
  },

  /**
   * Approuver un candidat
   */
  approve: async (id: number, role: string = 'cadet'): Promise<{ user: User }> => {
    return api.post(`/users/${id}/approve`, { role })
  },

  /**
   * Rejeter un candidat
   */
  reject: async (id: number, reason?: string, deleteUser: boolean = false): Promise<void> => {
    return api.post(`/users/${id}/reject`, { reason, delete: deleteUser })
  },

  /**
   * Statistiques
   */
  stats: async (): Promise<{
    stats: {
      total: number
      active: number
      pending: number
      byRole: Record<string, number>
    }
  }> => {
    return api.get('/users/stats')
  },

  /**
   * Modifier mon profil
   */
  updateMe: async (data: Partial<UpdateUserData>): Promise<{ user: User }> => {
    return api.put('/users/me', data)
  },

  /**
   * Changer mon mot de passe
   */
  changeMyPassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<void> => {
    return api.put('/users/me/password', {
      currentPassword,
      newPassword,
      newPasswordConfirmation: newPassword,
    })
  },
}

// ========================================
// ROLES API
// ========================================

export interface Role {
  id: number
  name: string
  displayName: string
  description: string
  level: number
  isSystem: boolean
  permissions?: Permission[]
}

export interface Permission {
  id: number
  name: string
  displayName: string
  description: string
  group: string
}

export const rolesApi = {
  /**
   * Lister les rôles
   */
  list: async (): Promise<{ roles: Role[] }> => {
    return api.get('/roles')
  },

  /**
   * Récupérer un rôle
   */
  get: async (id: number): Promise<{ role: Role }> => {
    return api.get(`/roles/${id}`)
  },

  /**
   * Rôles assignables par l'utilisateur courant
   */
  assignable: async (): Promise<{ roles: Role[] }> => {
    return api.get('/roles/assignable')
  },

  /**
   * Lister les permissions
   */
  permissions: async (): Promise<{
    permissions: Record<string, Permission[]>
    all: Permission[]
  }> => {
    return api.get('/permissions')
  },

  /**
   * Mes permissions
   */
  myPermissions: async (): Promise<{
    role: Role
    permissions: string[]
    isSuperAdmin: boolean
    isAdmin: boolean
  }> => {
    return api.get('/me/permissions')
  },
}

// ========================================
// ASSOCIATIONS API
// ========================================

export interface Association {
  id: number
  name: string
  rna: string
  siret: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  country: string
  status: 'pending' | 'active' | 'suspended' | 'cancelled'
  approvedAt?: string
  subscribedAt?: string
  subscriptionEndsAt?: string
  createdAt: string
  usersCount?: number
}

export const associationsApi = {
  /**
   * Mon association
   */
  my: async (): Promise<{ association: Association }> => {
    return api.get('/my-association')
  },

  /**
   * Modifier mon association
   */
  updateMy: async (data: Partial<Association>): Promise<{ association: Association }> => {
    return api.put('/my-association', data)
  },

  // ========================================
  // ADMIN (Super Admin uniquement)
  // ========================================

  /**
   * Lister toutes les associations
   */
  list: async (params: {
    page?: number
    limit?: number
    status?: string
    search?: string
  } = {}): Promise<{
    associations: Association[]
    meta: {
      total: number
      perPage: number
      currentPage: number
      lastPage: number
    }
  }> => {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })
    const query = queryParams.toString()
    return api.get(`/admin/associations${query ? `?${query}` : ''}`)
  },

  /**
   * Récupérer une association
   */
  get: async (id: number): Promise<{ association: Association; admins: User[] }> => {
    return api.get(`/admin/associations/${id}`)
  },

  /**
   * Approuver une association
   */
  approve: async (id: number, subscriptionMonths: number = 12): Promise<{ association: Association }> => {
    return api.post(`/admin/associations/${id}/approve`, { subscriptionMonths })
  },

  /**
   * Rejeter une association
   */
  reject: async (id: number, reason?: string): Promise<void> => {
    return api.post(`/admin/associations/${id}/reject`, { reason })
  },

  /**
   * Suspendre une association
   */
  suspend: async (id: number): Promise<void> => {
    return api.post(`/admin/associations/${id}/suspend`)
  },

  /**
   * Réactiver une association
   */
  reactivate: async (id: number): Promise<{ association: Association }> => {
    return api.post(`/admin/associations/${id}/reactivate`)
  },
}

// ========================================
// EXPORT DEFAULT
// ========================================

export default {
  api,
  auth: authApi,
  users: usersApi,
  roles: rolesApi,
  associations: associationsApi,
  tokenStorage,
}