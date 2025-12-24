/**
 * Modal pour ajouter un document en uploadant depuis l'appareil de l'utilisateur
 *
 * IMPORTANT: Ce composant nécessite l'installation de expo-document-picker
 * Installez-le avec : npx expo install expo-document-picker
 *
 * Voir INSTALL_DEPENDENCIES.md pour plus d'informations
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { X, Upload, FileText } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Folder } from '../../types';
import { canUserAccessFolder } from '../../utils/permissions';
import { Button } from '../ui/button';

interface AddDocumentModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (doc: {
    nameDoc: string;
    folderId: number;
    type: 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'OTHER';
    uri?: string;
    mimeType?: string;
    size?: number;
  }) => void;
  folders: Folder[];
  currentFolderId: number | null;
  currentUserId: number;
}

export default function AddDocumentModal({
  visible,
  onClose,
  onAdd,
  folders,
  currentFolderId,
  currentUserId,
}: AddDocumentModalProps) {
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(currentFolderId);

  // Mettre à jour le dossier sélectionné quand le currentFolderId change
  useEffect(() => {
    setSelectedFolderId(currentFolderId);
  }, [currentFolderId]);

  // Filtrer les dossiers où l'utilisateur peut ajouter des documents
  const accessibleFolders = folders.filter((folder) =>
    canUserAccessFolder(currentUserId, folder, 'add')
  );

  // Fonction pour sélectionner un fichier
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Accepter tous les types de fichiers
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier');
      console.error('Document picker error:', error);
    }
  };

  // Déterminer le type de fichier basé sur l'extension ou le MIME type
  const getFileType = (fileName: string, mimeType?: string): 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'OTHER' => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (extension === 'pdf' || mimeType === 'application/pdf') return 'PDF';
    if (extension === 'docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'DOCX';
    if (extension === 'xlsx' || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'XLSX';
    if (extension === 'pptx' || mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'PPTX';

    return 'OTHER';
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = () => {
    if (selectedFile && selectedFolderId) {
      const fileType = getFileType(selectedFile.name, selectedFile.mimeType);

      onAdd({
        nameDoc: selectedFile.name,
        folderId: selectedFolderId,
        type: fileType,
        uri: selectedFile.uri,
        mimeType: selectedFile.mimeType,
        size: selectedFile.size,
      });

      setSelectedFile(null);
      setSelectedFolderId(currentFolderId);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setSelectedFolderId(currentFolderId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-5">
        <View className="bg-white rounded-2xl w-full max-w-lg" style={{ maxHeight: '80%' }}>
          {/* Header */}
          <View className="flex-row justify-between items-center p-5 border-b border-slate-200">
            <Text className="text-xl font-bold text-slate-800">Ajouter un document</Text>
            <TouchableOpacity onPress={handleClose} className="p-1">
              <X color="#64748b" size={24} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView className="p-5">
            <View className="mb-5">
              <Text className="text-sm font-semibold text-slate-700 mb-2">Sélectionner un fichier</Text>
              <TouchableOpacity
                className="flex-row items-center justify-center gap-3 border-2 border-dashed border-primary rounded-lg p-6 bg-blue-50"
                onPress={pickDocument}
              >
                <Upload color="#2563eb" size={24} />
                <Text className="text-base font-semibold text-primary">
                  {selectedFile ? 'Changer de fichier' : 'Choisir un fichier'}
                </Text>
              </TouchableOpacity>

              {selectedFile && (
                <View className="flex-row items-center gap-3 mt-4 p-3 bg-slate-100 rounded-lg">
                  <FileText color="#3b82f6" size={32} />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-slate-800 mb-1">
                      {selectedFile.name}
                    </Text>
                    <Text className="text-xs text-slate-600">
                      {formatFileSize(selectedFile.size)} • {getFileType(selectedFile.name, selectedFile.mimeType)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    className="w-8 h-8 rounded-lg bg-red-100 items-center justify-center"
                    onPress={() => setSelectedFile(null)}
                  >
                    <X color="#ef4444" size={20} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View className="mb-5">
              <Text className="text-sm font-semibold text-slate-700 mb-2">Dossier de destination</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2 py-1">
                  {accessibleFolders.map((folder) => (
                    <TouchableOpacity
                      key={folder.id}
                      className={`px-4 py-2.5 rounded-lg border ${
                        selectedFolderId === folder.id
                          ? 'bg-green-500 border-green-500'
                          : 'bg-white border-slate-300'
                      }`}
                      onPress={() => setSelectedFolderId(folder.id)}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          selectedFolderId === folder.id
                            ? 'text-white'
                            : 'text-slate-600'
                        }`}
                      >
                        {folder.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              {accessibleFolders.length === 0 && (
                <Text className="text-xs text-red-500 mt-2 italic">
                  Aucun dossier accessible pour ajouter des documents
                </Text>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="flex-row p-5 gap-3 border-t border-slate-200">
            <Button
              variant="secondary"
              onPress={handleClose}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              variant="default"
              onPress={handleSubmit}
              disabled={!selectedFile || !selectedFolderId}
              className="flex-1"
            >
              Ajouter
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
