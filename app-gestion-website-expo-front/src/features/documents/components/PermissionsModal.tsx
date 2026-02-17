import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Modal, TouchableOpacity, TextStyle } from 'react-native';
import { X } from 'lucide-react-native';
import { colors, textStyles, spacing, shadows, borderRadius } from '@/src/theme';
import { Document, DocumentPermission } from '../types';
import { Button } from '@/src/components/ui/button';
import { isMobile, getResponsivePadding, MIN_TOUCH_TARGET } from '@/src/utils/responsive';

interface User {
  id: number;
  firstname: string;
  lastname: string;
  role: string;
}

interface PermissionsModalProps {
  visible: boolean;
  document: Document | null;
  cadets: User[];
  onClose: () => void;
  onSave: (documentId: number, permissions: DocumentPermission[]) => void;
}

export const PermissionsModal = ({
  visible,
  document,
  cadets,
  onClose,
  onSave,
}: PermissionsModalProps) => {
  const [tempPermissions, setTempPermissions] = useState<DocumentPermission[]>([]);

  useEffect(() => {
    if (document) {
      setTempPermissions(document.permissions || []);
    }
  }, [document]);

  const hasAccess = (userId: number): boolean => {
    const permission = tempPermissions.find((p) => p.userId === userId);
    return permission ? permission.canAccess : false;
  };

  const handleTogglePermission = (userId: number) => {
    const existingPermission = tempPermissions.find((p) => p.userId === userId);

    if (existingPermission) {
      setTempPermissions(
        tempPermissions.map((p) =>
          p.userId === userId ? { ...p, canAccess: !p.canAccess } : p
        )
      );
    } else {
      setTempPermissions([...tempPermissions, { userId, canAccess: true }]);
    }
  };

  const handleSave = () => {
    if (document) {
      onSave(document.id, tempPermissions);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Gestion des permissions</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={colors.gray[600]} size={24} />
            </TouchableOpacity>
          </View>

          {document && (
            <View style={styles.documentSection}>
              <Text style={styles.documentLabel}>Document:</Text>
              <Text style={styles.documentName}>{document.nameDoc}</Text>
            </View>
          )}

          <ScrollView style={styles.cadetsList}>
            <Text style={styles.cadetsTitle}>Accès des cadets</Text>
            {cadets.map((cadet) => (
              <View key={cadet.id} style={styles.cadetItem}>
                <View style={styles.cadetInfo}>
                  <Text style={styles.cadetName}>
                    {cadet.firstname} {cadet.lastname}
                  </Text>
                  <Text style={styles.cadetRole}>{cadet.role}</Text>
                </View>
                <Switch
                  value={hasAccess(cadet.id)}
                  onValueChange={() => handleTogglePermission(cadet.id)}
                  trackColor={{ false: colors.gray[400], true: colors.navy }}
                  thumbColor={hasAccess(cadet.id) ? colors.navyLight : colors.gray[100]}
                />
              </View>
            ))}
            {cadets.length === 0 && (
              <Text style={styles.emptyText}>Aucun cadet disponible</Text>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              variant="secondary"
              onPress={onClose}
              style={styles.footerButton}
            >
              Annuler
            </Button>
            <Button
              variant="default"
              onPress={handleSave}
              style={styles.footerButton}
            >
              Enregistrer
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: isMobile ? 'flex-end' : 'center',
    alignItems: 'center',
    padding: isMobile ? 0 : spacing[5],
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: isMobile ? borderRadius.xl : borderRadius.xl,
    borderBottomLeftRadius: isMobile ? 0 : borderRadius.xl,
    borderBottomRightRadius: isMobile ? 0 : borderRadius.xl,
    width: '100%',
    maxWidth: isMobile ? '100%' : 500,
    maxHeight: isMobile ? '90%' : '80%',
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getResponsivePadding(),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...textStyles.h3,
    color: colors.navy,
  },
  closeButton: {
    padding: spacing[1],
    minWidth: isMobile ? MIN_TOUCH_TARGET : 'auto',
    minHeight: isMobile ? MIN_TOUCH_TARGET : 'auto',
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentSection: {
    padding: getResponsivePadding(),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  documentLabel: {
    ...textStyles.caption,
    fontWeight: '600',
    color: colors.gray[600],
    marginBottom: spacing[1],
  },
  documentName: {
    ...textStyles.h4,
    color: colors.navy,
  },
  cadetsList: {
    flex: 1,
    padding: getResponsivePadding(),
  },
  cadetsTitle: {
    ...textStyles.label,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: spacing[4],
  },
  cadetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: isMobile ? spacing[4] : spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    minHeight: isMobile ? MIN_TOUCH_TARGET : 'auto',
  },
  cadetInfo: {
    flex: 1,
  },
  cadetName: {
    ...textStyles.h4,
    color: colors.navy,
    marginBottom: spacing[1],
  },
  cadetRole: {
    ...textStyles.caption,
    color: colors.gray[600],
  } as TextStyle,
  emptyText: {
    ...textStyles.body,
    color: colors.gray[500],
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: spacing[5],
  } as TextStyle,
  footer: {
    flexDirection: isMobile ? 'column' : 'row',
    padding: getResponsivePadding(),
    gap: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerButton: {
    flex: 1,
  },
});
