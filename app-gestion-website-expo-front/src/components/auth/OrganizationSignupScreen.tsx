import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { MapPin, Building2, Mail, Lock, User } from 'lucide-react-native';
import { isWeb } from '../../utils/responsive';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { getDepartmentFromPostalCode, isValidPostalCode, Department } from '../../utils/department';

interface OrganizationSignupData {
  organizationName: string;
  subdomain: string;
  siren: string;
  rna: string;
  postalCode: string;
  city: string;
  address: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface OrganizationSignupScreenProps {
  onSignupSuccess: () => void;
  onNavigateToLogin?: () => void;
}

export default function OrganizationSignupScreen({
  onSignupSuccess,
  onNavigateToLogin
}: OrganizationSignupScreenProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OrganizationSignupData>({
    organizationName: '',
    subdomain: '',
    siren: '',
    rna: '',
    postalCode: '',
    city: '',
    address: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [departmentInfo, setDepartmentInfo] = useState<Department | null>(null);

  // Gérer le changement de code postal et détecter le département
  const handlePostalCodeChange = (postalCode: string) => {
    setFormData({ ...formData, postalCode });

    if (isValidPostalCode(postalCode)) {
      const department = getDepartmentFromPostalCode(postalCode);
      setDepartmentInfo(department);
    } else {
      setDepartmentInfo(null);
    }
  };

  const validateStep1 = (): boolean => {
    if (!formData.organizationName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le nom de votre association');
      return false;
    }

    if (!formData.subdomain.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un sous-domaine');
      return false;
    }

    // Valider le format du sous-domaine (alphanumérique et tirets uniquement)
    if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
      Alert.alert('Erreur', 'Le sous-domaine doit contenir uniquement des lettres minuscules, chiffres et tirets');
      return false;
    }

    if (!isValidPostalCode(formData.postalCode)) {
      Alert.alert('Erreur', 'Veuillez entrer un code postal valide (5 chiffres)');
      return false;
    }

    if (!departmentInfo) {
      Alert.alert('Erreur', 'Département non identifié. Vérifiez votre code postal');
      return false;
    }

    if (!formData.city.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer la ville');
      return false;
    }

    return true;
  };

  const validateStep2 = (): boolean => {
    if (!formData.firstName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre prénom');
      return false;
    }

    if (!formData.lastName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom');
      return false;
    }

    if (!formData.email.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre email');
      return false;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Erreur', 'Email invalide');
      return false;
    }

    if (formData.password.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSignup = async () => {
    try {
      setLoading(true);

      // TODO: Appel API pour créer l'organisation
      // const response = await authService.signupOrganization(formData);

      // Simulation pour le moment
      console.log('Inscription organisation:', formData);
      console.log('Département:', departmentInfo);

      // Simuler un délai
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (isWeb) {
        alert('Inscription réussie ! Bienvenue sur CadetApp.');
      } else {
        Alert.alert('Succès', 'Inscription réussie ! Bienvenue sur CadetApp.');
      }

      onSignupSuccess();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const paddingTop = isWeb ? 0 : Platform.OS === 'ios' ? 100 : (StatusBar.currentHeight || 0) + 90;
  const headerPaddingTop = isWeb ? 10 : Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 10;

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
            <Text style={[styles.appSubtitle, { fontSize: isWeb ? 14 : 12 }]}>Créer votre association</Text>
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
            <Text style={styles.title}>Créer votre espace</Text>
            <Text style={styles.subtitle}>
              {step === 1 && 'Informations de votre association'}
              {step === 2 && 'Vos informations personnelles'}
              {step === 3 && 'Récapitulatif'}
            </Text>

            {/* Indicateur de progression */}
            <View style={styles.progressContainer}>
              <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
              <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
              <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
              <View style={[styles.progressLine, step >= 3 && styles.progressLineActive]} />
              <View style={[styles.progressDot, step >= 3 && styles.progressDotActive]} />
            </View>

            {/* ÉTAPE 1: Informations de l'association */}
            {step === 1 && (
              <View>
                <Input
                  label="Nom de votre association *"
                  placeholder="Ex: Cadet de la Somme"
                  value={formData.organizationName}
                  onChangeText={(text) => setFormData({ ...formData, organizationName: text })}
                  leftIcon={<Building2 color="#94a3b8" size={20} />}
                />

                <Input
                  label="Sous-domaine *"
                  placeholder="Ex: cadet-somme"
                  value={formData.subdomain}
                  onChangeText={(text) => setFormData({ ...formData, subdomain: text.toLowerCase() })}
                  autoCapitalize="none"
                />
                <Text style={styles.hint}>
                  Votre URL sera : {formData.subdomain || 'votre-nom'}.cadetapp.fr
                </Text>

                <Input
                  label="SIREN (optionnel)"
                  placeholder="Ex: 123456789"
                  value={formData.siren}
                  onChangeText={(text) => setFormData({ ...formData, siren: text })}
                  keyboardType="number-pad"
                  maxLength={9}
                />

                <Input
                  label="RNA (optionnel)"
                  placeholder="Ex: W751234567"
                  value={formData.rna}
                  onChangeText={(text) => setFormData({ ...formData, rna: text.toUpperCase() })}
                  autoCapitalize="characters"
                  maxLength={10}
                />

                <Input
                  label="Code postal *"
                  placeholder="Ex: 80000"
                  value={formData.postalCode}
                  onChangeText={handlePostalCodeChange}
                  keyboardType="number-pad"
                  maxLength={5}
                  leftIcon={<MapPin color="#94a3b8" size={20} />}
                />

                {/* Afficher le département détecté */}
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
                  label="Ville *"
                  placeholder="Ex: Amiens"
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                />

                <Input
                  label="Adresse (optionnel)"
                  placeholder="Ex: 123 rue de la République"
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  multiline
                  numberOfLines={2}
                />

                <Button onPress={handleNext} style={styles.nextButton}>
                  Continuer
                </Button>
              </View>
            )}

            {/* ÉTAPE 2: Informations personnelles */}
            {step === 2 && (
              <View>
                <View style={styles.row}>
                  <View style={styles.halfWidth}>
                    <Input
                      label="Prénom *"
                      placeholder="Votre prénom"
                      value={formData.firstName}
                      onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                      leftIcon={<User color="#94a3b8" size={20} />}
                    />
                  </View>
                  <View style={styles.halfWidth}>
                    <Input
                      label="Nom *"
                      placeholder="Votre nom"
                      value={formData.lastName}
                      onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                    />
                  </View>
                </View>

                <Input
                  label="Email *"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={<Mail color="#94a3b8" size={20} />}
                />

                <Input
                  label="Mot de passe *"
                  placeholder="••••••••"
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  secureTextEntry
                  leftIcon={<Lock color="#94a3b8" size={20} />}
                />
                <Text style={styles.hint}>Minimum 8 caractères</Text>

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

            {/* ÉTAPE 3: Récapitulatif */}
            {step === 3 && (
              <View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Association</Text>
                  <Text style={styles.summaryText}>{formData.organizationName}</Text>
                  <Text style={styles.summaryLabel}>URL : {formData.subdomain}.cadetapp.fr</Text>
                  {formData.siren && <Text style={styles.summaryLabel}>SIREN : {formData.siren}</Text>}
                  {formData.rna && <Text style={styles.summaryLabel}>RNA : {formData.rna}</Text>}
                </View>

                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Localisation</Text>
                  <Text style={styles.summaryText}>{formData.city} ({formData.postalCode})</Text>
                  {formData.address && <Text style={styles.summaryLabel}>{formData.address}</Text>}
                  {departmentInfo && (
                    <Text style={styles.summaryLabel}>
                      {departmentInfo.name} • {departmentInfo.region}
                    </Text>
                  )}
                </View>

                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Administrateur</Text>
                  <Text style={styles.summaryText}>
                    {formData.firstName} {formData.lastName}
                  </Text>
                  <Text style={styles.summaryLabel}>{formData.email}</Text>
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    🎉 Profitez de 14 jours d'essai gratuit avec accès à toutes les fonctionnalités !
                  </Text>
                </View>

                <View style={styles.buttonRow}>
                  <Button variant="outline" onPress={handlePrevious} style={styles.halfButton}>
                    Retour
                  </Button>
                  <Button onPress={handleSignup} isLoading={loading} style={styles.halfButton}>
                    Créer mon espace
                  </Button>
                </View>
              </View>
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
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
  },
  cardWeb: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 32,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
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
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  nextButton: {
    marginTop: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
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
});
