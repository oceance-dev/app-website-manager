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
import { ArrowLeft, Building2 } from 'lucide-react-native';
import { isWeb } from '../../utils/responsive';
import { getDepartmentFromPostalCode, isValidPostalCode, Department } from '../../utils/department';
import { AuthApi, ApiError } from '../../api';
import { colors, spacing, borderRadius, shadows } from '../../theme';

interface OrganizationSignupData {
  organizationName: string;
  siret: string | null;
  rna: string | null;
  address: string | null;
  postalCode: string;
  city: string;
  country: string;
  representativeName: string;
  representativeEmail: string;
  representativePhone: string;
  password: string;
  confirmPassword: string;
}

interface OrganizationSignupScreenProps {
  onSignupSuccess: () => void;
  onNavigateToLogin?: () => void;
}

export default function OrganizationSignupScreen({
  onSignupSuccess,
  onNavigateToLogin
}: OrganizationSignupScreenProps) {
  const [formData, setFormData] = useState<OrganizationSignupData>({
    organizationName: '',
    siret: null,
    rna: null,
    address: null,
    postalCode: '',
    city: '',
    country: 'France',
    representativeName: '',
    representativeEmail: '',
    representativePhone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [departmentInfo, setDepartmentInfo] = useState<Department | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessCard, setShowSuccessCard] = useState(false);

  const handlePostalCodeChange = (postalCode: string) => {
    setFormData({ ...formData, postalCode });

    if (isValidPostalCode(postalCode)) {
      const department = getDepartmentFromPostalCode(postalCode);
      setDepartmentInfo(department);
    } else {
      setDepartmentInfo(null);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.organizationName.trim()) {
      setErrorMessage('Veuillez entrer le nom de votre association');
      return false;
    }

    if (!isValidPostalCode(formData.postalCode)) {
      setErrorMessage('Veuillez entrer un code postal valide (5 chiffres)');
      return false;
    }

    if (!formData.city.trim()) {
      setErrorMessage('Veuillez entrer la ville');
      return false;
    }

    if (!formData.country.trim()) {
      setErrorMessage('Veuillez entrer le pays');
      return false;
    }

    if (!formData.representativeName.trim()) {
      setErrorMessage('Veuillez entrer le nom complet du représentant');
      return false;
    }

    if (!formData.representativeEmail.trim()) {
      setErrorMessage('Veuillez entrer l\'email du représentant');
      return false;
    }

    if (!formData.representativePhone.trim()) {
      setErrorMessage('Veuillez entrer le téléphone du représentant');
      return false;
    }

    if (!formData.password.trim()) {
      setErrorMessage('Veuillez entrer un mot de passe');
      return false;
    }

    if (formData.password.length < 12) {
      setErrorMessage('Le mot de passe doit contenir au moins 12 caractères');
      return false;
    }

    if (!formData.confirmPassword.trim()) {
      setErrorMessage('Veuillez confirmer le mot de passe');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas');
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      // Séparer le nom complet en prénom et nom
      const nameParts = formData.representativeName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || nameParts[0];

      // Appel API pour créer l'association
      const response = await AuthApi.registerAssociation({
        association: {
          name: formData.organizationName,
          siret: formData.siret || undefined,
          rna: formData.rna || undefined,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
          address: formData.address || undefined,
        },
        responsable: {
          firstName,
          lastName,
          email: formData.representativeEmail,
          password: formData.password,
          passwordConfirmation: formData.confirmPassword,
          city_code: formData.postalCode,
          phone: formData.representativePhone,
        },
      });

      if (response.success) {
        // Afficher la carte de succès
        setShowSuccessCard(true);
      }
    } catch (error: any) {
      console.error('Error during signup:', error);

      let displayErrorMessage = 'Une erreur est survenue lors de l\'inscription';

      if (error instanceof ApiError) {
        displayErrorMessage = error.message;
      } else if (error instanceof Error) {
        displayErrorMessage = error.message;
      }

      setErrorMessage(displayErrorMessage);
    } finally {
      setLoading(false);
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
        {showSuccessCard ? (
          /* Carte de succès */
          <View style={styles.successContainer}>
            <View style={styles.successIconContainer}>
              <Text style={styles.successIcon}>✅</Text>
            </View>
            <Text style={styles.successTitle}>Inscription enregistrée !</Text>
            <Text style={styles.successMessage}>
              Votre demande d'inscription a bien été enregistrée.{'\n\n'}
              ⏳ Un super administrateur va examiner votre demande.{'\n\n'}
              Vous recevrez un email de confirmation une fois votre association validée.
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={onNavigateToLogin}
            >
              <Text style={styles.successButtonText}>Retour à la connexion</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Header avec retour */}
            <View style={styles.headerRow}>
              <TouchableOpacity style={styles.backButton} onPress={onNavigateToLogin}>
                <ArrowLeft color={colors.foreground} size={24} />
              </TouchableOpacity>
              <View style={styles.headerTitles}>
                <Text style={styles.pageTitle}>Inscription Association</Text>
                <Text style={styles.pageSubtitle}>Créez le compte de votre association</Text>
              </View>
            </View>

            <View style={styles.formContainer}>
          {/* Message d'erreur */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Section Informations de l'association */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Building2 color={colors.foreground} size={22} />
              <Text style={styles.sectionTitle}>Informations de l'association</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Renseignez les informations officielles</Text>

            {/* Nom de l'association */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Nom de l'association <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Association des Cadets de Paris"
                placeholderTextColor={colors.gray[400]}
                value={formData.organizationName}
                onChangeText={(text) => {
                  setFormData({ ...formData, organizationName: text });
                  if (errorMessage) setErrorMessage('');
                }}
              />
            </View>

            {/* SIRET et RNA (2 colonnes) */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>SIRET (optionnel)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="14 chiffres"
                    placeholderTextColor={colors.gray[400]}
                    value={formData.siret || ''}
                    onChangeText={(text) => setFormData({ ...formData, siret: text.replace(/\D/g, '').trim() === '' ? null : text.replace(/\D/g, '') })}
                    keyboardType="number-pad"
                    maxLength={14}
                  />
                </View>
              </View>

              <View style={styles.halfWidth}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>RNA (optionnel)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="W123456789"
                    placeholderTextColor={colors.gray[400]}
                    value={formData.rna || ''}
                    onChangeText={(text) => setFormData({ ...formData, rna: text.trim() === '' ? null : text.toUpperCase() })}
                    autoCapitalize="characters"
                    maxLength={10}
                  />
                </View>
              </View>
            </View>

            {/* Adresse */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adresse (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 12 rue de la République"
                placeholderTextColor={colors.gray[400]}
                value={formData.address || ''}
                onChangeText={(text) => {
                  setFormData({ ...formData, address: text.trim() === '' ? null : text });
                  if (errorMessage) setErrorMessage('');
                }}
              />
            </View>

            {/* Code postal et Ville (2 colonnes) */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Code postal <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="75001"
                    placeholderTextColor={colors.gray[400]}
                    value={formData.postalCode}
                    onChangeText={(text) => {
                      handlePostalCodeChange(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
              </View>

              <View style={styles.halfWidth}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Ville <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Paris"
                    placeholderTextColor={colors.gray[400]}
                    value={formData.city}
                    onChangeText={(text) => {
                      setFormData({ ...formData, city: text });
                      if (errorMessage) setErrorMessage('');
                    }}
                  />
                </View>
              </View>
            </View>

            {/* Affichage du département détecté */}
            {departmentInfo && (
              <View style={styles.departmentInfo}>
                <Text style={styles.departmentLabel}>📍 Département détecté :</Text>
                <Text style={styles.departmentText}>
                  {departmentInfo.name} ({departmentInfo.code})
                </Text>
                <Text style={styles.regionText}>{departmentInfo.region}</Text>
              </View>
            )}

            {/* Pays */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Pays <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="France"
                placeholderTextColor={colors.gray[400]}
                value={formData.country}
                onChangeText={(text) => {
                  setFormData({ ...formData, country: text });
                  if (errorMessage) setErrorMessage('');
                }}
              />
            </View>
          </View>

          {/* Section Représentant légal */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Représentant légal</Text>
            <Text style={styles.sectionSubtitle}>Informations du président ou représentant</Text>

            {/* Nom complet */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Nom complet <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Jean Dupont"
                placeholderTextColor={colors.gray[400]}
                value={formData.representativeName}
                onChangeText={(text) => {
                  setFormData({ ...formData, representativeName: text });
                  if (errorMessage) setErrorMessage('');
                }}
              />
            </View>

            {/* Email et Téléphone (2 colonnes) */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Email <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="president@email.fr"
                    placeholderTextColor={colors.gray[400]}
                    value={formData.representativeEmail}
                    onChangeText={(text) => {
                      setFormData({ ...formData, representativeEmail: text });
                      if (errorMessage) setErrorMessage('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.halfWidth}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Téléphone <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="06 12 34 56 78"
                    placeholderTextColor={colors.gray[400]}
                    value={formData.representativePhone}
                    onChangeText={(text) => {
                      setFormData({ ...formData, representativePhone: text });
                      if (errorMessage) setErrorMessage('');
                    }}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </View>

            {/* Mot de passe et Confirmation (2 colonnes) */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Mot de passe <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={colors.gray[400]}
                    value={formData.password}
                    onChangeText={(text) => {
                      setFormData({ ...formData, password: text });
                      if (errorMessage) setErrorMessage('');
                    }}
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.halfWidth}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Confirmer <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={colors.gray[400]}
                    value={formData.confirmPassword}
                    onChangeText={(text) => {
                      setFormData({ ...formData, confirmPassword: text });
                      if (errorMessage) setErrorMessage('');
                    }}
                    secureTextEntry
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Bouton de soumission */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Soumettre la demande d'inscription</Text>
            )}
          </TouchableOpacity>

          {/* Lien vers connexion */}
          <View style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Vous avez déjà un compte ? </Text>
            <TouchableOpacity onPress={onNavigateToLogin}>
              <Text style={styles.loginLinkButton}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
          </>
        )}
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
    padding: spacing[4],
    paddingTop: spacing[8],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[8],
    gap: spacing[4],
  },
  backButton: {
    padding: spacing[2],
  },
  headerTitles: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: spacing[1],
  },
  pageSubtitle: {
    fontSize: 15,
    color: colors.gray[600],
  },
  formContainer: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
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
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing[8],
    marginBottom: spacing[6],
    ...shadows.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: spacing[6],
  },
  inputGroup: {
    marginBottom: spacing[5],
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: spacing[2],
  },
  required: {
    color: colors.error,
  },
  input: {
    backgroundColor: colors.muted,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    fontSize: 15,
    color: colors.foreground,
    borderWidth: 0,
  },
  row: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  halfWidth: {
    flex: 1,
  },
  departmentInfo: {
    backgroundColor: colors.infoLight,
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginTop: -spacing[2],
    marginBottom: spacing[5],
    borderWidth: 1,
    borderColor: colors.info,
  },
  departmentLabel: {
    fontSize: 12,
    color: colors.gray[600],
    marginBottom: spacing[1],
  },
  departmentText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: spacing[1],
  },
  regionText: {
    fontSize: 14,
    color: colors.info,
  },
  submitButton: {
    backgroundColor: colors.navy,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    alignItems: 'center',
    ...shadows.sm,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[6],
  },
  loginLinkText: {
    fontSize: 15,
    color: colors.gray[600],
  },
  loginLinkButton: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.navy,
    textDecorationLine: 'underline',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  successIconContainer: {
    marginBottom: spacing[6],
  },
  successIcon: {
    fontSize: 80,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing[8],
  },
  successButton: {
    backgroundColor: colors.navy,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    alignItems: 'center',
    ...shadows.sm,
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
