import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Bell, Lock, User, Globe, Moon, ChevronRight, Key, LogOut, X } from 'lucide-react-native';
import { useState } from 'react';
import { UsersApi, AuthApi } from '../api';
import { isWeb } from '../utils/responsive';
import { colors, textStyles, spacing, shadows, borderRadius } from '../theme';
import { Card } from '../components/cadep';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      if (isWeb) {
        alert('Veuillez remplir tous les champs');
      } else {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      }
      return;
    }

    if (newPassword !== confirmPassword) {
      if (isWeb) {
        alert('Les nouveaux mots de passe ne correspondent pas');
      } else {
        Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas');
      }
      return;
    }

    if (newPassword.length < 8) {
      if (isWeb) {
        alert('Le mot de passe doit contenir au moins 8 caractères');
      } else {
        Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères');
      }
      return;
    }

    try {
      setChangingPassword(true);
      const response = await UsersApi.changePassword({
        currentPassword,
        newPassword,
        newPasswordConfirmation: confirmPassword,
      });

      if (response.success) {
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        if (isWeb) {
          alert('Mot de passe modifié avec succès');
        } else {
          Alert.alert('Succès', 'Mot de passe modifié avec succès');
        }
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (isWeb) {
        alert(error.message || 'Erreur lors du changement de mot de passe');
      } else {
        Alert.alert('Erreur', error.message || 'Impossible de changer le mot de passe');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogoutAll = async () => {
    const confirmMessage = 'Voulez-vous vous déconnecter de tous les appareils ? Vous devrez vous reconnecter partout.';

    if (isWeb) {
      if (confirm(confirmMessage)) {
        try {
          const response = await AuthApi.logoutAll();
          if (response.success) {
            alert('Déconnexion réussie de tous les appareils');
          }
        } catch (error: any) {
          alert(error.message || 'Erreur lors de la déconnexion');
        }
      }
    } else {
      Alert.alert(
        'Déconnexion de tous les appareils',
        confirmMessage,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Déconnecter',
            style: 'destructive',
            onPress: async () => {
              try {
                const response = await AuthApi.logoutAll();
                if (response.success) {
                  Alert.alert('Succès', 'Déconnexion réussie de tous les appareils');
                }
              } catch (error: any) {
                Alert.alert('Erreur', error.message || 'Impossible de se déconnecter');
              }
            },
          },
        ]
      );
    }
  };

  const settingsSections = [
    {
      title: 'Compte',
      items: [
        { label: 'Profil', icon: User, onPress: () => {} },
        {
          label: 'Changer le mot de passe',
          icon: Key,
          onPress: () => setShowPasswordModal(true)
        },
        {
          label: 'Déconnexion de tous les appareils',
          icon: LogOut,
          onPress: handleLogoutAll
        },
      ],
    },
    {
      title: 'Préférences',
      items: [
        { label: 'Langue', icon: Globe, value: 'Français', onPress: () => {} },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Card>
        <View style={styles.content}>
          <Text style={styles.title}>Paramètres</Text>
          <Text style={styles.subtitle}>Configurez votre application</Text>

        {/* Notifications Toggle */}
        <View style={styles.section}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Bell color={colors.navy} size={20} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Notifications</Text>
                <Text style={styles.settingDescription}>
                  Recevoir les alertes
                </Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: colors.gray[400], true: colors.navy }}
              thumbColor={notifications ? colors.navyLight : colors.gray[100]}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Moon color={colors.navy} size={20} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Mode sombre</Text>
                <Text style={styles.settingDescription}>
                  Thème de l'application
                </Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: colors.gray[400], true: colors.navy }}
              thumbColor={darkMode ? colors.navyLight : colors.gray[100]}
            />
          </View>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={styles.settingItem}
                onPress={item.onPress}
              >
                <View style={styles.settingLeft}>
                  <View style={styles.iconContainer}>
                    <item.icon color={colors.navy} size={20} />
                  </View>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                </View>
                <View style={styles.settingRight}>
                  {item.value && (
                    <Text style={styles.settingValue}>{item.value}</Text>
                  )}
                  <ChevronRight color={colors.gray[500]} size={20} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Version 1.0.0</Text>
          <Text style={styles.appInfoText}>© 2025 MonApp</Text>
        </View>
        </View>
      </Card>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Changer le mot de passe</Text>
              <TouchableOpacity
                onPress={() => setShowPasswordModal(false)}
                style={styles.closeButton}
              >
                <X color={colors.gray[600]} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mot de passe actuel</Text>
                <TextInput
                  style={styles.passwordInput}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Entrez votre mot de passe actuel"
                  secureTextEntry
                  editable={!changingPassword}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nouveau mot de passe</Text>
                <TextInput
                  style={styles.passwordInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Au moins 8 caractères"
                  secureTextEntry
                  editable={!changingPassword}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirmer le nouveau mot de passe</Text>
                <TextInput
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirmez le nouveau mot de passe"
                  secureTextEntry
                  editable={!changingPassword}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowPasswordModal(false)}
                  disabled={changingPassword}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleChangePassword}
                  disabled={changingPassword}
                >
                  {changingPassword ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Enregistrer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing[4],
  },
  content: {
    padding: spacing[5],
  },
  title: {
    ...textStyles.h2,
    color: colors.navy,
    marginBottom: spacing[1],
  },
  subtitle: {
    ...textStyles.body,
    color: colors.gray[600],
    marginBottom: spacing[6],
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  sectionTitle: {
    ...textStyles.label,
    fontWeight: '600',
    color: colors.gray[600],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.navyLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  settingLabel: {
    ...textStyles.h4,
    color: colors.navy,
  },
  settingDescription: {
    ...textStyles.caption,
    color: colors.gray[600],
    marginTop: spacing[1],
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  settingValue: {
    ...textStyles.body,
    color: colors.gray[600],
  },
  appInfo: {
    alignItems: 'center',
    marginTop: spacing[6],
    paddingTop: spacing[6],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  appInfoText: {
    ...textStyles.caption,
    color: colors.gray[500],
    marginBottom: spacing[1],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: 500,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...textStyles.h3,
    color: colors.navy,
  },
  closeButton: {
    padding: spacing[1],
  },
  modalBody: {
    padding: spacing[5],
  },
  inputGroup: {
    marginBottom: spacing[4],
  },
  inputLabel: {
    ...textStyles.label,
    fontWeight: '500',
    color: colors.navy,
    marginBottom: spacing[2],
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    ...textStyles.body,
    color: colors.navy,
    backgroundColor: colors.white,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.gray[100],
  },
  cancelButtonText: {
    ...textStyles.h4,
    color: colors.gray[600],
  },
  saveButton: {
    backgroundColor: colors.navy,
  },
  saveButtonText: {
    ...textStyles.h4,
    color: colors.white,
  },
});