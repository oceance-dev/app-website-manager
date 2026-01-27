import React, { useState, useEffect } from 'react';
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
import { ArrowLeft, User, Calendar, Users, UserCog } from 'lucide-react-native';
import { isWeb } from '../../utils/responsive';
import { getDepartmentFromPostalCode, isValidPostalCode, Department } from '../../utils/department';
import { AuthApi, ApiError, AssociationsApi } from '../../api';
import { RolesApi, Role } from '../../api/roles.api';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import DatePickerWrapper from '../helperComponents/DatePickerWrapper';

interface MemberSignupData {
  firstname: string;
  lastname: string;
  dateOfbirth: string;
  sexe: number; // 0 = Homme, 1 = Femme, -1 = non sélectionné
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface MemberSignupScreenProps {
  onSignupSuccess: () => void;
  onNavigateToLogin?: () => void;
}

export default function MemberSignupScreen({
  onSignupSuccess,
  onNavigateToLogin,
}: MemberSignupScreenProps) {
  const [formData, setFormData] = useState<MemberSignupData>({
    firstname: '',
    lastname: '',
    dateOfbirth: '',
    sexe: -1,
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Associations
  const [associations, setAssociations] = useState<Array<{ id: number; name: string; postalCode: string }>>([]);
  const [selectedAssociationId, setSelectedAssociationId] = useState<number | null>(null);
  const [departmentInfo, setDepartmentInfo] = useState<Department | null>(null);

  // Rôles
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [occupiedRoleNames, setOccupiedRoleNames] = useState<string[]>([]);

  // Charger les associations au montage
  useEffect(() => {
    const loadAssociations = async () => {
      try {
        const response = await AssociationsApi.getAllPublic();

        if (response.success && response.data) {
          const associationsList = response.data.associations
            .filter(a => a.status === 'active')
            .map(a => ({
              id: a.id,
              name: a.name,
              postalCode: a.postalCode,
            }));

          setAssociations(associationsList);
        }
      } catch (error) {
        console.error('Failed to load associations:', error);
        setAssociations([]);
      }
    };

    loadAssociations();
  }, []);

  // Charger les rôles disponibles (définis manuellement car l'endpoint nécessite l'authentification)
  useEffect(() => {
    const defaultRoles: Role[] = [
      { id: 3, name: 'president', displayName: 'Président', level: 80, isActive: true, createdAt: '', updatedAt: '' },
      { id: 4, name: 'directeur_formation', displayName: 'Directeur de formation', level: 70, isActive: true, createdAt: '', updatedAt: '' },
      { id: 5, name: 'tresorier', displayName: 'Trésorier', level: 60, isActive: true, createdAt: '', updatedAt: '' },
      { id: 6, name: 'secretaire', displayName: 'Secrétaire', level: 55, isActive: true, createdAt: '', updatedAt: '' },
      { id: 7, name: 'staff', displayName: 'Staff', level: 50, isActive: true, createdAt: '', updatedAt: '' },
      { id: 8, name: 'formateur', displayName: 'Formateur', level: 45, isActive: true, createdAt: '', updatedAt: '' },
    ];

    setAvailableRoles(defaultRoles);
  }, []);

  // Charger les rôles occupés après sélection de l'association
  useEffect(() => {
    const loadOccupiedRoles = async () => {
      if (!selectedAssociationId) {
        setOccupiedRoleNames([]);
        return;
      }

      try {
        const response = await AssociationsApi.getOccupiedRoles(selectedAssociationId);

        if (response.success && response.data) {
          const occupiedRoleNames = response.data.roles;
          setOccupiedRoleNames(occupiedRoleNames);

          // Si le rôle sélectionné est occupé, le désélectionner
          const selectedRole = availableRoles.find(r => r.id === selectedRoleId);
          if (selectedRole && occupiedRoleNames.includes(selectedRole.name)) {
            setSelectedRoleId(null);
          }
        }
      } catch (error) {
        console.error('Failed to load occupied roles:', error);
        setOccupiedRoleNames([]);
      }
    };

    loadOccupiedRoles();
  }, [selectedAssociationId, availableRoles, selectedRoleId]);

  const handleAssociationSelect = (assoc: { id: number; name: string; postalCode: string }) => {
    setSelectedAssociationId(assoc.id);

    if (isValidPostalCode(assoc.postalCode)) {
      const department = getDepartmentFromPostalCode(assoc.postalCode);
      setDepartmentInfo(department);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.firstname.trim()) {
      setErrorMessage('Veuillez entrer votre prénom');
      return false;
    }

    if (!formData.lastname.trim()) {
      setErrorMessage('Veuillez entrer votre nom');
      return false;
    }

    if (!formData.dateOfbirth) {
      setErrorMessage('Veuillez entrer votre date de naissance');
      return false;
    }

    if (formData.sexe !== 0 && formData.sexe !== 1) {
      setErrorMessage('Veuillez sélectionner votre sexe');
      return false;
    }

    if (!formData.phone.trim()) {
      setErrorMessage('Veuillez entrer votre téléphone');
      return false;
    }

    if (!selectedAssociationId) {
      setErrorMessage('Veuillez sélectionner une association');
      return false;
    }

    if (!selectedRoleId) {
      setErrorMessage('Veuillez sélectionner un rôle');
      return false;
    }

    if (!formData.email.trim()) {
      setErrorMessage('Veuillez entrer votre email');
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

    if (!selectedAssociationId || !selectedRoleId) {
      setErrorMessage('Veuillez sélectionner une association et un rôle');
      return;
    }

    const selectedAssoc = associations.find(a => a.id === selectedAssociationId);
    if (!selectedAssoc) {
      setErrorMessage('Association introuvable');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      const payload = {
        associationMember: {
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: formData.email,
          password: formData.password,
          passwordConfirmation: formData.confirmPassword,
          phone: formData.phone,
          city_code: selectedAssoc.postalCode,
          dateOfBirth: formData.dateOfbirth,
          sexe: formData.sexe === 0 ? 'Homme' as const : 'Femme' as const,
          associationId: selectedAssociationId,
          roleId: selectedRoleId,
        },
      };

      const response = await AuthApi.registerMember(payload);

      if (response.success && response.data) {
        setSuccessMessage(
          'Votre demande d\'inscription a bien été enregistrée.\n\n' +
          '⏳ Un administrateur de votre association va examiner votre demande.\n\n' +
          'Vous recevrez un email de confirmation une fois votre compte validé.'
        );
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
            <Text style={styles.successMessage}>{successMessage}</Text>
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
                <Text style={styles.pageTitle}>Inscription Membre</Text>
                <Text style={styles.pageSubtitle}>Rejoignez votre association</Text>
              </View>
            </View>

            <View style={styles.formContainer}>
              {/* Message d'erreur */}
              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Section Informations personnelles */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <User color={colors.foreground} size={22} />
                  <Text style={styles.sectionTitle}>Informations personnelles</Text>
                </View>
                <Text style={styles.sectionSubtitle}>Vos informations</Text>

                {/* Prénom et Nom (2 colonnes) */}
                <View style={styles.row}>
                  <View style={styles.halfWidth}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>
                        Prénom <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ex: Jean"
                        placeholderTextColor={colors.gray[400]}
                        value={formData.firstname}
                        onChangeText={(text) => {
                          setFormData({ ...formData, firstname: text });
                          if (errorMessage) setErrorMessage('');
                        }}
                      />
                    </View>
                  </View>

                  <View style={styles.halfWidth}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>
                        Nom <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ex: Dupont"
                        placeholderTextColor={colors.gray[400]}
                        value={formData.lastname}
                        onChangeText={(text) => {
                          setFormData({ ...formData, lastname: text });
                          if (errorMessage) setErrorMessage('');
                        }}
                      />
                    </View>
                  </View>
                </View>

                {/* Date de naissance */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Date de naissance <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.datePickerContainer}>
                    <Calendar color={colors.gray[400]} size={20} />
                    <DatePickerWrapper
                      value={formData.dateOfbirth}
                      onChange={(date) => {
                        setFormData({ ...formData, dateOfbirth: date });
                        if (errorMessage) setErrorMessage('');
                      }}
                      placeholder="Sélectionner une date"
                      style={styles.datePickerInput}
                    />
                  </View>
                </View>

                {/* Sexe */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Sexe <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.genderContainer}>
                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        formData.sexe === 0 && styles.genderButtonActive
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, sexe: 0 });
                        if (errorMessage) setErrorMessage('');
                      }}
                    >
                      <Text style={[
                        styles.genderText,
                        formData.sexe === 0 && styles.genderTextActive
                      ]}>
                        Masculin
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        formData.sexe === 1 && styles.genderButtonActive
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, sexe: 1 });
                        if (errorMessage) setErrorMessage('');
                      }}
                    >
                      <Text style={[
                        styles.genderText,
                        formData.sexe === 1 && styles.genderTextActive
                      ]}>
                        Féminin
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Téléphone */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Téléphone <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+33 6 12 34 56 78"
                    placeholderTextColor={colors.gray[400]}
                    value={formData.phone}
                    onChangeText={(text) => {
                      setFormData({ ...formData, phone: text });
                      if (errorMessage) setErrorMessage('');
                    }}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Section Sélection de l'association */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Users color={colors.foreground} size={22} />
                  <Text style={styles.sectionTitle}>Association</Text>
                </View>
                <Text style={styles.sectionSubtitle}>Choisissez votre association</Text>

                {associations.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                      Aucune association disponible pour le moment.
                    </Text>
                    <Text style={styles.emptyStateHint}>
                      Contactez l'administrateur de votre association pour obtenir un lien d'inscription.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.cardsGrid}>
                    {associations.map((assoc) => (
                      <TouchableOpacity
                        key={assoc.id}
                        style={[
                          styles.card,
                          selectedAssociationId === assoc.id && styles.cardActive
                        ]}
                        onPress={() => handleAssociationSelect(assoc)}
                      >
                        <View style={styles.cardHeader}>
                          <Text style={[
                            styles.cardTitle,
                            selectedAssociationId === assoc.id && styles.cardTitleActive
                          ]}>
                            {assoc.name}
                          </Text>
                          {selectedAssociationId === assoc.id && (
                            <View style={styles.checkmark}>
                              <Text style={styles.checkmarkText}>✓</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.cardSubtitle}>{assoc.postalCode}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

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

              {/* Section Sélection du rôle - Affichée seulement si une association est sélectionnée */}
              {selectedAssociationId && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <UserCog color={colors.foreground} size={22} />
                    <Text style={styles.sectionTitle}>Rôle</Text>
                  </View>
                  <Text style={styles.sectionSubtitle}>Sélectionnez votre fonction</Text>

                  {availableRoles.length === 0 ? (
                    <View style={styles.emptyState}>
                      <ActivityIndicator color={colors.navy} size="small" />
                      <Text style={styles.emptyStateText}>Chargement des rôles...</Text>
                    </View>
                  ) : (
                    <View style={styles.cardsGrid}>
                      {availableRoles.map((role) => {
                        const isOccupied = occupiedRoleNames.includes(role.name);
                        return (
                          <TouchableOpacity
                            key={role.id}
                            style={[
                              styles.card,
                              selectedRoleId === role.id && styles.cardActive,
                              isOccupied && styles.cardDisabled
                            ]}
                            onPress={() => {
                              if (isOccupied) return;
                              setSelectedRoleId(role.id);
                              if (errorMessage) setErrorMessage('');
                            }}
                            disabled={isOccupied}
                          >
                            <View style={styles.cardHeader}>
                              <Text style={[
                                styles.cardTitle,
                                selectedRoleId === role.id && styles.cardTitleActive,
                                isOccupied && styles.cardTitleDisabled
                              ]}>
                                {role.displayName}
                              </Text>
                              {selectedRoleId === role.id && !isOccupied && (
                                <View style={styles.checkmark}>
                                  <Text style={styles.checkmarkText}>✓</Text>
                                </View>
                              )}
                              {isOccupied && (
                                <Text style={styles.occupiedBadge}>Occupé</Text>
                              )}
                            </View>
                            {role.description && (
                              <Text style={[
                                styles.cardSubtitle,
                                isOccupied && styles.cardSubtitleDisabled
                              ]}>{role.description}</Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              {/* Section Compte */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <User color={colors.foreground} size={22} />
                  <Text style={styles.sectionTitle}>Informations de connexion</Text>
                </View>
                <Text style={styles.sectionSubtitle}>Créez votre compte</Text>

                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Email <Text style={styles.required}>*</Text>
                  </Text>
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
                  />
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
    marginBottom: spacing[6],
  },
  backButton: {
    padding: spacing[2],
    marginRight: spacing[3],
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
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
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
    borderRadius: borderRadius['3xl'],
    padding: spacing[8],
    marginBottom: spacing[6],
    ...shadows.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
    marginLeft: spacing[3],
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
    fontSize: 16,
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
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.muted,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
  },
  datePickerInput: {
    flex: 1,
    paddingVertical: spacing[3],
    fontSize: 15,
    color: colors.foreground,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  genderButton: {
    flex: 1,
    backgroundColor: colors.muted,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[3],
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genderButtonActive: {
    backgroundColor: colors.navyLight,
    borderColor: colors.navy,
  },
  genderText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[600],
  },
  genderTextActive: {
    color: colors.navy,
  },
  emptyState: {
    padding: spacing[6],
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  emptyStateHint: {
    fontSize: 13,
    color: colors.gray[500],
    textAlign: 'center',
  },
  cardsGrid: {
    gap: spacing[3],
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 2,
    borderColor: colors.gray[300],
  },
  cardActive: {
    backgroundColor: colors.navyLight,
    borderColor: colors.navy,
  },
  cardDisabled: {
    opacity: 0.5,
    backgroundColor: colors.gray[100],
    borderColor: colors.gray[300],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    flex: 1,
  },
  cardTitleActive: {
    color: colors.navy,
  },
  cardTitleDisabled: {
    color: colors.gray[500],
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.gray[600],
  },
  cardSubtitleDisabled: {
    color: colors.gray[400],
  },
  occupiedBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error,
    backgroundColor: colors.errorLight,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  departmentInfo: {
    backgroundColor: colors.infoLight,
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginTop: spacing[4],
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
