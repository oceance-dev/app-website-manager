import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Folder as FolderIcon, Lock, MoreVertical } from 'lucide-react-native';
import { colors, shadows, spacing, borderRadius } from '@/src/theme';
import { Folder, ViewMode } from '../types';
import { getVisibilityIcon } from '../utils/fileUtils';
import { isMobile, getFontSize, MIN_TOUCH_TARGET } from '@/src/utils/responsive';

interface FolderCardProps {
  folder: Folder;
  viewMode: ViewMode;
  documentsCount: number;
  currentUserId: number;
  userRoleLevel?: number;
  onNavigate: (folderId: number) => void;
  onOpenContextMenu?: (id: number) => void;
}

export const FolderCard = ({
  folder,
  viewMode,
  documentsCount,
  currentUserId,
  userRoleLevel = 0,
  onNavigate,
  onOpenContextMenu,
}: FolderCardProps) => {
  const isRestricted = folder.visibility === 'private' && folder.createdBy !== currentUserId;
  const isStaffOnly = folder.visibility === 'staff' && userRoleLevel < 70;
  const isDisabled = isRestricted || isStaffOnly;
  const visibilityIconText = getVisibilityIcon(folder.visibility);

  if (viewMode === 'grid') {
    return (
      <TouchableOpacity
        style={[styles.cardGrid, isDisabled && styles.cardRestricted]}
        onPress={() => onNavigate(folder.id)}
        disabled={isDisabled}
      >
        <View style={styles.iconGrid}>
          <FolderIcon color="#F9AB00" size={48} fill="#F9AB00" />
          {isDisabled && (
            <View style={styles.restrictedBadge}>
              <Lock color={colors.error} size={16} />
            </View>
          )}
        </View>
        <View style={styles.infoGrid}>
          <View style={styles.header}>
            <Text
              style={[styles.nameGrid, isDisabled && styles.nameRestricted]}
              numberOfLines={2}
            >
              {folder.name}
            </Text>
            {visibilityIconText && (
              <Text style={styles.visibilityIcon}>{visibilityIconText}</Text>
            )}
          </View>
          <Text style={styles.meta}>
            {documentsCount} doc{documentsCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.cardList, isDisabled && styles.cardRestricted]}
      onPress={() => onNavigate(folder.id)}
      disabled={isDisabled}
    >
      <View style={styles.icon}>
        <FolderIcon color="#F9AB00" size={24} fill="#F9AB00" />
        {isDisabled && (
          <View style={styles.restrictedBadge}>
            <Lock color={colors.error} size={16} />
          </View>
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.header}>
          <Text style={[styles.name, isDisabled && styles.nameRestricted]}>
            {folder.name}
          </Text>
          {visibilityIconText && (
            <Text style={styles.visibilityIcon}>{visibilityIconText}</Text>
          )}
        </View>
        {folder.description && (
          <Text style={styles.description} numberOfLines={2}>
            {folder.description}
          </Text>
        )}
        <Text style={styles.meta}>
          {documentsCount} doc{documentsCount !== 1 ? 's' : ''}
        </Text>
      </View>
      {onOpenContextMenu && (
        <TouchableOpacity
          style={styles.menuButton}
          onPress={(e) => {
            e.stopPropagation();
            onOpenContextMenu(folder.id);
          }}
        >
          <MoreVertical color={colors.gray[600]} size={20} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardList: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.md,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[1],
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: isMobile ? MIN_TOUCH_TARGET : 48,
  },
  cardGrid: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    flexDirection: 'column',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    height: '100%',
  },
  cardRestricted: {
    opacity: 0.6,
    backgroundColor: colors.gray[50],
  },
  icon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
    position: 'relative',
  },
  iconGrid: {
    width: 48,
    height: 48,
    marginBottom: spacing[3],
    alignSelf: 'flex-start',
    position: 'relative',
  },
  restrictedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[1],
    ...shadows.sm,
  },
  info: {
    flex: 1,
  },
  infoGrid: {
    alignItems: 'center',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
    flexWrap: 'wrap',
  },
  name: {
    fontSize: getFontSize(14),
    fontWeight: '400',
    color: '#202124',
    lineHeight: 20,
  },
  nameGrid: {
    fontSize: getFontSize(14),
    lineHeight: 20,
    fontWeight: '400',
    color: '#202124',
  },
  nameRestricted: {
    color: colors.gray[500],
  },
  visibilityIcon: {
    fontSize: 14,
    marginLeft: spacing[1],
  },
  description: {
    fontSize: getFontSize(14),
    color: colors.gray[600],
    marginBottom: spacing[2],
    lineHeight: 20,
  },
  meta: {
    fontSize: getFontSize(12),
    color: '#5f6368',
    fontWeight: '400',
  },
  menuButton: {
    width: isMobile ? MIN_TOUCH_TARGET : 32,
    height: isMobile ? MIN_TOUCH_TARGET : 32,
    borderRadius: borderRadius.full,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
