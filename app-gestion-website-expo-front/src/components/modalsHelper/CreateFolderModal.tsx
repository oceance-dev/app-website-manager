import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { Folder, User, FolderPermission } from '../../types';
import { getRoleDisplay } from '../../utils/permissions';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { RolesApi, Role } from '../../api/roles.api';

interface CreateFolderModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (folder: Omit<Folder, 'id' | 'createdAt'>) => void;
  users: User[];
  currentUserId: number;
  parentFolder?: Folder | null;
}

interface RolePermission {
  roleId: number;
  roleName: string;
  permission: 'viewer' | 'editor' | 'admin';
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
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<RolePermission[]>([]);

  // Charger les rôles quand la modal s'ouvre
  useEffect(() => {
    if (visible) {
      loadRoles();
    }
  }, [visible]);

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      const response = await RolesApi.getAll();
      if (response.success && response.data) {
        // Filtrer les super_admin
        const filteredRoles = response.data.roles.filter((role) => role.name !== 'super_admin');
        setRoles(filteredRoles);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleSubmit = () => {
    if (folderName.trim()) {
      onCreate({
        name: folderName,
        parentId: parentFolder?.id || null,
        createdBy: currentUserId,
        permissions: [], // Les permissions de rôles seront gérées côté backend
      });
      setFolderName('');
      setSelectedRolePermissions([]);
      onClose();
    }
  };

  const updateRolePermission = (roleId: number, roleName: string, permission: 'viewer' | 'editor' | 'admin' | null) => {
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

  const getRolePermission = (roleId: number): 'viewer' | 'editor' | 'admin' | null => {
    const permission = selectedRolePermissions.find((p) => p.roleId === roleId);
    return permission ? permission.permission : null;
  };

  const renderRolePermission = ({ item }: { item: Role }) => {
    const currentPermission = getRolePermission(item.id);

    return (
      <View style={styles.userRow}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.displayName}</Text>
          <Text style={styles.userRole}>Niveau {item.level}</Text>
        </View>

        <View style={styles.permissionButtons}>
          {(['viewer', 'editor', 'admin'] as const).map((permission) => {
            const isSelected = currentPermission === permission;
            const display = getRoleDisplay(permission);

            return (
              <TouchableOpacity
                key={permission}
                style={[
                  styles.permissionButton,
                  !isSelected && styles.permissionButtonUnselected,
                  isSelected && { backgroundColor: display.color }
                ]}
                onPress={() => updateRolePermission(item.id, item.name, isSelected ? null : permission)}
              >
                <Text style={styles.permissionIcon}>{display.icon}</Text>
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Check color="#fff" size={12} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>
                Créer un nouveau dossier
              </Text>
              {parentFolder && (
                <Text style={styles.headerSubtitle}>Dans : {parentFolder.name}</Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color="#64748b" size={24} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>
            <View style={styles.inputSection}>
              <Input
                label="Nom du dossier"
                placeholder="Ex: Rapports 2025"
                value={folderName}
                onChangeText={setFolderName}
              />
            </View>

            <View style={styles.permissionsSection}>
              <Text style={styles.sectionTitle}>
                Autorisations d'accès
              </Text>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <Text style={styles.legendIcon}>👁️</Text>
                  <Text style={styles.legendText}>Voir</Text>
                </View>
                <View style={styles.legendItem}>
                  <Text style={styles.legendIcon}>✏️</Text>
                  <Text style={styles.legendText}>Ajouter</Text>
                </View>
                <View style={styles.legendItem}>
                  <Text style={styles.legendIcon}>🔑</Text>
                  <Text style={styles.legendText}>Admin</Text>
                </View>
              </View>

              {loadingRoles ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#2563eb" />
                  <Text style={styles.loadingText}>Chargement des rôles...</Text>
                </View>
              ) : (
                <FlatList
                  data={roles}
                  renderItem={renderRolePermission}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                />
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button variant="secondary" onPress={onClose} className="flex-1">
              Annuler
            </Button>
            <Button
              variant="default"
              onPress={handleSubmit}
              disabled={!folderName.trim()}
              className="flex-1"
            >
              Créer
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 700,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#475569',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  permissionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendIcon: {
    fontSize: 16,
  },
  legendText: {
    fontSize: 12,
    color: '#475569',
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#475569',
  },
  permissionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  permissionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  permissionButtonUnselected: {
    backgroundColor: '#f1f5f9',
  },
  permissionIcon: {
    fontSize: 18,
  },
  checkBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
});
