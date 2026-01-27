import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { X, Folder, Lock, Globe, Users, Eye, Edit3, Shield, Ban } from 'lucide-react-native';
import { User, FolderPermission } from '../../types';
import { RolesApi, Role } from '../../api/roles.api';
import { isMobile, getFontSize, getSpacing, getResponsivePadding, MIN_TOUCH_TARGET, getModalWidth } from '../../utils/responsive';
import { Box } from '../ui/Box';
import { colors } from '../../theme';

interface CreateFolderModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (folder: Omit<Folder, 'id' | 'createdAt'>) => Promise<void>;
  users: User[];
  currentUserId: number;
  parentFolder?: Folder | null;
}

interface Folder {
  id: number;
  name: string;
  parentId: number | null;
  createdBy: number;
  permissions: FolderPermission[];
  visibility: 'private' | 'members' | 'staff' | 'public';
  description?: string;
  icon?: string;
  color?: string;
  createdAt: string;
}

interface RolePermission {
  roleId: number;
  roleName: string;
  permission: 'blocked' | 'viewer' | 'editor' | 'admin';
}

export default function CreateFolderModal({
  visible,
  onClose,
  onCreate,
  users,
  currentUserId,
  parentFolder = null,
}: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'members' | 'staff' | 'public'>('members');
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<RolePermission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (visible) {
      loadRoles();
      setError(null);
    }
  }, [visible]);

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      const response = await RolesApi.getAll();
      if (response.success && response.data) {
        const filteredRoles = response.data.roles.filter((role) => role.name !== 'super_admin');
        setRoles(filteredRoles);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleSubmit = async () => {
    if (!folderName.trim()) {
      setError('Le nom du dossier est requis');
      return;
    }

    setError(null);
    setIsCreating(true);

    try {
      await onCreate({
        name: folderName,
        parentId: parentFolder?.id || null,
        createdBy: currentUserId,
        permissions: [],
        visibility,
        description: description.trim() || undefined,
        icon: '📁',
        color: colors.navy,
      });

      // Reset form
      setFolderName('');
      setDescription('');
      setVisibility('members');
      setSelectedRolePermissions([]);
      setError(null);
      onClose();
    } catch (error: any) {
      let errorMessage = 'Impossible de créer le dossier';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const updateRolePermission = (roleId: number, roleName: string, permission: 'blocked' | 'viewer' | 'editor' | 'admin' | null) => {
    if (permission === null) {
      setSelectedRolePermissions(selectedRolePermissions.filter((p) => p.roleId !== roleId));
    } else {
      const existingIndex = selectedRolePermissions.findIndex((p) => p.roleId === roleId);
      if (existingIndex >= 0) {
        const updated = [...selectedRolePermissions];
        updated[existingIndex] = { roleId, roleName, permission };
        setSelectedRolePermissions(updated);
      } else {
        setSelectedRolePermissions([...selectedRolePermissions, { roleId, roleName, permission }]);
      }
    }
  };

  const getRolePermission = (roleId: number): 'blocked' | 'viewer' | 'editor' | 'admin' | null => {
    const permission = selectedRolePermissions.find((p) => p.roleId === roleId);
    return permission ? permission.permission : null;
  };

  const getPermissionConfig = (permission: 'blocked' | 'viewer' | 'editor' | 'admin') => {
    const configs = {
      blocked: { Icon: Ban, label: 'Bloqué', color: colors.error },
      viewer: { Icon: Eye, label: 'Voir', color: colors.info },
      editor: { Icon: Edit3, label: 'Modifier', color: colors.success },
      admin: { Icon: Shield, label: 'Admin', color: colors.gold },
    };
    return configs[permission];
  };

  const getVisibilityConfig = () => {
    const configs = {
      private: { Icon: Lock, label: 'Privé', desc: 'Visible par vous uniquement', color: colors.gray[600] },
      staff: { Icon: Users, label: 'Personnel', desc: 'Visible par le personnel', color: colors.purple },
      members: { Icon: Folder, label: 'Membres', desc: 'Tous les membres', color: colors.navy },
      public: { Icon: Globe, label: 'Public', desc: 'Visible publiquement', color: colors.success },
    };
    return configs;
  };

  const visibilityConfigs = getVisibilityConfig();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                <Folder color={colors.navy} size={24} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Nouveau dossier</Text>
                {parentFolder && (
                  <Text style={styles.headerSubtitle}>dans {parentFolder.name}</Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={colors.gray[600]} size={24} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Error Message */}
            {error && (
              <Box variant="error" className="mb-4">
                <Text style={styles.errorText}>{error}</Text>
              </Box>
            )}

            {/* Nom du dossier */}
            <View style={styles.section}>
              <Text style={styles.label}>Nom du dossier *</Text>
              <TextInput
                style={[styles.input, error && !folderName.trim() && styles.inputError]}
                placeholder="Ex: Rapports 2025"
                placeholderTextColor="#94a3b8"
                value={folderName}
                onChangeText={(text) => {
                  setFolderName(text);
                  if (error) setError(null);
                }}
                autoFocus
              />
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.label}>Description (optionnelle)</Text>
              <TextInput
                style={[styles.textArea]}
                placeholder="Ajoutez une description..."
                placeholderTextColor="#94a3b8"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Visibilité */}
            <View style={styles.section}>
              <Text style={styles.label}>Visibilité</Text>
              <View style={styles.grid}>
                {(Object.keys(visibilityConfigs) as Array<keyof typeof visibilityConfigs>).map((key) => {
                  const config = visibilityConfigs[key];
                  const IconComponent = config.Icon;
                  const isSelected = visibility === key;

                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.visibilityCard,
                        isSelected && {
                          borderColor: config.color,
                          backgroundColor: `${config.color}08`
                        }
                      ]}
                      onPress={() => setVisibility(key)}
                    >
                      <View style={[styles.visibilityIconContainer, { backgroundColor: `${config.color}15` }]}>
                        <IconComponent
                          color={config.color}
                          size={20}
                          strokeWidth={isSelected ? 2.5 : 2}
                        />
                      </View>
                      <View style={styles.visibilityInfo}>
                        <Text style={[styles.visibilityLabel, isSelected && { color: config.color }]}>
                          {config.label}
                        </Text>
                        <Text style={styles.visibilityDesc}>{config.desc}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Permissions par rôle */}
            <View style={styles.section}>
              <Text style={styles.label}>Permissions par rôle</Text>
              <Text style={styles.helperText}>
                Définissez les accès pour chaque rôle
              </Text>

              <View style={styles.permissionsLegend}>
                {(['blocked', 'viewer', 'editor', 'admin'] as const).map((perm) => {
                  const config = getPermissionConfig(perm);
                  const IconComponent = config.Icon;
                  return (
                    <View key={perm} style={styles.legendItem}>
                      <View style={[styles.legendIcon, { backgroundColor: `${config.color}15` }]}>
                        <IconComponent color={config.color} size={14} strokeWidth={2} />
                      </View>
                      <Text style={styles.legendText}>{config.label}</Text>
                    </View>
                  );
                })}
              </View>

              {loadingRoles ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.navy} />
                  <Text style={styles.loadingText}>Chargement...</Text>
                </View>
              ) : (
                <View style={styles.rolesContainer}>
                  {roles.map((role) => {
                    const currentPermission = getRolePermission(role.id);
                    return (
                      <View key={role.id} style={styles.roleRow}>
                        <View style={styles.roleInfo}>
                          <Text style={styles.roleName}>{role.displayName}</Text>
                          <Text style={styles.roleLevel}>Niveau {role.level}</Text>
                        </View>
                        <View style={styles.permissionChips}>
                          {(['blocked', 'viewer', 'editor', 'admin'] as const).map((permission) => {
                            const isSelected = currentPermission === permission;
                            const config = getPermissionConfig(permission);
                            const IconComponent = config.Icon;

                            return (
                              <TouchableOpacity
                                key={permission}
                                style={[
                                  styles.permissionChip,
                                  isSelected && {
                                    backgroundColor: config.color,
                                    borderColor: config.color,
                                  }
                                ]}
                                onPress={() => updateRolePermission(role.id, role.name, isSelected ? null : permission)}
                              >
                                <IconComponent
                                  color={isSelected ? '#fff' : config.color}
                                  size={16}
                                  strokeWidth={2}
                                />
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isCreating}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.createButton,
                (!folderName.trim() || isCreating) && styles.buttonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!folderName.trim() || isCreating}
            >
              {isCreating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.createButtonText}>Créer le dossier</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: isMobile ? 0 : 20,
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: isMobile ? 0 : 20,
    width: isMobile ? '100%' : Math.min(600, getModalWidth()),
    maxHeight: isMobile ? '100%' : '90%',
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getResponsivePadding(),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navyLight,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: getFontSize(20),
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: getFontSize(13),
    color: colors.gray[600],
    fontWeight: '500',
  },
  closeButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  content: {
    padding: getResponsivePadding(),
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 8,
  },
  helperText: {
    fontSize: getFontSize(12),
    color: colors.gray[600],
    marginTop: -4,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: getFontSize(15),
    color: colors.foreground,
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.error,
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: getFontSize(15),
    color: colors.foreground,
    backgroundColor: colors.white,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  grid: {
    gap: 10,
  },
  visibilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  visibilityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  visibilityInfo: {
    flex: 1,
  },
  visibilityLabel: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 2,
  },
  visibilityDesc: {
    fontSize: getFontSize(12),
    color: colors.gray[600],
  },
  permissionsLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.gray[50],
    borderRadius: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendText: {
    fontSize: getFontSize(12),
    color: colors.gray[700],
    fontWeight: '500',
  },
  rolesContainer: {
    gap: 8,
  },
  roleRow: {
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'stretch' : 'center',
    padding: 14,
    backgroundColor: colors.gray[50],
    borderRadius: 10,
    gap: isMobile ? 10 : 0,
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 2,
  },
  roleLevel: {
    fontSize: getFontSize(12),
    color: colors.gray[600],
  },
  permissionChips: {
    flexDirection: 'row',
    gap: 8,
  },
  permissionChip: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: getFontSize(14),
    color: colors.gray[600],
  },
  errorText: {
    fontSize: getFontSize(14),
    color: colors.errorDark,
    lineHeight: 20,
  },
  footer: {
    flexDirection: isMobile ? 'column' : 'row',
    padding: getResponsivePadding(),
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
  },
  cancelButton: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: getFontSize(15),
    fontWeight: '600',
    color: colors.gray[700],
  },
  createButton: {
    backgroundColor: colors.navy,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  createButtonText: {
    fontSize: getFontSize(15),
    fontWeight: '600',
    color: colors.white,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
