import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Folder as FolderIcon } from 'lucide-react-native';
import { colors, textStyles, spacing } from '@/src/theme';
import { Document, Folder, ViewMode } from '../types';
import { DocumentCard } from './DocumentCard';
import { FolderCard } from './FolderCard';
import { isMobile, getFontSize } from '@/src/utils/responsive';

interface DocumentsListProps {
  documents: Document[];
  folders: Folder[];
  viewMode: ViewMode;
  loading: boolean;
  currentUserId: number;
  userRoleLevel?: number;
  getDocumentsCountByFolder: (folderId: number) => number;
  onViewDocument: (id: number) => void;
  onDownloadDocument: (id: number, name: string) => void;
  onDeleteDocument: (id: number) => void;
  onNavigateToFolder: (folderId: number) => void;
  onOpenDocumentContextMenu?: (id: number) => void;
  onOpenFolderContextMenu?: (id: number) => void;
}

export const DocumentsList = ({
  documents,
  folders,
  viewMode,
  loading,
  currentUserId,
  userRoleLevel,
  getDocumentsCountByFolder,
  onViewDocument,
  onDownloadDocument,
  onDeleteDocument,
  onNavigateToFolder,
  onOpenDocumentContextMenu,
  onOpenFolderContextMenu,
}: DocumentsListProps) => {
  if (loading) {
    return (
      <View style={styles.emptyState}>
        <ActivityIndicator size="large" color={colors.navy} />
        <Text style={styles.emptyStateText}>Chargement des documents...</Text>
      </View>
    );
  }

  const hasFolders = folders.length > 0;
  const hasDocuments = documents.length > 0;

  if (!hasFolders && !hasDocuments) {
    return (
      <View style={styles.emptyState}>
        <FolderIcon color={colors.gray[400]} size={64} />
        <Text style={styles.emptyStateText}>Aucun document ni dossier</Text>
      </View>
    );
  }

  return (
    <>
      {hasFolders && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dossiers</Text>
          <View style={viewMode === 'grid' ? styles.gridContainer : undefined}>
            {folders.map((folder) => (
              <View
                key={folder.id}
                style={viewMode === 'grid' ? styles.gridItem : undefined}
              >
                <FolderCard
                  folder={folder}
                  viewMode={viewMode}
                  documentsCount={getDocumentsCountByFolder(folder.id)}
                  currentUserId={currentUserId}
                  userRoleLevel={userRoleLevel}
                  onNavigate={onNavigateToFolder}
                  onOpenContextMenu={onOpenFolderContextMenu}
                />
              </View>
            ))}
          </View>
        </View>
      )}

      {hasDocuments && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents</Text>
          <View style={viewMode === 'grid' ? styles.gridContainer : undefined}>
            {documents.map((doc) => (
              <View
                key={doc.id}
                style={viewMode === 'grid' ? styles.gridItem : undefined}
              >
                <DocumentCard
                  document={doc}
                  viewMode={viewMode}
                  onView={onViewDocument}
                  onDownload={onDownloadDocument}
                  onDelete={onDeleteDocument}
                  onOpenContextMenu={onOpenDocumentContextMenu}
                />
              </View>
            ))}
          </View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: getFontSize(14),
    fontWeight: '500',
    color: '#5f6368',
    marginBottom: spacing[3],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing[2],
  },
  gridItem: {
    width: isMobile ? '50%' : '25%',
    paddingHorizontal: spacing[2],
    marginBottom: spacing[4],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[16],
  },
  emptyStateText: {
    ...textStyles.h4,
    color: colors.gray[500],
    marginTop: spacing[4],
    textAlign: 'center',
    paddingHorizontal: spacing[5],
  },
});
