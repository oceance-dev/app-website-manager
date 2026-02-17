import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, Folder as FolderIcon, FolderDown, Grid3x3, List } from 'lucide-react-native';
import { colors, textStyles, spacing, borderRadius } from '@/src/theme';
import { Folder, ViewMode } from '../types';
import { isMobile, getFontSize, getResponsivePadding, MIN_TOUCH_TARGET } from '@/src/utils/responsive';

interface DocumentsHeaderProps {
  currentFolder: Folder | undefined;
  documentsCount: number;
  totalDocumentsCount: number;
  userRoleDisplayName?: string;
  viewMode: ViewMode;
  isAdminMember: boolean;
  onViewModeChange: (mode: ViewMode) => void;
  onNavigateToRoot: () => void;
  onCreateFolder: () => void;
  onAddDocument: () => void;
  onDownloadAll: () => void;
}

export const DocumentsHeader = ({
  currentFolder,
  documentsCount,
  totalDocumentsCount,
  userRoleDisplayName,
  viewMode,
  isAdminMember,
  onViewModeChange,
  onNavigateToRoot,
  onCreateFolder,
  onAddDocument,
  onDownloadAll,
}: DocumentsHeaderProps) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.headerTitleSection}>
          <Text style={styles.title}>Gestion des Documents</Text>

          <View style={styles.breadcrumb}>
            <TouchableOpacity onPress={onNavigateToRoot}>
              <Text style={[styles.breadcrumbItem, !currentFolder && styles.breadcrumbActive]}>
                📁 Racine
              </Text>
            </TouchableOpacity>
            {currentFolder && (
              <>
                <Text style={styles.breadcrumbSeparator}>/</Text>
                <Text style={[styles.breadcrumbItem, styles.breadcrumbActive]}>
                  {currentFolder.name}
                </Text>
              </>
            )}
          </View>

          <Text style={styles.subtitle}>
            {documentsCount} document{documentsCount !== 1 ? 's' : ''}
            {userRoleDisplayName && ` • ${userRoleDisplayName}`}
          </Text>
        </View>
      </View>

      <View style={styles.headerActions}>
        <View style={styles.viewModeToggle}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
            onPress={() => onViewModeChange('list')}
          >
            <List color={viewMode === 'list' ? colors.white : colors.navy} size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'grid' && styles.viewModeButtonActive]}
            onPress={() => onViewModeChange('grid')}
          >
            <Grid3x3 color={viewMode === 'grid' ? colors.white : colors.navy} size={20} />
          </TouchableOpacity>
        </View>

        {totalDocumentsCount > 0 && isAdminMember && (
          <TouchableOpacity
            style={[styles.addButton, styles.downloadAllButton]}
            onPress={onDownloadAll}
          >
            <FolderDown color={colors.navy} size={20} />
            <Text style={[styles.addButtonText, styles.downloadAllButtonText]}>
              Télécharger tout ({totalDocumentsCount})
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.createFolderButton}
          onPress={onCreateFolder}
        >
          <FolderIcon color={colors.navy} size={20} />
          <Text style={styles.createFolderButtonText}>Nouveau dossier</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddDocument}
        >
          <Plus color={colors.white} size={20} />
          <Text style={styles.addButtonText}>Ajouter un document</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'stretch' : 'center',
    padding: getResponsivePadding(),
    paddingBottom: spacing[4],
    gap: isMobile ? spacing[3] : 0,
    backgroundColor: colors.white,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  headerTitleSection: {
    flex: 1,
  },
  title: {
    fontSize: getFontSize(20),
    fontWeight: '400',
    color: '#202124',
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: getFontSize(13),
    color: '#5f6368',
    fontWeight: '400',
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[1],
    marginBottom: spacing[1],
  },
  breadcrumbItem: {
    fontSize: getFontSize(14),
    color: colors.gray[600],
    fontWeight: '500',
  },
  breadcrumbActive: {
    color: colors.navy,
    fontWeight: '700',
  },
  breadcrumbSeparator: {
    fontSize: getFontSize(14),
    color: colors.gray[400],
    marginHorizontal: spacing[2],
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: isMobile ? 'column' : 'row',
    gap: spacing[2],
    width: isMobile ? '100%' : 'auto',
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    padding: spacing[1],
    gap: spacing[1],
  },
  viewModeButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: isMobile ? MIN_TOUCH_TARGET : 44,
    minHeight: isMobile ? MIN_TOUCH_TARGET : 36,
  },
  viewModeButtonActive: {
    backgroundColor: colors.navy,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
    paddingHorizontal: spacing[4],
    paddingVertical: isMobile ? 14 : spacing[2],
    borderRadius: borderRadius.md,
    gap: spacing[2],
    minHeight: isMobile ? MIN_TOUCH_TARGET : 'auto',
  },
  addButtonText: {
    color: colors.white,
    ...textStyles.label,
    fontWeight: '600',
  },
  createFolderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navyLight + '20',
    paddingHorizontal: spacing[4],
    paddingVertical: isMobile ? 14 : spacing[2],
    borderRadius: borderRadius.md,
    gap: spacing[2],
    borderWidth: 2,
    borderColor: colors.navy,
    minHeight: isMobile ? MIN_TOUCH_TARGET : 'auto',
  },
  createFolderButtonText: {
    color: colors.navy,
    ...textStyles.label,
    fontWeight: '600',
  },
  downloadAllButton: {
    backgroundColor: colors.navyLight + '20',
    borderWidth: 2,
    borderColor: colors.navy + '40',
  },
  downloadAllButtonText: {
    color: colors.navy,
  },
});
