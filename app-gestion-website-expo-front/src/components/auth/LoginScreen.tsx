import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Mail, Lock } from 'lucide-react-native';
import { LoginData, User } from '../../types';
import { isWeb } from '../../utils/responsive';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { AuthApi, ApiError, mapBackendRoleToFrontend } from '../../api';
import { tokenStorage } from '../../api/tokenStorage';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  onNavigateToSign?: () => void;
  onNavigateToOrgSignup?: () => void;
}

export default function LoginScreen({ onLogin, onNavigateToSign, onNavigateToOrgSignup }: LoginScreenProps) {
  const [loginData, setLoginData] = useState<LoginData>({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [hasError, setHasError] = useState(false);

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      setErrorMessage('Veuillez remplir tous les champs');
      setHasError(true);
      return;
    }

    setErrorMessage(''); // Réinitialiser le message d'erreur
    setHasError(false);
    setIsLoading(true);

    try {
      // Appel API de connexion
      const response = await AuthApi.login({
        email: loginData.email,
        password: loginData.password,
      });

      if (response.success && response.data) {
        // Stocker les tokens avec tokenStorage
        await tokenStorage.setTokens({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1h
        });

        // Garder l'objet role tel quel (ne pas le mapper en string)
        const user: User = {
          id: response.data.user.id,
          lastname: response.data.user.lastName || response.data.user.lastname || '',
          firstname: response.data.user.firstName || response.data.user.firstname || '',
          email: response.data.user.email,
          role: response.data.user.role, // Garder l'objet role complet
          statut: response.data.user.isActive ? 'Actif' : 'Inactif',
          phone: response.data.user.phone || '',
          isSuperAdmin: response.data.user.isSuperAdmin,
          isAdmin: response.data.user.isAdmin,
          courseAccess: response.data.user.role?.name === 'formateur' || response.data.user.role?.name === 'admin' || response.data.user.role?.name === 'super_admin',
        };

        onLogin(user);
      }
    } catch (error) {
      console.error('⚠️ Login failed:', error);

      let displayErrorMessage = 'Email ou mot de passe incorrect';

      if (error instanceof ApiError) {
        // Vérifier les codes d'erreur spécifiques du backend
        if (error.message.includes('compte n\'est pas encore activé') ||
            error.message.includes('ACCOUNT_INACTIVE')) {
          displayErrorMessage =
            '⏳ Votre compte n\'est pas encore activé.\n' +
            'Un administrateur doit valider votre inscription avant que vous puissiez vous connecter.\n' +
            'Vous recevrez un email de confirmation dès que votre compte sera activé.';
        } else if (error.message.includes('association n\'est pas active') ||
                   error.message.includes('ASSOCIATION_INACTIVE')) {
          displayErrorMessage =
            '⏳ Votre association n\'est pas encore validée.\n' +
            'Un super administrateur doit approuver votre association avant que vous puissiez vous connecter.\n' +
            'Vous recevrez un email de confirmation dès que votre association sera validée.';
        } else {
          displayErrorMessage = error.message;
        }
      } else if (error instanceof Error) {
        displayErrorMessage = error.message;
      }

      setErrorMessage(displayErrorMessage);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const paddingTop = isWeb ? 0 : Platform.OS === 'ios' ? 100 : (StatusBar.currentHeight || 0) + 90;
  const headerPaddingTop = isWeb ? 10 : Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 10;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{
        flex: 1,
        backgroundColor: '#2563eb'
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          paddingHorizontal: isWeb ? 20 : 16,
          paddingTop: headerPaddingTop,
          paddingBottom: isWeb ? 20 : 12,
          zIndex: 1000,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View
            style={{
              width: isWeb ? 60 : 45,
              height: isWeb ? 60 : 45,
              backgroundColor: '#fff',
              borderRadius: isWeb ? 15 : 12,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Text style={{ fontSize: isWeb ? 30 : 22, color: '#2563eb', fontWeight: 'bold' }}>M</Text>
          </View>
          <View>
            <Text style={{ fontSize: isWeb ? 28 : 20, color: '#fff', fontWeight: 'bold', marginBottom: 4 }}>CadetApp</Text>
            <Text style={{ fontSize: isWeb ? 14 : 12, color: '#bfdbfe' }}>Devenir cadet de la somme</Text>
          </View>
        </View>
        <Button
          variant="ghost"
          size={isWeb ? "default" : "sm"}
          onPress={onNavigateToSign}
          style={{ backgroundColor: 'transparent' }}
        >
          <Text style={{ fontSize: isWeb ? 14 : 12, color: '#fff', fontWeight: '600' }}>S'inscrire</Text>
        </Button>
      </View>

      <ScrollView
        style={{ flex: 1, paddingTop }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', maxWidth: 500, alignSelf: 'center' }}>
          <View
            style={{
              backgroundColor: '#fff',
              padding: 24,
              borderRadius: 20,
              ...(isWeb ? {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.3,
                shadowRadius: 30,
                elevation: 10,
              } : {})
            }}
          >
            <Text style={{ fontSize: 24, color: '#1e293b', fontWeight: 'bold', marginBottom: 24 }}>Connexion</Text>

            {/* Message d'erreur */}
            {errorMessage && (
              <View style={{
                padding: 12,
                marginBottom: 16,
                backgroundColor: '#fef2f2',
                borderRadius: 8,
                borderLeftWidth: 4,
                borderLeftColor: '#dc2626'
              }}>
                <Text style={{ fontSize: 13, color: '#dc2626', lineHeight: 18 }}>
                  {errorMessage}
                </Text>
              </View>
            )}

            <View style={{ marginBottom: 16 }}>
              <Input
                label="Adresse email"
                placeholder="votre@email.com"
                value={loginData.email}
                onChangeText={(text) => {
                  setLoginData({ ...loginData, email: text });
                  if (errorMessage) {
                    setErrorMessage('');
                    setHasError(false);
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                onSubmitEditing={handleLogin}
                leftIcon={<Mail color="#94a3b8" size={20} />}
                wrapperStyle={hasError ? {
                  borderColor: '#dc2626',
                  borderWidth: 2,
                } : {}}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Input
                label="Mot de passe"
                placeholder="••••••••"
                value={loginData.password}
                onChangeText={(text) => {
                  setLoginData({ ...loginData, password: text });
                  if (errorMessage) {
                    setErrorMessage('');
                    setHasError(false);
                  }
                }}
                secureTextEntry
                onSubmitEditing={handleLogin}
                leftIcon={<Lock color="#94a3b8" size={20} />}
                wrapperStyle={hasError ? {
                  borderColor: '#dc2626',
                  borderWidth: 2,
                } : {}}
              />
            </View>

            <Button
              variant="default"
              size="lg"
              onPress={handleLogin}
              style={{ marginTop: 8 }}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Connexion...</Text>
                </View>
              ) : (
                'Se connecter'
              )}
            </Button>

            <View style={{ padding: 16, marginTop: 20, backgroundColor: '#fef3c7', borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#f59e0b' }}>
              <Text style={{ fontSize: 13, color: '#92400e', fontWeight: '600', marginBottom: 8 }}>ℹ️ Compte en attente de validation ?</Text>
              <Text style={{ fontSize: 12, color: '#92400e', lineHeight: 18 }}>
                Si vous venez de vous inscrire, votre compte doit être validé par un administrateur avant de pouvoir vous connecter.{'\n\n'}
                Vous recevrez un email de confirmation dès que votre compte sera activé.
              </Text>
            </View>

            {/* Lien vers inscription organisation */}
            {onNavigateToOrgSignup && (
              <View style={{ marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#e2e8f0', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>
                  Vous êtes une association ?
                </Text>
                <Button
                  variant="outline"
                  onPress={onNavigateToOrgSignup}
                  style={{ minWidth: 200 }}
                >
                  Créer votre espace association
                </Button>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}