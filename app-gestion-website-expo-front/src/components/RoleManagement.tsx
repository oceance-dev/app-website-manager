import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  FlatList,
} from 'react-native';
import { Shield, Plus, Edit2, Trash2, X, Save } from 'lucide-react-native';
import { StaffAppApi, RolesApi, Role, Permission } from '../api';
import { isWeb } from '../utils/responsive';

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [level, setLevel] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesResponse, permissionsResponse] = await Promise.all([
        RolesApi.getAll(),
        RolesApi.getAllPermissions(),
      ]);

      if (rolesResponse.success && rolesResponse.data) {
        setRoles(rolesResponse.data.roles);
      }

      if (permissionsResponse.success && permissionsResponse.data) {
        setPermissions(permissionsResponse.data.permissions);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = () => {
    setModalMode('create');
    setSelectedRole(null);
    setName('');
    setDisplayName('');
    setLevel('');
    setDescription('');
    setShowModal(true);
  };

  const handleEditRole = (role: Role) => {
    setModalMode('edit');
    setSelectedRole(role);
    setName(role.name);
    setDisplayName(role.displayName);
    setLevel(role.level.toString());
    setDescription(role.description || '');
    setShowModal(true);
  };

  const handleSaveRole = async () => {
    if (!name.trim() || !displayName.trim() || !level.trim()) {
      if (isWeb) {
        alert('Veuillez remplir tous les champs obligatoires');
      } else {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      }
      return;
    }

    const levelNum = parseInt(level);
    if (isNaN(levelNum) || levelNum < 0 || levelNum > 100) {
      if (isWeb) {
        alert('Le niveau doit être un nombre entre 0 et 100');
      } else {
        Alert.alert('Erreur', 'Le niveau doit être un nombre entre 0 et 100');
      }
      return;
    }

    try {
      setSaving(true);

      if (modalMode === 'create') {
        const response = await StaffAppApi.createRole({
          name: name.trim(),
          displayName: displayName.trim(),
          level: levelNum,
          description: description.trim(),
        });

        if (response.success) {
          await loadData();
          setShowModal(false);
          if (isWeb) {
            alert('Rôle créé avec succès');
          } else {
            Alert.alert('Succès', 'Rôle créé avec succès');
          }
        }
      } else if (selectedRole) {
        const response = await StaffAppApi.updateRole(selectedRole.id, {
          name: name.trim(),
          displayName: displayName.trim(),
          level: levelNum,
          description: description.trim(),
        });

        if (response.success) {
          await loadData();
          setShowModal(false);
          if (isWeb) {
            alert('Rôle mis à jour avec succès');
          } else {
            Alert.alert('Succès', 'Rôle mis à jour avec succès');
          }
        }
      }
    } catch (error: any) {
      console.error('Error saving role:', error);
      if (isWeb) {
        alert(error.message || 'Erreur lors de la sauvegarde du rôle');
      } else {
        Alert.alert('Erreur', error.message || 'Impossible de sauvegarder le rôle');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer le rôle "${role.displayName}" ? Cette action est irréversible.`;

    const confirmAction = isWeb
      ? confirm(confirmMessage)
      : await new Promise((resolve) => {
          Alert.alert(
            'Confirmer la suppression',
            confirmMessage,
            [
              { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Supprimer', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmAction) return;

    try {
      const response = await StaffAppApi.deleteRole(role.id);

      if (response.success) {
        await loadData();
        if (isWeb) {
          alert('Rôle supprimé avec succès');
        } else {
          Alert.alert('Succès', 'Rôle supprimé avec succès');
        }
      }
    } catch (error: any) {
      console.error('Error deleting role:', error);
      if (isWeb) {
        alert(error.message || 'Erreur lors de la suppression du rôle');
      } else {
        Alert.alert('Erreur', error.message || 'Impossible de supprimer le rôle');
      }
    }
  };

  const renderRoleItem = ({ item }: { item: Role }) => (
    <View style={styles.roleCard}>
      <View style={styles.roleHeader}>
        <View style={styles.roleIconContainer}>
          <Shield color="#3b82f6" size={24} />
        </View>
        <View style={styles.roleInfo}>
          <Text style={styles.roleName}>{item.displayName}</Text>
          <Text style={styles.roleCode}>{item.name}</Text>
          <Text style={styles.roleLevel}>Niveau: {item.level}</Text>
        </View>
        <View style={styles.roleActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditRole(item)}
          >
            <Edit2 color="#3b82f6" size={18} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteRole(item)}
          >
            <Trash2 color="#ef4444" size={18} />
          </TouchableOpacity>
        </View>
      </View>
      {item.description && (
        <Text style={styles.roleDescription}>{item.description}</Text>
      )}
      <View style={styles.roleMeta}>
        <Text style={styles.roleMetaText}>
          Créé le {new Date(item.createdAt).toLocaleDateString('fr-FR')}
        </Text>
        <View style={[styles.statusBadge, item.isActive ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={styles.statusText}>{item.isActive ? 'Actif' : 'Inactif'}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Chargement des rôles...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestion des rôles</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateRole}>
          <Plus color="#fff" size={20} />
          <Text style={styles.createButtonText}>Nouveau rôle</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={roles}
        renderItem={renderRoleItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Shield color="#cbd5e1" size={48} />
            <Text style={styles.emptyText}>Aucun rôle disponible</Text>
          </View>
        }
      />

      {/* Modal Create/Edit Role */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalMode === 'create' ? 'Créer un rôle' : 'Modifier le rôle'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nom technique *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="ex: admin, member, trainer"
                  editable={!saving}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nom d'affichage *</Text>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="ex: Administrateur, Membre, Formateur"
                  editable={!saving}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Niveau (0-100) *</Text>
                <TextInput
                  style={styles.input}
                  value={level}
                  onChangeText={setLevel}
                  placeholder="ex: 50"
                  keyboardType="number-pad"
                  editable={!saving}
                />
                <Text style={styles.inputHint}>
                  Plus le niveau est élevé, plus les permissions sont importantes
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Description du rôle..."
                  multiline
                  numberOfLines={4}
                  editable={!saving}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowModal(false)}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveRole}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Save color="#fff" size={18} />
                      <Text style={styles.saveButtonText}>Enregistrer</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  listContent: {
    padding: 16,
  },
  roleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  roleCode: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  roleLevel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  roleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 20,
  },
  roleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  roleMetaText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#dcfce7',
  },
  inactiveBadge: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
