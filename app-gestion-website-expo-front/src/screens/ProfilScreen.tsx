import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { User, Mail, Phone, MapPin, Calendar, Edit2, Save, X } from 'lucide-react-native';
import { UsersApi, UserResponse } from '../api/users.api';
import { isWeb } from '../utils/responsive';
import { colors, textStyles, spacing, shadows, borderRadius } from '../theme';
import { Card, Badge } from '../components/cadep';

export default function ProfilScreen() {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cityCode, setCityCode] = useState('');

  // Charger les informations de l'utilisateur
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await UsersApi.getMe();

      if (response.success && response.data?.user) {
        const userData = response.data.user;
        setUser(userData);

        // Initialiser les champs du formulaire
        setFirstName(userData.firstName || '');
        setLastName(userData.lastName || '');
        setEmail(userData.email || '');
        setPhone(userData.phone || '');
        setCityCode(userData.city_code || '');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      if (isWeb) {
        alert('Erreur lors du chargement du profil');
      } else {
        Alert.alert('Erreur', 'Impossible de charger le profil');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Sauvegarder les modifications
  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      if (isWeb) {
        alert('Veuillez remplir tous les champs obligatoires');
      } else {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      }
      return;
    }

    try {
      setSaving(true);
      const response = await UsersApi.updateMe({
        firstName,
        lastName,
        email,
        phone,
        city_code: cityCode,
      } as Partial<UserResponse>);

      if (response.success && response.data?.user) {
        setUser(response.data.user);
        setIsEditing(false);

        if (isWeb) {
          alert('Profil mis à jour avec succès');
        } else {
          Alert.alert('Succès', 'Profil mis à jour avec succès');
        }
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (isWeb) {
        alert(error.message || 'Erreur lors de la mise à jour du profil');
      } else {
        Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le profil');
      }
    } finally {
      setSaving(false);
    }
  };

  // Annuler les modifications
  const handleCancel = () => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setCityCode(user.city_code || '');
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.navy} />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Impossible de charger le profil</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserProfile}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <User color={colors.navy} size={60} />
        </View>
        <Text style={styles.userName}>
          {user.firstName} {user.lastName}
        </Text>
        <Text style={styles.userRole}>{user.role?.displayName || 'Membre'}</Text>
        {user.isActive !== undefined && (
          <Badge
            text={user.isActive ? 'Actif' : 'Inactif'}
            variant={user.isActive ? 'active' : 'inactive'}
          />
        )}
      </View>

      <View style={styles.actionsContainer}>
        {!isEditing ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <Edit2 color={colors.white} size={18} />
            <Text style={styles.editButtonText}>Modifier le profil</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editActionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <>
                  <Save color={colors.white} size={18} />
                  <Text style={styles.actionButtonText}>Enregistrer</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancel}
              disabled={saving}
            >
              <X color={colors.white} size={18} />
              <Text style={styles.actionButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>

        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <User color={colors.gray[600]} size={20} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Prénom</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Prénom"
                editable={!saving}
              />
            ) : (
              <Text style={styles.infoValue}>{user.firstName || '-'}</Text>
            )}
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <User color={colors.gray[600]} size={20} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Nom</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Nom"
                editable={!saving}
              />
            ) : (
              <Text style={styles.infoValue}>{user.lastName || '-'}</Text>
            )}
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <Mail color={colors.gray[600]} size={20} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!saving}
              />
            ) : (
              <Text style={styles.infoValue}>{user.email || '-'}</Text>
            )}
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <Phone color={colors.gray[600]} size={20} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Téléphone</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="0612345678"
                keyboardType="phone-pad"
                editable={!saving}
              />
            ) : (
              <Text style={styles.infoValue}>{user.phone || '-'}</Text>
            )}
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <MapPin color={colors.gray[600]} size={20} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Code ville</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={cityCode}
                onChangeText={setCityCode}
                placeholder="75001"
                keyboardType="number-pad"
                editable={!saving}
              />
            ) : (
              <Text style={styles.infoValue}>{user.city_code || '-'}</Text>
            )}
          </View>
        </View>

        {user.dateOfBirth && (
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Calendar color={colors.gray[600]} size={20} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date de naissance</Text>
              <Text style={styles.infoValue}>
                {new Date(user.dateOfBirth).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>
        )}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Informations du compte</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Rôle</Text>
            <Text style={styles.infoValue}>{user.role?.displayName || '-'}</Text>
          </View>
        </View>

        {user.associationId && (
          <View style={styles.infoRow}>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Association ID</Text>
              <Text style={styles.infoValue}>{user.associationId}</Text>
            </View>
          </View>
        )}

        <View style={styles.infoRow}>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Membre depuis</Text>
            <Text style={styles.infoValue}>
              {new Date(user.createdAt).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        </View>

        {user.lastLoginAt && (
          <View style={styles.infoRow}>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Dernière connexion</Text>
              <Text style={styles.infoValue}>
                {new Date(user.lastLoginAt).toLocaleDateString('fr-FR')} à{' '}
                {new Date(user.lastLoginAt).toLocaleTimeString('fr-FR')}
              </Text>
            </View>
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing[3],
    ...textStyles.body,
    color: colors.gray[600],
  },
  errorText: {
    ...textStyles.body,
    color: colors.error,
    marginBottom: spacing[4],
  },
  retryButton: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    ...textStyles.h4,
    color: colors.white,
  },
  header: {
    backgroundColor: colors.white,
    alignItems: 'center',
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
    backgroundColor: colors.navyLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  userName: {
    ...textStyles.h2,
    color: colors.navy,
    marginBottom: spacing[1],
  },
  userRole: {
    ...textStyles.body,
    color: colors.gray[600],
    marginBottom: spacing[2],
  },
  actionsContainer: {
    padding: spacing[4],
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    gap: spacing[2],
  },
  editButtonText: {
    ...textStyles.h4,
    color: colors.white,
    marginLeft: spacing[2],
  },
  editActionsContainer: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    gap: spacing[2],
  },
  saveButton: {
    backgroundColor: colors.success,
  },
  cancelButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    ...textStyles.h4,
    color: colors.white,
    marginLeft: spacing[2],
  },
  section: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  sectionTitle: {
    ...textStyles.h3,
    color: colors.navy,
    marginBottom: spacing[4],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  iconContainer: {
    width: 40,
    alignItems: 'center',
    paddingTop: spacing[1],
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...textStyles.caption,
    color: colors.gray[600],
    marginBottom: spacing[1],
  },
  infoValue: {
    ...textStyles.body,
    color: colors.navy,
  },
  input: {
    ...textStyles.body,
    color: colors.navy,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.white,
  },
});
