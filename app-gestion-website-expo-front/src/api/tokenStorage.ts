/**
 * ========================================
 * Token Storage pour React Native
 * ========================================
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEYS = {
  ACCESS: 'cadep_access_token',
  REFRESH: 'cadep_refresh_token',
  EXPIRES: 'cadep_token_expires',
  USER: 'cadep_user',
} as const;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface User {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
  role: {
    id: number;
    name: string;
    displayName: string;
    level: number;
  };
  permissions: string[];
  isSuperAdmin: boolean;
  isAdmin: boolean;
  associationId: number | null;
}

export const tokenStorage = {
  getAccessToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem(TOKEN_KEYS.ACCESS);
  },

  getRefreshToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem(TOKEN_KEYS.REFRESH);
  },

  getUser: async (): Promise<User | null> => {
    const user = await AsyncStorage.getItem(TOKEN_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  setTokens: async (tokens: AuthTokens, user?: User): Promise<void> => {
    await AsyncStorage.setItem(TOKEN_KEYS.ACCESS, tokens.accessToken);
    await AsyncStorage.setItem(TOKEN_KEYS.REFRESH, tokens.refreshToken);
    await AsyncStorage.setItem(TOKEN_KEYS.EXPIRES, tokens.expiresAt);
    if (user) {
      await AsyncStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user));
    }
  },

  setUser: async (user: User): Promise<void> => {
    await AsyncStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user));
  },

  clearTokens: async (): Promise<void> => {
    await AsyncStorage.removeItem(TOKEN_KEYS.ACCESS);
    await AsyncStorage.removeItem(TOKEN_KEYS.REFRESH);
    await AsyncStorage.removeItem(TOKEN_KEYS.EXPIRES);
    await AsyncStorage.removeItem(TOKEN_KEYS.USER);
  },

  isTokenExpired: async (): Promise<boolean> => {
    const expiresAt = await AsyncStorage.getItem(TOKEN_KEYS.EXPIRES);
    if (!expiresAt) return true;

    // Considérer expiré 1 minute avant la vraie expiration (marge de sécurité)
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    const marginMs = 60 * 1000; // 1 minute

    return now.getTime() >= expirationDate.getTime() - marginMs;
  },

  isAuthenticated: async (): Promise<boolean> => {
    const accessToken = await tokenStorage.getAccessToken();
    const isExpired = await tokenStorage.isTokenExpired();
    return !!accessToken && !isExpired;
  },
};
