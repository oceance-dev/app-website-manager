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
  StyleSheet,
} from 'react-native';
import { X, Upload, FileText } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Folder } from '../../types';
import { canUserAccessFolder } from '../../utils/permissions';
import { Button } from '../ui/button';
import { isMobile, getFontSize, getSpacing, getResponsivePadding, MIN_TOUCH_TARGET, getModalWidth, getModalHeight } from '../../utils/responsive';

interface AddDocumentModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (doc: {
    nameDoc: string;
    folderId: number;
    type: 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'OTHER';
    visibility: 'association' | 'personal';
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
  const [visibility, setVisibility] = useState<'association' | 'personal'>('association');

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
        visibility,
        uri: selectedFile.uri,
        mimeType: selectedFile.mimeType,
        size: selectedFile.size,
      });

      setSelectedFile(null);
      setSelectedFolderId(currentFolderId);
      setVisibility('association');
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setSelectedFolderId(currentFolderId);
    setVisibility('association');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Ajouter un document</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X color="#64748b" size={24} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.label}>Mode de partage</Text>
              <View style={styles.visibilityContainer}>
                <TouchableOpacity
                  style={[
                    styles.visibilityButton,
                    visibility === 'association' && styles.visibilityButtonSelected
                  ]}
                  onPress={() => setVisibility('association')}
                >
                  <Text
                    style={[
                      styles.visibilityButtonText,
                      visibility === 'association' && styles.visibilityButtonTextSelected
                    ]}
                  >
                    Association
                  </Text>
                  <Text
                    style={[
                      styles.visibilityDescription,
                      visibility === 'association' && styles.visibilityDescriptionSelected
                    ]}
                  >
                    Partagé avec l'association
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.visibilityButton,
                    visibility === 'personal' && styles.visibilityButtonSelected
                  ]}
                  onPress={() => setVisibility('personal')}
                >
                  <Text
                    style={[
                      styles.visibilityButtonText,
                      visibility === 'personal' && styles.visibilityButtonTextSelected
                    ]}
                  >
                    Personnel
                  </Text>
                  <Text
                    style={[
                      styles.visibilityDescription,
                      visibility === 'personal' && styles.visibilityDescriptionSelected
                    ]}
                  >
                    Visible uniquement par vous
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Sélectionner un fichier</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={pickDocument}
              >
                <Upload color="#2563eb" size={24} />
                <Text style={styles.uploadButtonText}>
                  {selectedFile ? 'Changer de fichier' : 'Choisir un fichier'}
                </Text>
              </TouchableOpacity>

              {selectedFile && (
                <View style={styles.selectedFileContainer}>
                  <FileText color="#3b82f6" size={32} />
                  <View style={styles.selectedFileInfo}>
                    <Text style={styles.selectedFileName}>
                      {selectedFile.name}
                    </Text>
                    <Text style={styles.selectedFileDetails}>
                      {formatFileSize(selectedFile.size)} • {getFileType(selectedFile.name, selectedFile.mimeType)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeFileButton}
                    onPress={() => setSelectedFile(null)}
                  >
                    <X color="#ef4444" size={20} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Dossier de destination</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.foldersRow}>
                  {accessibleFolders.map((folder) => (
                    <TouchableOpacity
                      key={folder.id}
                      style={[
                        styles.folderButton,
                        selectedFolderId === folder.id && styles.folderButtonSelected
                      ]}
                      onPress={() => setSelectedFolderId(folder.id)}
                    >
                      <Text
                        style={[
                          styles.folderButtonText,
                          selectedFolderId === folder.id && styles.folderButtonTextSelected
                        ]}
                      >
                        {folder.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              {accessibleFolders.length === 0 && (
                <Text style={styles.errorText}>
                  Aucun dossier accessible pour ajouter des documents
                </Text>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
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

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: isMobile ? 'flex-end' : 'center',
    alignItems: 'center',
    padding: isMobile ? 0 : 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: isMobile ? 16 : 16,
    borderBottomLeftRadius: isMobile ? 0 : 16,
    borderBottomRightRadius: isMobile ? 0 : 16,
    width: '100%',
    maxWidth: isMobile ? '100%' : 500,
    maxHeight: isMobile ? '90%' : '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getResponsivePadding(),
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: getFontSize(isMobile ? 18 : 20),
    fontWeight: 'bold',
    color: '#1e293b',
  },
  closeButton: {
    padding: 4,
    minWidth: isMobile ? MIN_TOUCH_TARGET : 'auto',
    minHeight: isMobile ? MIN_TOUCH_TARGET : 'auto',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: getResponsivePadding(),
  },
  section: {
    marginBottom: getSpacing(20),
  },
  label: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  visibilityContainer: {
    flexDirection: isMobile ? 'column' : 'row',
    gap: 12,
  },
  visibilityButton: {
    flex: 1,
    padding: getSpacing(16),
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    backgroundColor: 'white',
    alignItems: 'center',
    minHeight: isMobile ? MIN_TOUCH_TARGET + 20 : 'auto',
  },
  visibilityButtonSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  visibilityButtonText: {
    fontSize: getFontSize(16),
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  visibilityButtonTextSelected: {
    color: '#2563eb',
  },
  visibilityDescription: {
    fontSize: getFontSize(12),
    color: '#64748b',
    textAlign: 'center',
  },
  visibilityDescriptionSelected: {
    color: '#3b82f6',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#2563eb',
    borderRadius: 8,
    padding: getSpacing(24),
    backgroundColor: '#eff6ff',
    minHeight: isMobile ? MIN_TOUCH_TARGET + 20 : 'auto',
  },
  uploadButtonText: {
    fontSize: getFontSize(16),
    fontWeight: '600',
    color: '#2563eb',
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  selectedFileInfo: {
    flex: 1,
  },
  selectedFileName: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  selectedFileDetails: {
    fontSize: getFontSize(12),
    color: '#475569',
  },
  removeFileButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foldersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  folderButton: {
    paddingHorizontal: getSpacing(16),
    paddingVertical: isMobile ? 12 : 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: 'white',
    minHeight: isMobile ? MIN_TOUCH_TARGET : 'auto',
    justifyContent: 'center',
  },
  folderButtonSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  folderButtonText: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: '#475569',
  },
  folderButtonTextSelected: {
    color: 'white',
  },
  errorText: {
    fontSize: getFontSize(12),
    color: '#ef4444',
    marginTop: 8,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: isMobile ? 'column' : 'row',
    padding: getResponsivePadding(),
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
});
