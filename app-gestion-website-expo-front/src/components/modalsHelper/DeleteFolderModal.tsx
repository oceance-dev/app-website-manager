import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { X, AlertTriangle, Trash2, Folder, FileText } from 'lucide-react-native';
import { isMobile, getFontSize, getResponsivePadding, MIN_TOUCH_TARGET, getModalWidth } from '../../utils/responsive';
import { Button } from '../ui/button';

interface DeleteFolderModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  folderName: string;
  documentsCount?: number;
  childrenCount?: number;
  isDeleting: boolean;
}

export default function DeleteFolderModal({
  visible,
  onClose,
  onConfirm,
  folderName,
  documentsCount = 0,
  childrenCount = 0,
  isDeleting,
}: DeleteFolderModalProps) {
  const hasContent = documentsCount > 0 || childrenCount > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <AlertTriangle color="#ef4444" size={24} />
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              disabled={isDeleting}
            >
              <X color="#64748b" size={24} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>Confirmer la suppression</Text>

            <View style={styles.folderInfo}>
              <View style={styles.folderIconContainer}>
                <Folder color="#3b82f6" size={32} />
              </View>
              <Text style={styles.folderName}>{folderName}</Text>
            </View>

            {hasContent ? (
              <View style={styles.warningContainer}>
                <Text style={styles.warningTitle}>⚠️ Attention !</Text>
                <Text style={styles.warningText}>
                  Ce dossier contient :
                </Text>

                <View style={styles.contentList}>
                  {documentsCount > 0 && (
                    <View style={styles.contentItem}>
                      <FileText color="#64748b" size={18} />
                      <Text style={styles.contentItemText}>
                        {documentsCount} document{documentsCount > 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}
                  {childrenCount > 0 && (
                    <View style={styles.contentItem}>
                      <Folder color="#64748b" size={18} />
                      <Text style={styles.contentItemText}>
                        {childrenCount} sous-dossier{childrenCount > 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.dangerBox}>
                  <Text style={styles.dangerText}>
                    🗑️ Tous ces éléments seront définitivement supprimés.
                  </Text>
                  <Text style={styles.dangerSubtext}>
                    Cette action est irréversible.
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.message}>
                Voulez-vous vraiment supprimer ce dossier ?
              </Text>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              variant="secondary"
              onPress={onClose}
              className="flex-1"
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onPress={onConfirm}
              className="flex-1"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.deletingText}>Suppression...</Text>
                </View>
              ) : (
                <View style={styles.deleteButtonContent}>
                  <Trash2 color="#fff" size={18} />
                  <Text style={styles.deleteButtonText}>
                    {hasContent ? 'Supprimer tout' : 'Supprimer'}
                  </Text>
                </View>
              )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isMobile ? 16 : 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: isMobile ? '100%' : getModalWidth(),
    maxWidth: isMobile ? '100%' : 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getResponsivePadding(),
    borderBottomWidth: 1,
    borderBottomColor: '#fee2e2',
    backgroundColor: '#fef2f2',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
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
  title: {
    fontSize: getFontSize(isMobile ? 20 : 22),
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  folderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 16,
  },
  folderIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderName: {
    flex: 1,
    fontSize: getFontSize(16),
    fontWeight: '600',
    color: '#1e293b',
  },
  message: {
    fontSize: getFontSize(15),
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
  },
  warningContainer: {
    gap: 12,
  },
  warningTitle: {
    fontSize: getFontSize(16),
    fontWeight: '700',
    color: '#dc2626',
    textAlign: 'center',
  },
  warningText: {
    fontSize: getFontSize(14),
    color: '#64748b',
    textAlign: 'center',
  },
  contentList: {
    gap: 8,
    paddingVertical: 8,
  },
  contentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  contentItemText: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: '#334155',
  },
  dangerBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  dangerText: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: '#dc2626',
    textAlign: 'center',
    lineHeight: 20,
  },
  dangerSubtext: {
    fontSize: getFontSize(12),
    color: '#991b1b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: isMobile ? 'column' : 'row',
    padding: getResponsivePadding(),
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deletingText: {
    color: '#fff',
    fontSize: getFontSize(14),
    fontWeight: '600',
  },
  deleteButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: getFontSize(14),
    fontWeight: '600',
  },
});
