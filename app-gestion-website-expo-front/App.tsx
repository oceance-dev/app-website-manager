import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './src/components/auth/LoginScreen';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen onLogin={handleLogin} />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <>
      <AppNavigator onLogout={handleLogout} />
      <StatusBar style="light" />
    </>
  );
}