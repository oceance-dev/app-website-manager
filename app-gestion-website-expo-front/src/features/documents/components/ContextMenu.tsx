import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Eye, Download, Trash2, Lock, Folder as FolderIcon } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '@/src/theme';
import { ContextMenuType } from '../types';
import { isMobile, getFontSize, MIN_TOUCH_TARGET } from '@/src/utils/responsive';

interface ContextMenuProps {
  visible: boolean;
  type: ContextMenuType;
  canManagePermissions: boolean;
  showPermissionsOption: boolean;
  onClose: () => void;
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onManagePermissions?: () => void;
  onOpenFolder?: () => void;
}

export const ContextMenu = ({
  visible,
  type,
  canManagePermissions,
  showPermissionsOption,
  onClose,
  onView,
  onDownload,
  onDelete,
  onManagePermissions,
  onOpenFolder,
}: ContextMenuProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container}>
          {type === 'document' ? (
            <>
              <TouchableOpacity style={styles.item} onPress={onView}>
                <Eye color={colors.gray[700]} size={20} />
                <Text style={styles.itemText}>Ouvrir</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.item} onPress={onDownload}>
                <Download color={colors.gray[700]} size={20} />
                <Text style={styles.itemText}>Télécharger</Text>
              </TouchableOpacity>
              {showPermissionsOption && canManagePermissions && onManagePermissions && (
                <TouchableOpacity style={styles.item} onPress={onManagePermissions}>
                  <Lock color={colors.gray[700]} size={20} />
                  <Text style={styles.itemText}>Gérer les permissions</Text>
                </TouchableOpacity>
              )}
              <View style={styles.divider} />
              <TouchableOpacity style={styles.item} onPress={onDelete}>
                <Trash2 color={colors.error} size={20} />
                <Text style={[styles.itemText, { color: colors.error }]}>Supprimer</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.item} onPress={onOpenFolder}>
                <FolderIcon color={colors.gray[700]} size={20} />
                <Text style={styles.itemText}>Ouvrir</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.item} onPress={onDelete}>
                <Trash2 color={colors.error} size={20} />
                <Text style={[styles.itemText, { color: colors.error }]}>Supprimer</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    gap: spacing[3],
    minHeight: isMobile ? MIN_TOUCH_TARGET : 48,
    backgroundColor: colors.white,
  },
  itemText: {
    fontSize: getFontSize(14),
    color: colors.gray[700],
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing[1],
  },
});
