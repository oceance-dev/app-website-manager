/**
 * ========================================
 * Token Storage pour React Native
 * ========================================
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { User } from "../types";

const TOKEN_KEYS = {
  ACCESS: "cadep_access_token",
  REFRESH: "cadep_refresh_token",
  EXPIRES: "cadep_token_expires",
  USER: "cadep_user",
} as const;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

// Storage WRAPPER

const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return await AsyncStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export const tokenStorage = {
  // Récupérer l'accès token
  getAccessToken: async (): Promise<string | null> => {
    return await secureStorage.getItem(TOKEN_KEYS.ACCESS);
  },
  // Récupérer le refresh token
  getRefreshToken: async (): Promise<string | null> => {
    return await secureStorage.getItem(TOKEN_KEYS.REFRESH);
  },

  // Récupérer l'utilisateur (non sensible, peut rester dans AsyncStorage)
  getUser: async (): Promise<User | null> => {
    const user = await AsyncStorage.getItem(TOKEN_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  // Sauvegarder les tokens
  setTokens: async (tokens: AuthTokens, user?: User): Promise<void> => {
    await secureStorage.setItem(TOKEN_KEYS.ACCESS, tokens.accessToken);
    await secureStorage.setItem(TOKEN_KEYS.REFRESH, tokens.refreshToken);
    await secureStorage.setItem(TOKEN_KEYS.EXPIRES, tokens.expiresAt);

    if (user) {
      await AsyncStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user));
    }
  },

  setUser: async (user: User): Promise<void> => {
    await AsyncStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user));
  },

  clearTokens: async (): Promise<void> => {
    await secureStorage.removeItem(TOKEN_KEYS.ACCESS);
    await secureStorage.removeItem(TOKEN_KEYS.REFRESH);
    await secureStorage.removeItem(TOKEN_KEYS.EXPIRES);
    await AsyncStorage.removeItem(TOKEN_KEYS.USER);
  },

  isTokenExpired: async (): Promise<boolean> => {
    const expiresAt = await secureStorage.getItem(TOKEN_KEYS.EXPIRES);
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
