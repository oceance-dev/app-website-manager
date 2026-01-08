import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Mail, Lock, Calendar, MapPin, Building2, User as UserIcon, Users } from 'lucide-react-native';
import { SignData, User } from "../../types";
import { isWeb } from '../../utils/responsive';
import DatePickerWrapper from '../helperComponents/DatePickerWrapper';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { getDepartmentFromPostalCode, isValidPostalCode, Department } from '../../utils/department';
import { CandidatsApi, ApiError, AuthApi, AssociationsApi, RolesApi, Role } from '../../api';

type UserType = 'candidat' | 'cadet' | 'organization' | 'admin_member' | null;

interface OrganizationData {
  organizationName: string;
  rna: string | null;
  siret: string | null;
  address?: string | null;
  city: string;
  postalCode: string;
  country: string;
}

interface SignScreenProps {
  onSign: (user: User) => void;
  onNavigateToLogin?: () => void;
}

export default function SignScreen({ onSign, onNavigateToLogin }: SignScreenProps) {
  const [userType, setUserType] = useState<UserType>(null);
  const [signData, setSignData] = useState<SignData>({
    lastname: '',
    firstname: '',
    dateOfbirth: '',
    sexe: 0,
    phone: '',
    email: '',
    emailParent: '',
    password: '',
    confirmPassword: '',
    postalCode: '',
  });
  const [orgData, setOrgData] = useState<OrganizationData>({
    organizationName: '',
    rna: null,
    siret: null,
    address: null,
    city: '',
    postalCode: '',
    country: 'France',
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [departmentInfo, setDepartmentInfo] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAssociationId, setSelectedAssociationId] = useState<number | null>(null);
  const [associations, setAssociations] = useState<Array<{ id: number; name: string; postalCode: string }>>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [occupiedRoleNames, setOccupiedRoleNames] = useState<string[]>([]);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Charger les associations au montage du composant
  React.useEffect(() => {
    const loadAssociations = async () => {
      try {
        const response = await AssociationsApi.getAllPublic();

        if (response.success && response.data) {
          // Mapper les associations pour n'extraire que l'id, le nom et le code postal
          const associationsList = response.data.associations
            .filter(a => a.status === 'active') // Filtrer uniquement les associations actives
            .map(a => ({
              id: a.id,
              name: a.name,
              postalCode: a.postalCode,
            }));

          setAssociations(associationsList);
          console.log('✅ Associations loaded:', associationsList.length);
        }
      } catch (error) {
        console.error('Failed to load associations:', error);
        // En cas d'erreur, afficher un message mais ne pas bloquer l'application
        setAssociations([]);
      }
    };

    loadAssociations();
  }, []);

  // Charger les rôles disponibles - utilise un token temporaire vide car l'endpoint nécessite l'authentification
  // mais pour l'inscription, on charge les rôles publics
  React.useEffect(() => {
    const loadRoles = async () => {
      try {
        // Pour l'instant, nous allons définir les rôles manuellement car l'endpoint nécessite l'authentification
        // À terme, il faudrait créer un endpoint public pour récupérer les rôles disponibles à l'inscription
        const defaultRoles: Role[] = [
          { id: 3, name: 'president', displayName: 'Président', level: 80, isActive: true, createdAt: '', updatedAt: '' },
          { id: 4, name: 'directeur_formation', displayName: 'Directeur de formation', level: 70, isActive: true, createdAt: '', updatedAt: '' },
          { id: 5, name: 'tresorier', displayName: 'Trésorier', level: 60, isActive: true, createdAt: '', updatedAt: '' },
          { id: 6, name: 'formateur', displayName: 'Encadrant', level: 50, isActive: true, createdAt: '', updatedAt: '' },
        ];

        setAvailableRoles(defaultRoles);
        // Sélectionner le rôle Trésorier par défaut (id: 5)
        setSelectedRoleId(5);
        console.log('✅ Roles loaded:', defaultRoles.length);
      } catch (error) {
        console.error('Failed to load roles:', error);
        setAvailableRoles([]);
      }
    };

    loadRoles();
  }, []);

  // Charger les rôles occupés quand une association est sélectionnée
  React.useEffect(() => {
    const loadOccupiedRoles = async () => {
      if (!selectedAssociationId) {
        setOccupiedRoleNames([]);
        return;
      }

      try {
        const response = await AssociationsApi.getOccupiedRoles(selectedAssociationId);

        if (response.success && response.data) {
          // Les noms de rôles backend (president, directeur_formation)
          const occupiedRoleNames = response.data.roles;
          setOccupiedRoleNames(occupiedRoleNames);
          console.log('✅ Occupied roles loaded:', occupiedRoleNames);

          // Si le rôle sélectionné est occupé, sélectionner un autre rôle disponible
          const selectedRole = availableRoles.find(r => r.id === selectedRoleId);
          if (selectedRole && occupiedRoleNames.includes(selectedRole.name)) {
            const firstAvailableRole = availableRoles.find(role => !occupiedRoleNames.includes(role.name));
            if (firstAvailableRole) {
              setSelectedRoleId(firstAvailableRole.id);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load occupied roles:', error);
        setOccupiedRoleNames([]);
      }
    };

    loadOccupiedRoles();
  }, [selectedAssociationId, availableRoles, selectedRoleId]);

  // Gérer le changement de code postal
  const handlePostalCodeChange = (postalCode: string, isOrg: boolean = false) => {
    if (isOrg) {
      setOrgData({ ...orgData, postalCode });
    } else {
      setSignData({ ...signData, postalCode });
    }

    if (isValidPostalCode(postalCode)) {
      const department = getDepartmentFromPostalCode(postalCode);
      setDepartmentInfo(department);
    } else {
      setDepartmentInfo(null);
    }
  };

  const handleSign = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      if (userType === 'candidat') {
        // Créer l'objet User pour la connexion automatique
        const newUser: User = {
          id: Math.floor(Math.random() * 10000),
          lastname: signData.lastname,
          firstname: signData.firstname,
          email: signData.email,
          role: 'Candidat',  // Le candidat a le rôle 'Candidat' jusqu'à validation
          statut: 'Actif',
          phone: signData.phone || '',
          dateOfbirth: signData.dateOfbirth,
          sexe: signData.sexe,
        };

        try {
          // Appel API pour inscription cadet (optionnel - mode démo si échec)
          const response = await CandidatsApi.registerCandidat({
            lastname: signData.lastname,
            firstname: signData.firstname,
            email: signData.email,
            emailParent: signData.emailParent,
            password: signData.password,
            phone: signData.phone,
            cityCode: signData.postalCode,
            dateOfbirth: signData.dateOfbirth,
            sexe: signData.sexe,
          });
          console.log(response);
          if (response.success) {
            console.log('✅ Candidat registered via API');
          }
        } catch (apiError) {
          // L'API a échoué, mais on continue en mode démo
          console.warn('⚠️ API registration failed, continuing in demo mode:', apiError);
        }

        // Connexion automatique (fonctionne avec ou sans API)
        if (isWeb) {
          alert('Inscription réussie ! Vous pouvez maintenant télécharger vos documents.');
        } else {
          Alert.alert('Succès', 'Inscription réussie ! Vous pouvez maintenant télécharger vos documents.');
        }

        onSign(newUser);
      } else if (userType === 'organization') {
        try {
          // Appel API pour inscription organisation
          const response = await AuthApi.registerAssociation({
            association: {
              name: orgData.organizationName,
              rna: orgData.rna || undefined,
              siret: orgData.siret || undefined,
              city: orgData.city,
              postalCode: orgData.postalCode,
              country: orgData.country,
            },
            responsable: {
              firstName: signData.firstname,
              lastName: signData.lastname,
              email: signData.email,
              password: signData.password,
              passwordConfirmation: signData.confirmPassword,
            },
          });

          if (response.success && response.data) {
            console.log('✅ Association registered via API');

            // Afficher la card de confirmation
            setSuccessMessage(
              'Votre demande d\'inscription a bien été enregistrée.\n\n' +
              '⏳ Un super administrateur va examiner votre demande.\n\n' +
              'Vous recevrez un email de confirmation une fois votre association validée.'
            );
            setShowSuccessCard(true);
          }
        } catch (apiError) {
          // L'API a échoué
          console.error('⚠️ API registration failed:', apiError);
          throw apiError;
        }
      } else if (userType === 'admin_member') {
        // Vérifier que tous les champs requis sont remplis
        const missingFields = [];
        if (!signData.firstname) missingFields.push('Prénom');
        if (!signData.lastname) missingFields.push('Nom');
        if (!signData.email) missingFields.push('Email');
        if (!signData.password) missingFields.push('Mot de passe');
        if (!signData.confirmPassword) missingFields.push('Confirmation mot de passe');
        if (!signData.phone) missingFields.push('Téléphone');
        if (!signData.dateOfbirth) missingFields.push('Date de naissance');
        if (!signData.postalCode) missingFields.push('Code postal');
        if (!selectedAssociationId) missingFields.push('Association');

        if (missingFields.length > 0) {
          console.log('Missing fields:', missingFields);
          console.log('SignData:', signData);
          console.log('Selected association:', selectedAssociationId);
          throw new Error(`Champs manquants: ${missingFields.join(', ')}`);
        }

        console.log('🚀 Starting member registration...');
        console.log('Association ID:', selectedAssociationId);

        try {
          const payload = {
            associationMember: {
              firstname: signData.firstname || '',
              lastname: signData.lastname || '',
              email: signData.email || '',
              password: signData.password || '',
              passwordConfirmation: signData.confirmPassword || '',
              phone: signData.phone || '',
              city_code: signData.postalCode || '',
              dateOfBirth: signData.dateOfbirth || '',
              sexe: signData.sexe === 0 ? 'Homme' as const : 'Femme' as const,
              associationId: selectedAssociationId!,
              roleId: selectedRoleId!,
            },
          };

          console.log('📤 Sending payload:', JSON.stringify(payload, null, 2));

          const response = await AuthApi.registerMember(payload);

          console.log('📥 Response received:', response);

          if (response.success && response.data) {
            console.log('✅ Member registered via API');

            // Afficher la card de confirmation
            setSuccessMessage(
              'Votre demande d\'inscription a bien été enregistrée.\n\n' +
              '⏳ Un administrateur de votre association va examiner votre demande.\n\n' +
              'Vous recevrez un email de confirmation une fois votre compte validé.'
            );
            setShowSuccessCard(true);
          }
        } catch (apiError) {
          console.error('⚠️ Member registration failed:', apiError);
          throw apiError;
        }
      }
    } catch (error) {
      console.error('Error during registration:', error);

      let errorMessage = 'Une erreur est survenue lors de l\'inscription';

      if (error instanceof ApiError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      if (isWeb) {
        alert(errorMessage);
      } else {
        Alert.alert('Erreur', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      if (currentStep === 1 && userType) {
        // Retour au choix du type
        setUserType(null);
        setCurrentStep(0);
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  const handleSelectUserType = (type: UserType) => {
    setUserType(type);
    setCurrentStep(1);
  };

  const paddingTop = isWeb ? 0 : Platform.OS === 'ios' ? 100 : (StatusBar.currentHeight || 0) + 90;
  const headerPaddingTop = isWeb ? 10 : Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 10;

  // Calculer le nombre total d'étapes
  const totalSteps = userType === 'organization' ? 3 : (userType === 'cadet' ? 2 : (userType === 'admin_member' ? 4 : 0));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.logo, { width: isWeb ? 60 : 45, height: isWeb ? 60 : 45 }]}>
            <Text style={styles.logoText}>C</Text>
          </View>
          <View>
            <Text style={[styles.appName, { fontSize: isWeb ? 28 : 20 }]}>CadetApp</Text>
            <Text style={[styles.appSubtitle, { fontSize: isWeb ? 14 : 12 }]}>
              {userType === 'cadet' ? 'Devenir cadet' : userType === 'organization' ? 'Créer votre association' : userType === 'admin_member' ? 'Inscription membre' : 'Inscription'}
            </Text>
          </View>
        </View>
        <Button
          variant="ghost"
          size={isWeb ? "default" : "sm"}
          onPress={onNavigateToLogin}
          style={styles.loginButton}
        >
          <Text style={[styles.loginButtonText, { fontSize: isWeb ? 14 : 12 }]}>Se connecter</Text>
        </Button>
      </View>

      <ScrollView
        style={{ flex: 1, paddingTop }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          <View style={[styles.card, isWeb && styles.cardWeb]}>
            {/* Card de succès */}
            {showSuccessCard ? (
              <View style={styles.successContainer}>
                <View style={styles.successIconContainer}>
                  <Text style={styles.successIcon}>✅</Text>
                </View>
                <Text style={styles.successTitle}>Inscription enregistrée !</Text>
                <Text style={styles.successMessage}>{successMessage}</Text>
                <Button
                  onPress={onNavigateToLogin}
                  style={styles.successButton}
                >
                  Retour à la connexion
                </Button>
              </View>
            ) : (
              <>
                <Text style={styles.title}>Inscription</Text>

                {/* Étape 0 : Choix du type */}
                {currentStep === 0 && (
                  <View style={styles.choiceContainer}>
                    <Text style={styles.subtitle}>Je suis...</Text>

                    <TouchableOpacity
                      style={styles.choiceCard}
                      onPress={() => handleSelectUserType('cadet')}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.choiceIcon, { backgroundColor: '#dbeafe' }]}>
                        <UserIcon color="#2563eb" size={26} />
                      </View>
                      <Text style={styles.choiceTitle}>Un Cadet</Text>
                      <Text style={styles.choiceDescription}>
                        Rejoindre une association en tant que cadet
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.choiceCard}
                      onPress={() => handleSelectUserType('organization')}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.choiceIcon, { backgroundColor: '#dcfce7' }]}>
                        <Users color="#10b981" size={26} />
                      </View>
                      <Text style={styles.choiceTitle}>Une Association</Text>
                      <Text style={styles.choiceDescription}>
                        Créer un espace pour mon association
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.choiceCard}
                      onPress={() => handleSelectUserType('admin_member')}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.choiceIcon, { backgroundColor: '#fef3c7' }]}>
                        <Building2 color="#f59e0b" size={26} />
                      </View>
                      <Text style={styles.choiceTitle}>Membre Administratif</Text>
                      <Text style={styles.choiceDescription}>
                        Membre de l'administration de l'association
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Indicateur de progression - Affiché seulement si type sélectionné */}
                {userType && totalSteps > 0 && (
                  <View style={styles.progressContainer}>
                    {Array.from({ length: totalSteps }).map((_, index) => (
                      <React.Fragment key={index}>
                        <View
                          style={[
                            styles.progressDot,
                            currentStep >= index + 1 && styles.progressDotActive
                          ]}
                        />
                        {index < totalSteps - 1 && (
                          <View
                            style={[
                              styles.progressLine,
                              currentStep > index + 1 && styles.progressLineActive
                            ]}
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </View>
                )}

                {/* ===== INSCRIPTION CADET ===== */}
                {userType === 'cadet' && (
                  <>
                    {/* Étape 1 Cadet : Informations personnelles */}
                    {currentStep === 1 && (
                      <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Vos informations</Text>

                        <View style={styles.row}>
                          <View style={styles.halfWidth}>
                            <Input
                              label="Prénom *"
                              placeholder="Prénom"
                              value={signData.firstname}
                              onChangeText={(text) => setSignData({ ...signData, firstname: text })}
                            />
                          </View>
                          <View style={styles.halfWidth}>
                            <Input
                              label="Nom *"
                              placeholder="Nom"
                              value={signData.lastname}
                              onChangeText={(text) => setSignData({ ...signData, lastname: text })}
                            />
                          </View>
                        </View>

                        <View style={{ marginBottom: 16 }}>
                          <Text style={styles.label}>Date de naissance *</Text>
                          <View style={styles.datePickerContainer}>
                            <Calendar color="#94a3b8" size={20} />
                            <DatePickerWrapper
                              value={signData.dateOfbirth}
                              onChange={(date) => setSignData({ ...signData, dateOfbirth: date })}
                              placeholder="Date de naissance"
                              style={styles.datePickerInput}
                            />
                          </View>
                        </View>

                        <Input
                          label="Code postal *"
                          placeholder="Ex: 80000"
                          value={signData.postalCode}
                          onChangeText={(text) => handlePostalCodeChange(text, false)}
                          keyboardType="number-pad"
                          maxLength={5}
                          leftIcon={<MapPin color="#94a3b8" size={20} />}
                        />

                        {departmentInfo && (
                          <View style={styles.departmentInfo}>
                            <Text style={styles.departmentLabel}>📍 Département détecté :</Text>
                            <Text style={styles.departmentText}>
                              {departmentInfo.name} ({departmentInfo.code})
                            </Text>
                            <Text style={styles.regionText}>{departmentInfo.region}</Text>
                          </View>
                        )}

                        <View style={styles.buttonRow}>
                          <Button variant="outline" onPress={handlePrevious} style={styles.halfButton}>
                            Retour
                          </Button>
                          <Button onPress={handleNext} style={styles.halfButton}>
                            Suivant
                          </Button>
                        </View>
                      </View>
                    )}

                    {/* Étape 2 Cadet : Informations complémentaires */}
                    {currentStep === 2 && (
                      <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Informations complémentaires</Text>

                        <Input
                          label="Email *"
                          placeholder="votre@email.com"
                          value={signData.email}
                          onChangeText={(text) => setSignData({ ...signData, email: text })}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          leftIcon={<Mail color="#94a3b8" size={20} />}
                        />

                        <Input
                          label="Email du parent *"
                          placeholder="parent@email.com"
                          value={signData.emailParent}
                          onChangeText={(text) => setSignData({ ...signData, emailParent: text })}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          leftIcon={<Mail color="#94a3b8" size={20} />}
                        />

                        <View style={{ marginBottom: 16 }}>
                          <Text style={styles.label}>Sexe *</Text>
                          <View style={styles.genderContainer}>
                            <TouchableOpacity
                              style={[
                                styles.genderButton,
                                signData.sexe === 0 && styles.genderButtonActive
                              ]}
                              onPress={() => setSignData({ ...signData, sexe: 0 })}
                            >
                              <Text style={[
                                styles.genderText,
                                signData.sexe === 0 && styles.genderTextActive
                              ]}>
                                Masculin
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.genderButton,
                                signData.sexe === 1 && styles.genderButtonActive
                              ]}
                              onPress={() => setSignData({ ...signData, sexe: 1 })}
                            >
                              <Text style={[
                                styles.genderText,
                                signData.sexe === 1 && styles.genderTextActive
                              ]}>
                                Féminin
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <Input
                          label="Mot de passe *"
                          placeholder="••••••••"
                          value={signData.password}
                          onChangeText={(text) => setSignData({ ...signData, password: text })}
                          secureTextEntry
                          leftIcon={<Lock color="#94a3b8" size={20} />}
                        />

                        <View style={styles.buttonRow}>
                          <Button
                            variant="outline"
                            onPress={handlePrevious}
                            style={styles.halfButton}
                            disabled={isLoading}
                          >
                            Précédent
                          </Button>
                          <Button
                            onPress={handleSign}
                            style={styles.halfButton}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <ActivityIndicator color="#fff" size="small" />
                            ) : (
                              'S\'inscrire'
                            )}
                          </Button>
                        </View>
                      </View>
                    )}
                  </>
                )}

                {/* ===== INSCRIPTION ORGANISATION ===== */}
                {userType === 'organization' && (
                  <>
                    {/* Étape 1 Org : Informations association */}
                    {currentStep === 1 && (
                      <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Informations de l'association</Text>

                        <Input
                          label="Nom de l'association *"
                          placeholder="Ex: Cadet de la Somme"
                          value={orgData.organizationName}
                          onChangeText={(text) => setOrgData({ ...orgData, organizationName: text })}
                          leftIcon={<Building2 color="#94a3b8" size={20} />}
                        />

                        <View style={styles.row}>
                          <View style={styles.halfWidth}>
                            <Input
                              label="SIRET (optionnel)"
                              placeholder="14 chiffres"
                              value={orgData.siret || ''}
                              onChangeText={(text) => setOrgData({ ...orgData, siret: text.replace(/\D/g, '') || null })}
                              keyboardType="number-pad"
                              maxLength={14}
                            />
                          </View>
                          <View style={styles.halfWidth}>
                            <Input
                              label="RNA (optionnel)"
                              placeholder="W123456789"
                              value={orgData.rna || ''}
                              onChangeText={(text) => setOrgData({ ...orgData, rna: text.trim() === '' ? null : text.toUpperCase() })}
                              autoCapitalize="characters"
                              maxLength={10}
                            />
                          </View>
                        </View>

                        <Input
                          label="Adresse (optionnel)"
                          placeholder="Ex: 12 rue de la République"
                          value={orgData.address || ''}
                          onChangeText={(text) => setOrgData({ ...orgData, address: text.trim() === '' ? null : text })}
                          leftIcon={<MapPin color="#94a3b8" size={20} />}
                        />

                        <View style={styles.row}>
                          <View style={styles.halfWidth}>
                            <Input
                              label="Code postal *"
                              placeholder="Ex: 80000"
                              value={orgData.postalCode}
                              onChangeText={(text) => handlePostalCodeChange(text, true)}
                              keyboardType="number-pad"
                              maxLength={5}
                              leftIcon={<MapPin color="#94a3b8" size={20} />}
                            />
                          </View>
                          <View style={styles.halfWidth}>
                            <Input
                              label="Ville *"
                              placeholder="Ex: Amiens"
                              value={orgData.city}
                              onChangeText={(text) => setOrgData({ ...orgData, city: text })}
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

                        <Input
                          label="Pays *"
                          placeholder="France"
                          value={orgData.country}
                          onChangeText={(text) => setOrgData({ ...orgData, country: text })}
                        />

                        <View style={styles.buttonRow}>
                          <Button variant="outline" onPress={handlePrevious} style={styles.halfButton}>
                            Retour
                          </Button>
                          <Button onPress={handleNext} style={styles.halfButton}>
                            Continuer
                          </Button>
                        </View>
                      </View>
                    )}

                    {/* Étape 2 Org : Informations administrateur */}
                    {currentStep === 2 && (
                      <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Vos informations (Administrateur)</Text>

                        <View style={styles.row}>
                          <View style={styles.halfWidth}>
                            <Input
                              label="Prénom *"
                              placeholder="Votre prénom"
                              value={signData.firstname}
                              onChangeText={(text) => setSignData({ ...signData, firstname: text })}
                              leftIcon={<UserIcon color="#94a3b8" size={20} />}
                            />
                          </View>
                          <View style={styles.halfWidth}>
                            <Input
                              label="Nom *"
                              placeholder="Votre nom"
                              value={signData.lastname}
                              onChangeText={(text) => setSignData({ ...signData, lastname: text })}
                            />
                          </View>
                        </View>

                        <Input
                          label="Email *"
                          placeholder="votre@email.com"
                          value={signData.email}
                          onChangeText={(text) => setSignData({ ...signData, email: text })}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          leftIcon={<Mail color="#94a3b8" size={20} />}
                        />

                        <Input
                          label="Mot de passe *"
                          placeholder="••••••••"
                          value={signData.password}
                          onChangeText={(text) => setSignData({ ...signData, password: text })}
                          secureTextEntry
                          leftIcon={<Lock color="#94a3b8" size={20} />}
                        />
                        <Text style={styles.hint}>Minimum 12 caractères (majuscule, minuscule, chiffre, caractère spécial)</Text>

                        <Input
                          label="Confirmer le mot de passe *"
                          placeholder="••••••••"
                          value={signData.confirmPassword}
                          onChangeText={(text) => setSignData({ ...signData, confirmPassword: text })}
                          secureTextEntry
                          leftIcon={<Lock color="#94a3b8" size={20} />}
                        />

                        <View style={styles.buttonRow}>
                          <Button variant="outline" onPress={handlePrevious} style={styles.halfButton}>
                            Précédent
                          </Button>
                          <Button onPress={handleNext} style={styles.halfButton}>
                            Continuer
                          </Button>
                        </View>
                      </View>
                    )}

                    {/* Étape 3 Org : Récapitulatif */}
                    {currentStep === 3 && (
                      <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Récapitulatif</Text>

                        <View style={styles.summaryCard}>
                          <Text style={styles.summaryTitle}>Association</Text>
                          <Text style={styles.summaryText}>{orgData.organizationName}</Text>
                          {orgData.siret && <Text style={styles.summaryLabel}>SIRET : {orgData.siret}</Text>}
                          {orgData.rna && <Text style={styles.summaryLabel}>RNA : {orgData.rna}</Text>}
                        </View>

                        <View style={styles.summaryCard}>
                          <Text style={styles.summaryTitle}>Localisation</Text>
                          <Text style={styles.summaryText}>{orgData.city} ({orgData.postalCode})</Text>
                          <Text style={styles.summaryLabel}>{orgData.country}</Text>
                          {departmentInfo && (
                            <Text style={styles.summaryLabel}>
                              {departmentInfo.name} • {departmentInfo.region}
                            </Text>
                          )}
                        </View>

                        <View style={styles.summaryCard}>
                          <Text style={styles.summaryTitle}>Administrateur</Text>
                          <Text style={styles.summaryText}>
                            {signData.firstname} {signData.lastname}
                          </Text>
                          <Text style={styles.summaryLabel}>{signData.email}</Text>
                        </View>

                        <View style={styles.infoBox}>
                          <Text style={styles.infoText}>
                            🎉 Profitez de 14 jours d'essai gratuit avec accès à toutes les fonctionnalités !
                          </Text>
                        </View>

                        <View style={styles.buttonRow}>
                          <Button
                            variant="outline"
                            onPress={handlePrevious}
                            style={styles.halfButton}
                            disabled={isLoading}
                          >
                            Retour
                          </Button>
                          <Button
                            onPress={handleSign}
                            style={styles.halfButton}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <ActivityIndicator color="#fff" size="small" />
                            ) : (
                              'Créer mon espace'
                            )}
                          </Button>
                        </View>
                      </View>
                    )}
                  </>
                )}

                {/* ===== INSCRIPTION MEMBRE ADMINISTRATIF ===== */}
                {userType === 'admin_member' && (
                  <>
                    {/* Étape 1 : Informations personnelles */}
                    {currentStep === 1 && (
                      <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Vos informations personnelles</Text>

                        <View style={styles.row}>
                          <View style={styles.halfWidth}>
                            <Input
                              label="Prénom *"
                              placeholder="Prénom"
                              value={signData.firstname}
                              onChangeText={(text) => setSignData({ ...signData, firstname: text })}
                            />
                          </View>
                          <View style={styles.halfWidth}>
                            <Input
                              label="Nom *"
                              placeholder="Nom"
                              value={signData.lastname}
                              onChangeText={(text) => setSignData({ ...signData, lastname: text })}
                            />
                          </View>
                        </View>

                        <View style={{ marginBottom: 16 }}>
                          <Text style={styles.label}>Date de naissance *</Text>
                          <View style={styles.datePickerContainer}>
                            <Calendar color="#94a3b8" size={20} />
                            <DatePickerWrapper
                              value={signData.dateOfbirth}
                              onChange={(date) => setSignData({ ...signData, dateOfbirth: date })}
                              placeholder="Date de naissance"
                              style={styles.datePickerInput}
                            />
                          </View>
                        </View>

                        <View style={{ marginBottom: 16 }}>
                          <Text style={styles.label}>Sexe *</Text>
                          <View style={styles.genderContainer}>
                            <TouchableOpacity
                              style={[
                                styles.genderButton,
                                signData.sexe === 0 && styles.genderButtonActive
                              ]}
                              onPress={() => setSignData({ ...signData, sexe: 0 })}
                            >
                              <Text style={[
                                styles.genderText,
                                signData.sexe === 0 && styles.genderTextActive
                              ]}>
                                Masculin
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.genderButton,
                                signData.sexe === 1 && styles.genderButtonActive
                              ]}
                              onPress={() => setSignData({ ...signData, sexe: 1 })}
                            >
                              <Text style={[
                                styles.genderText,
                                signData.sexe === 1 && styles.genderTextActive
                              ]}>
                                Féminin
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <Input
                          label="Téléphone *"
                          placeholder="+33 6 12 34 56 78"
                          value={signData.phone}
                          onChangeText={(text) => setSignData({ ...signData, phone: text })}
                          keyboardType="phone-pad"
                        />

                        <View style={styles.buttonRow}>
                          <Button variant="outline" onPress={handlePrevious} style={styles.halfButton}>
                            Retour
                          </Button>
                          <Button onPress={handleNext} style={styles.halfButton}>
                            Continuer
                          </Button>
                        </View>
                      </View>
                    )}

                    {/* Étape 2 : Sélection de l'association */}
                    {currentStep === 2 && (
                      <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Sélection de l'association</Text>
                        <Text style={styles.subtitle}>Choisissez votre association</Text>

                        {associations.length === 0 ? (
                          <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: '#64748b', textAlign: 'center' }}>
                              Aucune association disponible pour le moment.
                            </Text>
                            <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 8, fontSize: 12 }}>
                              Contactez l'administrateur de votre association pour obtenir un lien d'inscription.
                            </Text>
                          </View>
                        ) : (
                          <>
                            {associations.map((assoc) => (
                              <TouchableOpacity
                                key={assoc.id}
                                style={[
                                  styles.roleCard,
                                  selectedAssociationId === assoc.id && styles.roleCardActive
                                ]}
                                onPress={() => {
                                  setSelectedAssociationId(assoc.id);
                                  // Définir automatiquement le code postal en fonction de l'association
                                  setSignData({ ...signData, postalCode: assoc.postalCode });
                                  // Vérifier le département
                                  if (isValidPostalCode(assoc.postalCode)) {
                                    const department = getDepartmentFromPostalCode(assoc.postalCode);
                                    setDepartmentInfo(department);
                                  }
                                }}
                              >
                                <View style={styles.roleHeader}>
                                  <Text style={[
                                    styles.roleTitle,
                                    selectedAssociationId === assoc.id && styles.roleTextActive
                                  ]}>
                                    {assoc.name}
                                  </Text>
                                  {selectedAssociationId === assoc.id && (
                                    <View style={styles.checkmark}>
                                      <Text style={styles.checkmarkText}>✓</Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={styles.roleDescription}>
                                  {assoc.postalCode}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </>
                        )}

                        <View style={styles.buttonRow}>
                          <Button variant="outline" onPress={handlePrevious} style={styles.halfButton}>
                            Précédent
                          </Button>
                          <Button
                            onPress={handleNext}
                            style={styles.halfButton}
                            disabled={!selectedAssociationId}
                          >
                            Continuer
                          </Button>
                        </View>
                      </View>
                    )}

                    {/* Étape 3 : Choix du rôle */}
                    {currentStep === 3 && (
                      <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Votre rôle dans l'association</Text>
                        <Text style={styles.subtitle}>Sélectionnez votre fonction</Text>

                        {availableRoles.length === 0 ? (
                          <View style={{ padding: 20, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color="#3b82f6" />
                            <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 12 }}>
                              Chargement des rôles...
                            </Text>
                          </View>
                        ) : (
                          <>
                            {availableRoles
                              .filter(role => !occupiedRoleNames.includes(role.name))
                              .map((role) => {
                                // Descriptions des rôles
                                const roleDescriptions: Record<string, string> = {
                                  'president': 'Direction de l\'association et gestion globale',
                                  'directeur_formation': 'Responsable de la formation et de l\'encadrement des cadets',
                                  'tresorier': 'Gestion comptable et accès aux documents financiers',
                                  'formateur': 'Gestion des cadets et accès aux cours et documents de formation',
                                };

                                return (
                                  <TouchableOpacity
                                    key={role.id}
                                    style={[
                                      styles.roleCard,
                                      selectedRoleId === role.id && styles.roleCardActive
                                    ]}
                                    onPress={() => setSelectedRoleId(role.id)}
                                  >
                                    <View style={styles.roleHeader}>
                                      <Text style={[
                                        styles.roleTitle,
                                        selectedRoleId === role.id && styles.roleTextActive
                                      ]}>
                                        {role.displayName}
                                      </Text>
                                      {selectedRoleId === role.id && (
                                        <View style={styles.checkmark}>
                                          <Text style={styles.checkmarkText}>✓</Text>
                                        </View>
                                      )}
                                    </View>
                                    <Text style={styles.roleDescription}>
                                      {roleDescriptions[role.name] || role.description || 'Aucune description disponible'}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                          </>
                        )}

                        <View style={styles.buttonRow}>
                          <Button variant="outline" onPress={handlePrevious} style={styles.halfButton}>
                            Précédent
                          </Button>
                          <Button
                            onPress={handleNext}
                            style={styles.halfButton}
                            disabled={!selectedRoleId}
                          >
                            Continuer
                          </Button>
                        </View>
                      </View>
                    )}

                    {/* Étape 4 : Création du compte */}
                    {currentStep === 4 && (
                      <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Création du compte</Text>

                        <Input
                          label="Email *"
                          placeholder="votre.email@exemple.fr"
                          value={signData.email}
                          onChangeText={(text) => setSignData({ ...signData, email: text })}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          leftIcon={<Mail color="#94a3b8" size={20} />}
                        />

                        <Input
                          label="Mot de passe *"
                          placeholder="••••••••"
                          value={signData.password}
                          onChangeText={(text) => setSignData({ ...signData, password: text })}
                          secureTextEntry
                          leftIcon={<Lock color="#94a3b8" size={20} />}
                        />

                        <Input
                          label="Confirmer le mot de passe *"
                          placeholder="••••••••"
                          value={signData.confirmPassword}
                          onChangeText={(text) => setSignData({ ...signData, confirmPassword: text })}
                          secureTextEntry
                          leftIcon={<Lock color="#94a3b8" size={20} />}
                        />

                        <View style={styles.summaryCard}>
                          <Text style={styles.summaryTitle}>Récapitulatif</Text>
                          <Text style={styles.summaryText}>
                            {signData.firstname} {signData.lastname}
                          </Text>
                          <Text style={styles.summaryLabel}>
                            Rôle : {availableRoles.find(r => r.id === selectedRoleId)?.displayName || 'Non sélectionné'}
                          </Text>
                          <Text style={styles.summaryLabel}>Association : {associations.find(a => a.id === selectedAssociationId)?.name || 'Non sélectionnée'}</Text>
                          <Text style={styles.summaryLabel}>{signData.email}</Text>
                        </View>

                        <View style={styles.buttonRow}>
                          <Button
                            variant="outline"
                            onPress={handlePrevious}
                            style={styles.halfButton}
                            disabled={isLoading}
                          >
                            Précédent
                          </Button>
                          <Button
                            onPress={handleSign}
                            style={styles.halfButton}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <ActivityIndicator color="#fff" size="small" />
                            ) : (
                              'S\'inscrire'
                            )}
                          </Button>
                        </View>
                      </View>
                    )}
                  </>
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2563eb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 1000,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    backgroundColor: '#fff',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 30,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  appName: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  appSubtitle: {
    color: '#bfdbfe',
  },
  loginButton: {
    backgroundColor: 'transparent',
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  formContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  cardWeb: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
    textAlign: 'center',
  },
  choiceContainer: {
    paddingVertical: 8,
    gap: 10,
  },
  choiceCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  choiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  choiceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  choiceDescription: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#cbd5e1',
  },
  progressDotActive: {
    backgroundColor: '#2563eb',
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: '#2563eb',
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  datePickerInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    marginLeft: 8,
  },
  hint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: -8,
    marginBottom: 16,
  },
  departmentInfo: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginTop: -8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  departmentLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  departmentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  regionText: {
    fontSize: 14,
    color: '#2563eb',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 4,
    backgroundColor: '#fff',
  },
  genderButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  genderButtonActive: {
    backgroundColor: '#2563eb',
  },
  genderText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  genderTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  halfButton: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  infoBox: {
    backgroundColor: '#dbeafe',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    textAlign: 'center',
  },
  roleCard: {
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  roleCardActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  roleTextActive: {
    color: '#2563eb',
  },
  roleDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 64,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  successButton: {
    width: '100%',
    maxWidth: 300,
  },
});
