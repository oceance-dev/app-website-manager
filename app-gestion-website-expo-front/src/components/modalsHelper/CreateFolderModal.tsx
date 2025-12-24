import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { Folder, User, FolderPermission } from '../../types';
import { getRoleDisplay } from '../../utils/permissions';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface CreateFolderModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (folder: Omit<Folder, 'id' | 'createdAt'>) => void;
  users: User[];
  currentUserId: number;
  parentFolder?: Folder | null;
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
  const [selectedPermissions, setSelectedPermissions] = useState<FolderPermission[]>([
    { userId: currentUserId, role: 'admin' }, // L'utilisateur actuel est admin par défaut
  ]);

  const handleSubmit = () => {
    if (folderName.trim()) {
      onCreate({
        name: folderName,
        parentId: parentFolder?.id || null,
        createdBy: currentUserId,
        permissions: selectedPermissions,
      });
      setFolderName('');
      setSelectedPermissions([{ userId: currentUserId, role: 'admin' }]);
      onClose();
    }
  };

  const updateUserPermission = (userId: number, role: 'viewer' | 'editor' | 'admin' | null) => {
    if (role === null) {
      setSelectedPermissions(selectedPermissions.filter((p) => p.userId !== userId));
    } else {
      const existingIndex = selectedPermissions.findIndex((p) => p.userId === userId);
      if (existingIndex >= 0) {
        const updated = [...selectedPermissions];
        updated[existingIndex] = { userId, role };
        setSelectedPermissions(updated);
      } else {
        setSelectedPermissions([...selectedPermissions, { userId, role }]);
      }
    }
  };

  const getUserPermission = (userId: number): 'viewer' | 'editor' | 'admin' | null => {
    const permission = selectedPermissions.find((p) => p.userId === userId);
    return permission ? permission.role : null;
  };

  const renderUserPermission = ({ item }: { item: User }) => {
    const currentRole = getUserPermission(item.id);
    const isCurrentUser = item.id === currentUserId;

    return (
      <View className="flex-row justify-between items-center py-3 px-1 border-b border-slate-100">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-slate-800 mb-0.5">
            {item.firstname} {item.lastname}
          </Text>
          <Text className="text-xs text-slate-600">{item.role}</Text>
        </View>

        <View className="flex-row gap-2">
          {(['viewer', 'editor', 'admin'] as const).map((role) => {
            const isSelected = currentRole === role;
            const display = getRoleDisplay(role);

            return (
              <TouchableOpacity
                key={role}
                className={`w-10 h-10 rounded-lg items-center justify-center relative ${
                  isSelected ? '' : 'bg-slate-100'
                }`}
                style={isSelected ? { backgroundColor: display.color } : {}}
                onPress={() => updateUserPermission(item.id, isSelected ? null : role)}
                disabled={isCurrentUser && role === 'admin'} // Empêcher de se retirer en tant qu'admin
              >
                <Text className="text-lg">{display.icon}</Text>
                {isSelected && (
                  <View className="absolute top-0.5 right-0.5">
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
      <View className="flex-1 bg-black/50 justify-center items-center p-5">
        <View className="bg-white rounded-2xl w-full max-w-2xl" style={{ maxHeight: '90%' }}>
          {/* Header */}
          <View className="flex-row justify-between items-start p-5 border-b border-slate-200">
            <View>
              <Text className="text-xl font-bold text-slate-800 mb-1">
                Créer un nouveau dossier
              </Text>
              {parentFolder && (
                <Text className="text-sm text-slate-600">Dans : {parentFolder.name}</Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} className="p-1">
              <X color="#64748b" size={24} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView className="p-5">
            <View className="mb-6">
              <Input
                label="Nom du dossier"
                placeholder="Ex: Rapports 2025"
                value={folderName}
                onChangeText={setFolderName}
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-semibold text-slate-700 mb-2">
                Autorisations d'accès
              </Text>
              <View className="flex-row gap-4 mb-3 px-1">
                <View className="flex-row items-center gap-1">
                  <Text className="text-base">👁️</Text>
                  <Text className="text-xs text-slate-600">Voir</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="text-base">✏️</Text>
                  <Text className="text-xs text-slate-600">Ajouter</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="text-base">🔑</Text>
                  <Text className="text-xs text-slate-600">Admin</Text>
                </View>
              </View>

              <FlatList
                data={users}
                renderItem={renderUserPermission}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="flex-row p-5 gap-3 border-t border-slate-200">
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
