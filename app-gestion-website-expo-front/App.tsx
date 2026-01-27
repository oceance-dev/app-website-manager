import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { DripsyProvider } from 'dripsy';
import LoginScreen from './src/components/auth/LoginScreen';
import AppNavigator from './src/navigation/AppNavigator';
import SignScreen from './src/components/auth/SignScreen';
import OrganizationSignupScreen from './src/components/auth/OrganizationSignupScreen';
import MemberSignupScreen from './src/components/auth/MemberSignupScreen';
import CandidateSignupScreen from './src/components/auth/CandidateSignupScreen';
import { User } from './src/types';
import { AuthApi } from './src/api';
import { tokenStorage } from './src/api/tokenStorage';
import { authEventEmitter } from './src/api/authEventEmitter';
import theme from './src/theme/dripsyTheme';
import './src/styles/globals.css';

type AuthScreen = 'login' | 'signup' | 'org-signup' | 'member-signup' | 'candidate-signup';

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = useCallback(async () => {
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
  }, []);

  // Écouter les événements de session expirée
  useEffect(() => {
    const unsubscribe = authEventEmitter.subscribe(() => {
      console.log('🔴 Session expired - logging out user');
      setAuthScreen('login'); // Rediriger vers l'écran de connexion
      handleLogout();
    });

    return () => {
      unsubscribe();
    };
  }, [handleLogout]);

  if (!isAuthenticated) {
    if (authScreen === 'login') {
      return (
        <>
          <LoginScreen
            onLogin={handleLogin}
            onNavigateToSign={() => setAuthScreen('candidate-signup')}
            onNavigateToOrgSignup={() => setAuthScreen('org-signup')}
            onNavigateToMemberSignup={() => setAuthScreen('member-signup')}
          />
          <StatusBar style="light" />
        </>
      );
    }

    if (authScreen === 'signup') {
      return (
        <>
          <SignScreen
            onSign={handleLogin}
            onNavigateToLogin={() => setAuthScreen('login')}
          />
          <StatusBar style="light" />
        </>
      );
    }

    if (authScreen === 'org-signup') {
      return (
        <>
          <OrganizationSignupScreen
            onSignupSuccess={() => setAuthScreen('login')}
            onNavigateToLogin={() => setAuthScreen('login')}
          />
          <StatusBar style="light" />
        </>
      );
    }

    if (authScreen === 'member-signup') {
      return (
        <>
          <MemberSignupScreen
            onSignupSuccess={() => setAuthScreen('login')}
            onNavigateToLogin={() => setAuthScreen('login')}
          />
          <StatusBar style="light" />
        </>
      );
    }

    if (authScreen === 'candidate-signup') {
      return (
        <>
          <CandidateSignupScreen
            onSignupSuccess={() => setAuthScreen('login')}
            onNavigateToLogin={() => setAuthScreen('login')}
          />
          <StatusBar style="light" />
        </>
      );
    }
  }

  return (
    <>
      <AppNavigator onLogout={handleLogout} currentUser={currentUser} />
      <StatusBar style="light" />
    </>
  );
}

export default function App() {
  return (
    <DripsyProvider theme={theme}>
      <AppContent />
    </DripsyProvider>
  );
}