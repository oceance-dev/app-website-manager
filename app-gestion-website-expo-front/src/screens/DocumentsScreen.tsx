import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Text } from 'react-native';
import { Document, DocumentPermission, User } from '../types';
import { initialUtilisateurs } from '../data/mockData';
import { colors, spacing, borderRadius } from '../theme';
import { canUserAccessFolder } from '../utils/permissions';
import { getResponsivePadding, isWeb } from '../utils/responsive';
import AddDocumentModal from '../components/modalsHelper/AddDocumentModal';
import CreateFolderModal from '../components/modalsHelper/CreateFolderModal';
import DocumentViewerModal from '../components/modalsHelper/DocumentViewerModal';
import DeleteFolderModal from '../components/modalsHelper/DeleteFolderModal';
import DeleteDocumentModal from '../components/modalsHelper/DeleteDocumentModal';
import Toast, { ToastType } from '../components/ui/Toast';
import { AssociationsApi } from '../api';
import {
  DocumentsHeader,
  DocumentsList,
  ContextMenu,
  PermissionsModal,
  useDocuments,
  useFolders,
  useDocumentViewer,
  useCurrentUser,
  ViewMode,
  ContextMenuType,
  DocumentToDelete,
  FolderToDelete,
} from '../features/documents';

export default function DocumentsScreen() {
  // Custom hooks
  const {
    currentUser,
    loading: loadingUser,
    canManagePermissions,
    isAdminMember,
  } = useCurrentUser(() => showErrorToast('Votre session a expiré. Veuillez vous reconnecter.'));

  const currentUserId = currentUser?.id || 1;

  const {
    documents,
    loading: loadingDocuments,
    uploading,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    getDocumentsByFolder,
  } = useDocuments();

  const {
    folders,
    createFolder,
    deleteFolder,
    getFoldersByParent,
    getFolderById,
    fetchFolders,
  } = useFolders(currentUserId, currentUser?.associationId || null);

  const {
    viewerState,
    viewDocument,
    closeViewer,
  } = useDocumentViewer();

  // Local state
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [associationMembers, setAssociationMembers] = useState<User[]>([]);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
  const [showDeleteDocumentModal, setShowDeleteDocumentModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  // Context menu state
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuType, setContextMenuType] = useState<ContextMenuType>('document');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  // Delete states
  const [folderToDelete, setFolderToDelete] = useState<FolderToDelete | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentToDelete | null>(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  const [isDeletingDocument, setIsDeletingDocument] = useState(false);

  // Permissions state
  const [selectedDocumentForPermissions, setSelectedDocumentForPermissions] = useState<Document | null>(null);

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  // Computed values
  const currentFolder = getFolderById(currentFolderId);
  const currentDocuments = getDocumentsByFolder(currentFolderId);
  const currentSubFolders = getFoldersByParent(currentFolderId);
  const cadets = initialUtilisateurs.filter((user) =>
    user.role === 'Cadet' || user.role === 'Ancien Cadet'
  );

  // Toast helpers
  const showSuccessToast = (message: string) => {
    setToastMessage(message);
    setToastType('success');
    setShowToast(true);
  };

  const showErrorToast = (message: string) => {
    setToastMessage(message);
    setToastType('error');
    setShowToast(true);
  };

  // Load association members
  React.useEffect(() => {
    const fetchAssociationMembers = async () => {
      try {
        const response = await AssociationsApi.getMembers({ limit: 100 });
        if (response.success && response.data) {
          const mappedMembers: User[] = response.data.members.map((member: any) => ({
            id: member.id,
            firstname: member.firstname,
            lastname: member.lastname,
            email: member.email,
            role: member.role?.name || 'membre',
          }));
          setAssociationMembers(mappedMembers);
        }
      } catch (error) {
        console.error('Error loading association members:', error);
        setAssociationMembers(initialUtilisateurs);
      }
    };
    fetchAssociationMembers();
  }, []);

  // Navigation handlers
  const navigateToFolder = useCallback((folderId: number) => {
    const folder = getFolderById(folderId);
    if (folder && canUserAccessFolder(currentUserId, folder, 'view')) {
      setCurrentFolderId(folderId);
    }
  }, [getFolderById, currentUserId]);

  const navigateToRoot = useCallback(() => {
    setCurrentFolderId(null);
  }, []);

  // Document handlers
  const handleViewDocument = useCallback(async (id: number) => {
    try {
      await viewDocument(id);
    } catch (error: any) {
      showErrorToast(error?.message || 'Impossible d\'ouvrir le document');
    }
  }, [viewDocument]);

  const handleDownloadDocument = useCallback((id: number, name: string) => {
    downloadDocument(id, name).catch((error) => {
      showErrorToast('Erreur lors du téléchargement');
    });
  }, [downloadDocument]);

  const handleOpenDeleteDocumentModal = useCallback((id: number) => {
    const document = documents.find((doc) => doc.id === id);
    if (!document) return;

    setDocumentToDelete({
      id,
      name: document.nameDoc,
      type: document.type,
      size: document.length,
    });
    setShowDeleteDocumentModal(true);
  }, [documents]);

  const handleConfirmDeleteDocument = useCallback(async () => {
    if (!documentToDelete) return;

    setIsDeletingDocument(true);
    try {
      const success = await deleteDocument(documentToDelete.id);
      if (success) {
        showSuccessToast(`Document "${documentToDelete.name}" supprimé avec succès`);
      }
    } catch (error: any) {
      showErrorToast(error?.message || 'Erreur lors de la suppression du document');
    } finally {
      setIsDeletingDocument(false);
      setShowDeleteDocumentModal(false);
      setDocumentToDelete(null);
    }
  }, [documentToDelete, deleteDocument]);

  // Folder handlers
  const handleCreateFolder = useCallback(async (newFolder: any) => {
    try {
      const success = await createFolder(newFolder);
      if (success) {
        showSuccessToast(`Dossier "${newFolder.name}" créé avec succès`);
      }
    } catch (error: any) {
      showErrorToast(error?.message || 'Erreur lors de la création du dossier');
    }
  }, [createFolder]);

  const handleOpenDeleteFolderModal = useCallback((id: number) => {
    const folder = getFolderById(id);
    if (!folder) return;

    const documentsCount = getDocumentsByFolder(id).length;
    const childrenCount = getFoldersByParent(id).length;

    setFolderToDelete({
      id,
      name: folder.name,
      documentsCount,
      childrenCount,
    });
    setShowDeleteFolderModal(true);
  }, [getFolderById, getDocumentsByFolder, getFoldersByParent]);

  const handleConfirmDeleteFolder = useCallback(async () => {
    if (!folderToDelete) return;

    setIsDeletingFolder(true);
    try {
      const hasContent = folderToDelete.documentsCount > 0 || folderToDelete.childrenCount > 0;
      const success = await deleteFolder(folderToDelete.id, hasContent);
      if (success) {
        showSuccessToast(`Dossier "${folderToDelete.name}" supprimé avec succès`);
      }
    } catch (error: any) {
      showErrorToast(error?.message || 'Erreur lors de la suppression du dossier');
    } finally {
      setIsDeletingFolder(false);
      setShowDeleteFolderModal(false);
      setFolderToDelete(null);
    }
  }, [folderToDelete, deleteFolder]);

  // Add document handler
  const handleAddDocument = useCallback(async (newDoc: any) => {
    try {
      const success = await uploadDocument(newDoc);
      if (success) {
        showSuccessToast(`Document "${newDoc.nameDoc}" ajouté avec succès`);
      }
    } catch (error: any) {
      showErrorToast(error?.message || 'Erreur lors de l\'ajout du document');
    }
  }, [uploadDocument]);

  // Context menu handlers
  const handleOpenContextMenu = useCallback((id: number, type: ContextMenuType) => {
    setSelectedItemId(id);
    setContextMenuType(type);
    setShowContextMenu(true);
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setShowContextMenu(false);
    setSelectedItemId(null);
  }, []);

  const handleContextMenuAction = useCallback((action: string) => {
    if (!selectedItemId) return;
    handleCloseContextMenu();

    if (contextMenuType === 'document') {
      const document = documents.find(d => d.id === selectedItemId);
      if (!document) return;

      switch (action) {
        case 'view':
          handleViewDocument(selectedItemId);
          break;
        case 'download':
          handleDownloadDocument(selectedItemId, document.nameDoc);
          break;
        case 'delete':
          handleOpenDeleteDocumentModal(selectedItemId);
          break;
        case 'permissions':
          setSelectedDocumentForPermissions(document);
          setShowPermissionsModal(true);
          break;
      }
    } else {
      switch (action) {
        case 'open':
          navigateToFolder(selectedItemId);
          break;
        case 'delete':
          handleOpenDeleteFolderModal(selectedItemId);
          break;
      }
    }
  }, [
    selectedItemId,
    contextMenuType,
    documents,
    handleViewDocument,
    handleDownloadDocument,
    handleOpenDeleteDocumentModal,
    navigateToFolder,
    handleOpenDeleteFolderModal,
    handleCloseContextMenu,
  ]);

  // Permissions handler
  const handleSavePermissions = useCallback((documentId: number, permissions: DocumentPermission[]) => {
    // Update document permissions in local state
    console.log('Permissions updated for document:', documentId, permissions);
    setShowPermissionsModal(false);
    setSelectedDocumentForPermissions(null);
  }, []);

  // Download all handler
  const handleDownloadAllDocuments = useCallback(() => {
    if (documents.length === 0) {
      if (isWeb) {
        alert('Aucun document à télécharger');
      } else {
        Alert.alert('Information', 'Aucun document à télécharger');
      }
      return;
    }

    const message = `Téléchargement de ${documents.length} document(s) de l'association...\n\nCette fonctionnalité sera bientôt disponible.`;
    if (isWeb) {
      alert(message);
    } else {
      Alert.alert('Téléchargement', message);
    }
  }, [documents.length]);

  // Loading state
  if (loadingUser) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.navy} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <DocumentsHeader
            currentFolder={currentFolder}
            documentsCount={currentDocuments.length}
            totalDocumentsCount={documents.length}
            userRoleDisplayName={currentUser?.role.displayName}
            viewMode={viewMode}
            isAdminMember={isAdminMember || false}
            onViewModeChange={setViewMode}
            onNavigateToRoot={navigateToRoot}
            onCreateFolder={() => setShowCreateFolderModal(true)}
            onAddDocument={() => setShowAddModal(true)}
            onDownloadAll={handleDownloadAllDocuments}
          />

          <View style={styles.listContent}>
            <DocumentsList
              documents={currentDocuments}
              folders={currentSubFolders}
              viewMode={viewMode}
              loading={loadingDocuments}
              currentUserId={currentUserId}
              userRoleLevel={currentUser?.role.level}
              getDocumentsCountByFolder={(folderId) => getDocumentsByFolder(folderId).length}
              onViewDocument={handleViewDocument}
              onDownloadDocument={handleDownloadDocument}
              onDeleteDocument={handleOpenDeleteDocumentModal}
              onNavigateToFolder={navigateToFolder}
              onOpenDocumentContextMenu={(id) => handleOpenContextMenu(id, 'document')}
              onOpenFolderContextMenu={(id) => handleOpenContextMenu(id, 'folder')}
            />
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <AddDocumentModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddDocument}
        folders={folders}
        currentFolderId={currentFolderId}
        currentUserId={currentUserId}
      />

      <CreateFolderModal
        visible={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        onCreate={handleCreateFolder}
        users={associationMembers.length > 0 ? associationMembers : initialUtilisateurs}
        currentUserId={currentUserId}
        parentFolder={currentFolder}
      />

      <DocumentViewerModal
        visible={viewerState.visible}
        onClose={closeViewer}
        documentUrl={viewerState.url}
        documentName={viewerState.name}
        mimeType={viewerState.mimeType}
      />

      <DeleteFolderModal
        visible={showDeleteFolderModal}
        onClose={() => {
          setShowDeleteFolderModal(false);
          setFolderToDelete(null);
        }}
        onConfirm={handleConfirmDeleteFolder}
        folderName={folderToDelete?.name || ''}
        documentsCount={folderToDelete?.documentsCount || 0}
        childrenCount={folderToDelete?.childrenCount || 0}
        isDeleting={isDeletingFolder}
      />

      <DeleteDocumentModal
        visible={showDeleteDocumentModal}
        onClose={() => {
          setShowDeleteDocumentModal(false);
          setDocumentToDelete(null);
        }}
        onConfirm={handleConfirmDeleteDocument}
        documentName={documentToDelete?.name || ''}
        documentType={documentToDelete?.type || 'PDF'}
        documentSize={documentToDelete?.size || ''}
        isDeleting={isDeletingDocument}
      />

      <ContextMenu
        visible={showContextMenu}
        type={contextMenuType}
        canManagePermissions={canManagePermissions || false}
        showPermissionsOption={selectedItemId !== null && selectedItemId >= 100}
        onClose={handleCloseContextMenu}
        onView={() => handleContextMenuAction('view')}
        onDownload={() => handleContextMenuAction('download')}
        onDelete={() => handleContextMenuAction('delete')}
        onManagePermissions={() => handleContextMenuAction('permissions')}
        onOpenFolder={() => handleContextMenuAction('open')}
      />

      <PermissionsModal
        visible={showPermissionsModal}
        document={selectedDocumentForPermissions}
        cadets={cadets}
        onClose={() => {
          setShowPermissionsModal(false);
          setSelectedDocumentForPermissions(null);
        }}
        onSave={handleSavePermissions}
      />

      {/* Loading overlay for upload */}
      <Modal visible={uploading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.navy} />
            <Text style={styles.uploadingText}>Upload du document en cours...</Text>
          </View>
        </View>
      </Modal>

      {/* Toast */}
      <Toast
        visible={showToast}
        message={toastMessage}
        type={toastType}
        onHide={() => setShowToast(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: getResponsivePadding(),
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  listContent: {
    padding: getResponsivePadding(),
  },
  loadingText: {
    marginTop: spacing[4],
    color: colors.gray[600],
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[8],
    alignItems: 'center',
    gap: spacing[4],
    minWidth: 200,
  },
  uploadingText: {
    color: colors.navy,
    fontWeight: '600',
  },
});
