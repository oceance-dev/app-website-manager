import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { X, AlertTriangle, Trash2, FileText } from 'lucide-react-native';
import { isMobile, getFontSize, getResponsivePadding, MIN_TOUCH_TARGET, getModalWidth } from '../../utils/responsive';
import { Button } from '../ui/button';

interface DeleteDocumentModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  documentName: string;
  documentType: string;
  documentSize: string;
  isDeleting: boolean;
}

export default function DeleteDocumentModal({
  visible,
  onClose,
  onConfirm,
  documentName,
  documentType,
  documentSize,
  isDeleting,
}: DeleteDocumentModalProps) {
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      PDF: '#ef4444',
      DOCX: '#3b82f6',
      XLSX: '#10b981',
      PPTX: '#f59e0b',
    };
    return colors[type] || '#64748b';
  };

  const typeColor = getTypeColor(documentType);

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

            <View style={styles.documentInfo}>
              <View style={styles.documentIconContainer}>
                <FileText color="#fff" size={32} />
              </View>
              <View style={styles.documentDetails}>
                <Text style={styles.documentName} numberOfLines={2}>
                  {documentName}
                </Text>
                <View style={styles.documentMeta}>
                  <View style={[styles.typeBadge, { backgroundColor: `${typeColor}20` }]}>
                    <Text style={[styles.typeText, { color: typeColor }]}>
                      {documentType}
                    </Text>
                  </View>
                  <Text style={styles.sizeText}>{documentSize}</Text>
                </View>
              </View>
            </View>

            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Ce document sera définitivement supprimé.
              </Text>
              <Text style={styles.warningSubtext}>
                Cette action est irréversible.
              </Text>
            </View>

            <Text style={styles.confirmQuestion}>
              Voulez-vous vraiment continuer ?
            </Text>
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
                  <Text style={styles.deleteButtonText}>Supprimer</Text>
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
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 16,
  },
  documentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentDetails: {
    flex: 1,
    gap: 8,
  },
  documentName: {
    fontSize: getFontSize(16),
    fontWeight: '600',
    color: '#1e293b',
    lineHeight: 22,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: getFontSize(12),
    fontWeight: '600',
  },
  sizeText: {
    fontSize: getFontSize(12),
    color: '#64748b',
  },
  warningBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginBottom: 16,
  },
  warningText: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: '#dc2626',
    textAlign: 'center',
    lineHeight: 20,
  },
  warningSubtext: {
    fontSize: getFontSize(12),
    color: '#991b1b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  confirmQuestion: {
    fontSize: getFontSize(15),
    color: '#475569',
    textAlign: 'center',
    fontWeight: '500',
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
