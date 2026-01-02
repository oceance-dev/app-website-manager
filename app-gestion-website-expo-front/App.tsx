import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './src/components/auth/LoginScreen';
import AppNavigator from './src/navigation/AppNavigator';
import SignScreen from './src/components/auth/SignScreen';
import { User } from './src/types';
import { AuthApi } from './src/api';
import { tokenStorage } from './src/api/tokenStorage';
import './src/styles/globals.css';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      // Récupérer les tokens
      const accessToken = await tokenStorage.getAccessToken();
      const refreshToken = await tokenStorage.getRefreshToken();

      if (accessToken) {
        // Appel API de déconnexion
        await AuthApi.logout(accessToken, refreshToken || undefined);
        console.log('✅ Logout successful via API');
      }

      // Supprimer les tokens localement
      await tokenStorage.clearTokens();
    } catch (error) {
      console.error('⚠️ Logout error:', error);
      // Continuer la déconnexion même en cas d'erreur API
    } finally {
      // Réinitialiser l'état
      setCurrentUser(null);
      setIsAuthenticated(false);
    }
  };

  if (!isAuthenticated) {
    if (showLogin) {
      return (
        <>
          <LoginScreen
            onLogin={handleLogin}
            onNavigateToSign={() => setShowLogin(false)}
          />
          <StatusBar style="light" />
        </>
      );
    }

    return (
      <>
        <SignScreen
          onSign={handleLogin}
          onNavigateToLogin={() => setShowLogin(true)}
        />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <>
      <AppNavigator onLogout={handleLogout} currentUser={currentUser} />
      <StatusBar style="light" />
    </>
  );
}