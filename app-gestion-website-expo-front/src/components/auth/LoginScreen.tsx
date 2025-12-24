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
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  onNavigateToSign?: () => void;
  onNavigateToOrgSignup?: () => void;
}

export default function LoginScreen({ onLogin, onNavigateToSign, onNavigateToOrgSignup }: LoginScreenProps) {
  const [loginData, setLoginData] = useState<LoginData>({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      if (isWeb) {
        alert('Veuillez remplir tous les champs');
      } else {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      }
      return;
    }

    setIsLoading(true);

    try {
      // Appel API de connexion
      const response = await AuthApi.login({
        email: loginData.email,
        password: loginData.password,
      });

      if (response.success && response.data) {
        console.log('✅ Login successful via API');

        // Stocker les tokens
        await AsyncStorage.setItem('accessToken', response.data.accessToken.value);
        await AsyncStorage.setItem('refreshToken', response.data.refreshToken.value);

        // Mapper les données utilisateur de l'API vers le format User
        const mappedRole = mapBackendRoleToFrontend(response.data.user.role);

        const user: User = {
          id: response.data.user.id,
          lastname: response.data.user.lastname,
          firstname: response.data.user.firstname,
          email: response.data.user.email,
          role: mappedRole,
          statut: response.data.user.isActive ? 'Actif' : 'Inactif',
          phone: '',
          courseAccess: ['SuperAdmin', 'Admin', 'Encadrant'].includes(mappedRole),
        };

        onLogin(user);
      }
    } catch (error) {
      console.error('⚠️ Login failed:', error);

      let errorMessage = 'Email ou mot de passe incorrect';

      if (error instanceof ApiError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      if (isWeb) {
        alert(errorMessage);
      } else {
        Alert.alert('Erreur de connexion', errorMessage);
      }
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

            <View style={{ marginBottom: 16 }}>
              <Input
                label="Adresse email"
                placeholder="votre@email.com"
                value={loginData.email}
                onChangeText={(text) => setLoginData({ ...loginData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                onSubmitEditing={handleLogin}
                leftIcon={<Mail color="#94a3b8" size={20} />}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Input
                label="Mot de passe"
                placeholder="••••••••"
                value={loginData.password}
                onChangeText={(text) => setLoginData({ ...loginData, password: text })}
                secureTextEntry
                onSubmitEditing={handleLogin}
                leftIcon={<Lock color="#94a3b8" size={20} />}
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

            <View style={{ padding: 12, marginTop: 20, backgroundColor: '#dbeafe', borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: '#1e40af', fontWeight: '600', marginBottom: 8 }}>Comptes de démonstration :</Text>
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 12, color: '#1e40af', fontWeight: '600' }}>Admin :</Text>
                <Text style={{ fontSize: 12, color: '#1e40af' }}>Email: admin@monapp.fr</Text>
                <Text style={{ fontSize: 12, color: '#1e40af' }}>Mot de passe: admin123</Text>
              </View>
              <View>
                <Text style={{ fontSize: 12, color: '#1e40af', fontWeight: '600' }}>Candidat :</Text>
                <Text style={{ fontSize: 12, color: '#1e40af' }}>Email: candidat@monapp.fr</Text>
                <Text style={{ fontSize: 12, color: '#1e40af' }}>Mot de passe: candidat123</Text>
              </View>
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