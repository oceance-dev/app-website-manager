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
import {
  User as UserIcon,
  Mail,
  Lock,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  CheckCircle,
} from 'lucide-react-native';
import { User } from '../../types';
import { AuthApi, ApiError } from '../../api';
import { colors, textStyles, spacing, borderRadius, shadows } from '../../theme';
import DatePickerWrapper from '../helperComponents/DatePickerWrapper';
import { getDepartmentFromPostalCode, isValidPostalCode, Department } from '../../utils/department';

interface CandidateSignupScreenProps {
  onSignupSuccess: () => void;
  onNavigateToLogin: () => void;
}

interface CandidateSignupData {
  // Informations personnelles
  firstname: string;
  lastname: string;
  dateOfBirth: string;
  sexe: 'Homme' | 'Femme' | '';
  email: string;
  phone: string;
  postalCode: string;
  city: string;

  // Responsable légal
  firstnameResponsable: string;
  lastnameResponsable: string;
  emailResponsable: string;
  phoneResponsable: string;

  // Sécurité du compte
  password: string;
  confirmPassword: string;
  parentalConsent: boolean;
  termsAccepted: boolean;
}

export default function CandidateSignupScreen({
  onSignupSuccess,
  onNavigateToLogin,
}: CandidateSignupScreenProps) {
  const [formData, setFormData] = useState<CandidateSignupData>({
    firstname: '',
    lastname: '',
    dateOfBirth: '',
    sexe: '',
    email: '',
    phone: '',
    postalCode: '',
    city: '',
    firstnameResponsable: '',
    lastnameResponsable: '',
    emailResponsable: '',
    phoneResponsable: '',
    password: '',
    confirmPassword: '',
    parentalConsent: false,
    termsAccepted: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [departmentInfo, setDepartmentInfo] = useState<Department | null>(null);

  const handlePostalCodeChange = (postalCode: string) => {
    setFormData({ ...formData, postalCode });

    if (isValidPostalCode(postalCode)) {
      const department = getDepartmentFromPostalCode(postalCode);
      setDepartmentInfo(department);
    } else {
      setDepartmentInfo(null);
    }
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    setIsLoading(true);

    try {
      // Validation des champs requis
      const missingFields: string[] = [];
      if (!formData.firstname) missingFields.push('Prénom');
      if (!formData.lastname) missingFields.push('Nom');
      if (!formData.dateOfBirth) missingFields.push('Date de naissance');
      if (!formData.sexe) missingFields.push('Genre');
      if (!formData.email) missingFields.push('Email');
      if (!formData.postalCode) missingFields.push('Code postal');
      if (!formData.firstnameResponsable) missingFields.push('Prénom du responsable légal');
      if (!formData.lastnameResponsable) missingFields.push('Nom du responsable légal');
      if (!formData.emailResponsable) missingFields.push('Email du responsable légal');
      if (!formData.phoneResponsable) missingFields.push('Téléphone du responsable légal');
      if (!formData.password) missingFields.push('Mot de passe');
      if (!formData.confirmPassword) missingFields.push('Confirmation du mot de passe');

      if (missingFields.length > 0) {
        setErrorMessage(`Champs obligatoires manquants: ${missingFields.join(', ')}`);
        return;
      }

      // Vérification des mots de passe
      if (formData.password !== formData.confirmPassword) {
        setErrorMessage('Les mots de passe ne correspondent pas');
        return;
      }

      // Vérification du mot de passe
      if (formData.password.length < 12) {
        setErrorMessage('Le mot de passe doit contenir au moins 12 caractères');
        return;
      }

      // Vérification des consentements
      if (!formData.parentalConsent) {
        setErrorMessage('L\'autorisation parentale est requise pour les mineurs');
        return;
      }

      if (!formData.termsAccepted) {
        setErrorMessage('Vous devez accepter les conditions générales d\'utilisation');
        return;
      }

      // Appel API
      // TODO: Les champs phone, city, parentalConsent, termsAccepted
      // ne sont pas encore supportés par le backend.
      const response = await AuthApi.registerCandidat({
        candidat: {
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: formData.email,
          password: formData.password,
          passwordConfirmation: formData.confirmPassword,
          city_code: formData.postalCode,
          dateOfBirth: formData.dateOfBirth,
          sexe: formData.sexe as 'Homme' | 'Femme',
        },
        parent: {
          emailParent: formData.emailResponsable,
          phoneParent: formData.phoneResponsable,
          firstNameParent: formData.firstnameResponsable,
          lastNameParent: formData.lastnameResponsable,
        },
      });

      if (response.success && response.data) {
        console.log('✅ Candidat registered successfully');
        setShowSuccessCard(true);
      }
    } catch (error) {
      console.error('⚠️ Signup failed:', error);

      let displayErrorMessage = 'Une erreur est survenue lors de l\'inscription';

      if (error instanceof ApiError) {
        displayErrorMessage = error.message;
      } else if (error instanceof Error) {
        displayErrorMessage = error.message;
      }

      setErrorMessage(displayErrorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccessCard) {
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
              <View style={styles.successContainer}>
                <View style={styles.successIconContainer}>
                  <CheckCircle color={colors.success} size={64} />
                </View>
                <Text style={styles.successTitle}>Candidature envoyée !</Text>
                <Text style={styles.successMessage}>
                  Votre candidature a bien été enregistrée.{'\n\n'}
                  ⏳ Un administrateur va examiner votre candidature.{'\n\n'}
                  Vous recevrez un email de confirmation une fois votre candidature validée.
                </Text>
                <TouchableOpacity
                  style={styles.successButton}
                  onPress={onNavigateToLogin}
                >
                  <Text style={styles.successButtonText}>Retour à la connexion</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

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
            {/* En-tête */}
            <View style={styles.headerSection}>
              <Text style={styles.title}>Devenir Cadet</Text>
              <Text style={styles.subtitle}>
                Rejoignez le programme des cadets de la sécurité civile
              </Text>
            </View>

            {/* Carte Programme Cadets */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <GraduationCap color={colors.gold} size={24} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Programme Cadets</Text>
                <Text style={styles.infoDescription}>
                  Un programme d'engagement citoyen pour les jeunes de 11 à 18 ans,
                  visant à développer des compétences en sécurité civile et à renforcer
                  les valeurs de solidarité et d'entraide.
                </Text>
              </View>
            </View>

            {/* Message d'erreur */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Section 1: Informations personnelles */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <UserIcon color={colors.navy} size={20} />
                <Text style={styles.sectionTitle}>Informations personnelles</Text>
              </View>

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Prénom *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Prénom"
                    placeholderTextColor={colors.gray[400]}
                    value={formData.firstname}
                    onChangeText={(text) => {
                      setFormData({ ...formData, firstname: text });
                      if (errorMessage) setErrorMessage('');
                    }}
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Nom *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nom"
                    placeholderTextColor={colors.gray[400]}
                    value={formData.lastname}
                    onChangeText={(text) => {
                      setFormData({ ...formData, lastname: text });
                      if (errorMessage) setErrorMessage('');
                    }}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date de naissance *</Text>
                <View style={styles.datePickerContainer}>
                  <Calendar color={colors.gray[500]} size={20} />
                  <DatePickerWrapper
                    value={formData.dateOfBirth}
                    onChange={(date) => setFormData({ ...formData, dateOfBirth: date })}
                    placeholder="JJ/MM/AAAA"
                    style={styles.datePickerInput}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Genre *</Text>
                <View style={styles.genderContainer}>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      formData.sexe === 'Homme' && styles.genderButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, sexe: 'Homme' })}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        formData.sexe === 'Homme' && styles.genderTextActive,
                      ]}
                    >
                      Homme
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      formData.sexe === 'Femme' && styles.genderButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, sexe: 'Femme' })}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        formData.sexe === 'Femme' && styles.genderTextActive,
                      ]}
                    >
                      Femme
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="votre@email.com"
                  placeholderTextColor={colors.gray[400]}
                  value={formData.email}
                  onChangeText={(text) => {
                    setFormData({ ...formData, email: text });
                    if (errorMessage) setErrorMessage('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Téléphone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 06 12 34 56 78"
                  placeholderTextColor={colors.gray[400]}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Code postal *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 80000"
                    placeholderTextColor={colors.gray[400]}
                    value={formData.postalCode}
                    onChangeText={handlePostalCodeChange}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Ville</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ville"
                    placeholderTextColor={colors.gray[400]}
                    value={formData.city}
                    onChangeText={(text) => setFormData({ ...formData, city: text })}
                  />
                </View>
              </View>

              {departmentInfo && (
                <View style={styles.departmentInfo}>
                  <Text style={styles.departmentLabel}>📍 Département détecté :</Text>
                  <Text style={styles.departmentText}>
                    {departmentInfo.name} ({departmentInfo.code})
                  </Text>
                  <Text style={styles.regionText}>{departmentInfo.region}</Text>
                </View>
              )}
            </View>

            {/* Section 2: Responsable légal */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <UserIcon color={colors.navy} size={20} />
                <Text style={styles.sectionTitle}>Responsable légal</Text>
              </View>

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Prénom du responsable *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Prénom"
                    placeholderTextColor={colors.gray[400]}
                    value={formData.firstnameResponsable}
                    onChangeText={(text) => {
                      setFormData({ ...formData, firstnameResponsable: text });
                      if (errorMessage) setErrorMessage('');
                    }}
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Nom du responsable *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nom"
                    placeholderTextColor={colors.gray[400]}
                    value={formData.lastnameResponsable}
                    onChangeText={(text) => {
                      setFormData({ ...formData, lastnameResponsable: text });
                      if (errorMessage) setErrorMessage('');
                    }}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email du responsable *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="parent@email.com"
                  placeholderTextColor={colors.gray[400]}
                  value={formData.emailResponsable}
                  onChangeText={(text) => {
                    setFormData({ ...formData, emailResponsable: text });
                    if (errorMessage) setErrorMessage('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Téléphone du responsable *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 06 12 34 56 78"
                  placeholderTextColor={colors.gray[400]}
                  value={formData.phoneResponsable}
                  onChangeText={(text) => {
                    setFormData({ ...formData, phoneResponsable: text });
                    if (errorMessage) setErrorMessage('');
                  }}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Section 3: Sécurité du compte */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Lock color={colors.navy} size={20} />
                <Text style={styles.sectionTitle}>Sécurité du compte</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mot de passe *</Text>
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
                <Text style={styles.hint}>
                  Minimum 12 caractères (majuscule, minuscule, chiffre, caractère spécial)
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirmer le mot de passe *</Text>
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

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() =>
                  setFormData({ ...formData, parentalConsent: !formData.parentalConsent })
                }
              >
                <View
                  style={[
                    styles.checkbox,
                    formData.parentalConsent && styles.checkboxChecked,
                  ]}
                >
                  {formData.parentalConsent && (
                    <Text style={styles.checkboxCheck}>✓</Text>
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  J'ai l'autorisation de mon responsable légal pour m'inscrire *
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() =>
                  setFormData({ ...formData, termsAccepted: !formData.termsAccepted })
                }
              >
                <View
                  style={[
                    styles.checkbox,
                    formData.termsAccepted && styles.checkboxChecked,
                  ]}
                >
                  {formData.termsAccepted && (
                    <Text style={styles.checkboxCheck}>✓</Text>
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  J'accepte les conditions générales d'utilisation *
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bouton de soumission */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Envoyer ma candidature</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Lien vers la connexion */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={onNavigateToLogin}
            >
              <Text style={styles.loginLinkText}>
                Déjà inscrit ? Se connecter
              </Text>
            </TouchableOpacity>
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
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[4],
  },
  formContainer: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['3xl'],
    padding: spacing[8],
    ...shadows.lg,
  },
  headerSection: {
    marginBottom: spacing[6],
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.goldLight,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[6],
    borderLeftWidth: 4,
    borderLeftColor: colors.gold,
  },
  infoIconContainer: {
    marginRight: spacing[3],
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: spacing[1],
  },
  infoDescription: {
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 20,
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
    marginBottom: spacing[8],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 2,
    borderBottomColor: colors.gray[200],
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navy,
    marginLeft: spacing[2],
  },
  inputGroup: {
    marginBottom: spacing[4],
  },
  row: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  halfWidth: {
    flex: 1,
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
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    fontSize: 16,
    color: colors.foreground,
    borderWidth: 0,
  },
  textArea: {
    minHeight: 100,
    paddingTop: spacing[3],
  },
  hint: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: spacing[1],
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.muted,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  datePickerInput: {
    flex: 1,
    fontSize: 16,
    color: colors.foreground,
    marginLeft: spacing[2],
  },
  genderContainer: {
    flexDirection: 'row',
    gap: spacing[2],
    backgroundColor: colors.muted,
    borderRadius: borderRadius.xl,
    padding: spacing[1],
  },
  genderButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: 'transparent',
  },
  genderButtonActive: {
    backgroundColor: colors.navy,
  },
  genderText: {
    fontSize: 16,
    color: colors.gray[600],
    fontWeight: '500',
  },
  genderTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  departmentInfo: {
    backgroundColor: colors.navyLight,
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    marginTop: spacing[2],
    borderLeftWidth: 4,
    borderLeftColor: colors.navy,
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
    marginBottom: spacing[0.5],
  },
  regionText: {
    fontSize: 14,
    color: colors.navy,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.gray[400],
    marginRight: spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxChecked: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  checkboxCheck: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.foreground,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: colors.navy,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[4],
    ...shadows.sm,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  loginLink: {
    marginTop: spacing[4],
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 15,
    color: colors.navy,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[4],
  },
  successIconContainer: {
    marginBottom: spacing[6],
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
    color: colors.gray[700],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing[8],
  },
  successButton: {
    backgroundColor: colors.navy,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    ...shadows.sm,
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});
