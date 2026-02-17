import { useCallback, useEffect, useState } from 'react';
import { AuthApi, type AuthUser } from '@/src/api';
import { authEventEmitter } from '@/src/api/authEventEmitter';

export const useCurrentUser = (onSessionExpired?: () => void) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await AuthApi.getMe();
      if (response.success && response.data?.user) {
        setCurrentUser(response.data.user);
      }
    } catch (err: any) {
      console.error('Error loading current user:', err);
      setError(err?.message || 'Erreur lors du chargement de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    const handleSessionExpired = () => {
      console.log('Session expired');
      onSessionExpired?.();
    };

    const unsubscribe = authEventEmitter.onSessionExpired(handleSessionExpired);
    return () => unsubscribe();
  }, [onSessionExpired]);

  const canManagePermissions = currentUser && (
    currentUser.isSuperAdmin ||
    currentUser.isAdmin ||
    currentUser.role.level >= 70
  );

  const isAdminMember = currentUser && (
    currentUser.isSuperAdmin ||
    currentUser.isAdmin ||
    currentUser.role.level >= 80
  );

  return {
    currentUser,
    loading,
    error,
    canManagePermissions,
    isAdminMember,
    refetch: fetchCurrentUser,
  };
};
