import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Eye, EyeOff, LogIn } from 'lucide-react-native';
import { LoginData, User } from '../../types';
import { isWeb } from '../../utils/responsive';
import { AuthApi, ApiError } from '../../api';
import { tokenStorage } from '../../api/tokenStorage';
import { colors, textStyles, spacing, borderRadius, shadows } from '../../theme';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  onNavigateToSign?: () => void;
  onNavigateToOrgSignup?: () => void;
  onNavigateToMemberSignup?: () => void;
}

export default function LoginScreen({ onLogin, onNavigateToSign, onNavigateToOrgSignup, onNavigateToMemberSignup }: LoginScreenProps) {
  const [loginData, setLoginData] = useState<LoginData>({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      setErrorMessage('Veuillez remplir tous les champs');
      return;
    }

    setErrorMessage('');
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

        // Créer l'objet user
        const user: User = {
          id: response.data.user.id,
          lastname: response.data.user.lastName || response.data.user.lastname || '',
          firstname: response.data.user.firstName || response.data.user.firstname || '',
          email: response.data.user.email,
          role: response.data.user.role,
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <View style={styles.card}>
            {/* Titre et sous-titre */}
            <View style={styles.headerSection}>
              <Text style={styles.title}>Connexion</Text>
              <Text style={styles.subtitle}>
                Entrez vos identifiants pour accéder à votre espace
              </Text>
            </View>

            {/* Message d'erreur */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Champ Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="votre@email.com"
                placeholderTextColor={colors.gray[400]}
                value={loginData.email}
                onChangeText={(text) => {
                  setLoginData({ ...loginData, email: text });
                  if (errorMessage) setErrorMessage('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handleLogin}
              />
            </View>

            {/* Champ Mot de passe */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor={colors.gray[400]}
                  value={loginData.password}
                  onChangeText={(text) => {
                    setLoginData({ ...loginData, password: text });
                    if (errorMessage) setErrorMessage('');
                  }}
                  secureTextEntry={!showPassword}
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff color={colors.gray[500]} size={22} />
                  ) : (
                    <Eye color={colors.gray[500]} size={22} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Mot de passe oublié */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            {/* Bouton Se connecter */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <>
                  <LogIn color={colors.white} size={20} />
                  <Text style={styles.loginButtonText}>Se connecter</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Séparateur */}
            <View style={styles.divider}>
              <Text style={styles.dividerText}>PAS ENCORE INSCRIT ?</Text>
            </View>

            {/* Boutons d'inscription */}
            <View style={styles.signupButtons}>
              <TouchableOpacity
                style={styles.outlineButton}
                onPress={onNavigateToOrgSignup}
              >
                <Text style={styles.outlineButtonText}>Inscrire une association</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.outlineButton}
                onPress={onNavigateToMemberSignup}
              >
                <Text style={styles.outlineButtonText}>S'inscrire comme membre</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.outlineButton}
                onPress={onNavigateToSign}
              >
                <Text style={styles.outlineButtonText}>Devenir cadet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.muted,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing[4],
    paddingVertical: spacing[10],
  },
  formContainer: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['3xl'],
    padding: spacing[10],
    ...shadows.lg,
  },
  headerSection: {
    marginBottom: spacing[8],
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  errorBox: {
    backgroundColor: colors.errorLight,
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[6],
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorText: {
    fontSize: 14,
    color: colors.errorDark,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: spacing[5],
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: spacing[2],
  },
  input: {
    backgroundColor: colors.muted,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    fontSize: 16,
    color: colors.foreground,
    borderWidth: 0,
  },
  passwordContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    backgroundColor: colors.muted,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    paddingRight: spacing[12],
    fontSize: 16,
    color: colors.foreground,
    borderWidth: 0,
  },
  eyeIcon: {
    position: 'absolute',
    right: spacing[4],
    padding: spacing[2],
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing[6],
    marginTop: -spacing[2],
  },
  forgotPasswordText: {
    fontSize: 15,
    color: colors.foreground,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: colors.navy,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    ...shadows.sm,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  divider: {
    marginVertical: spacing[8],
    alignItems: 'center',
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
    letterSpacing: 0.5,
  },
  signupButtons: {
    gap: spacing[3],
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
});
