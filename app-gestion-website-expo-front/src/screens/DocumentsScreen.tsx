import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  Switch,
} from 'react-native';
import { Plus, Eye, Download, Trash2, Folder as FolderIcon, ChevronRight, Lock, X, FolderDown } from 'lucide-react-native';
import { Document, Folder, User, DocumentPermission } from '../types';
import { initialDocuments, initialFolders, initialUtilisateurs, courseDocuments } from '../data/mockData';
import AddDocumentModal from '../components/modalsHelper/AddDocumentModal';
import CreateFolderModal from '../components/modalsHelper/CreateFolderModal';
import { canUserAccessFolder, getUserRoleOnFolder, getRoleDisplay } from '../utils/permissions';
import { isWeb } from '../utils/responsive';
import { Button } from '../components/ui/button';

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<Document[]>([...initialDocuments, ...courseDocuments]);
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedDocumentForPermissions, setSelectedDocumentForPermissions] = useState<Document | null>(null);
  const [tempPermissions, setTempPermissions] = useState<DocumentPermission[]>([]);
  const currentUserId = 1; // ID de l'utilisateur connecté (à remplacer par la vraie valeur)

  const currentFolder = folders.find((f) => f.id === currentFolderId);
  const currentUser = initialUtilisateurs.find((u) => u.id === currentUserId);

  // Get all cadets for permissions management
  const cadets = initialUtilisateurs.filter((user) =>
    user.role === 'Cadet' || user.role === 'Ancien Cadet'
  );

  // Check if current user can manage permissions
  const canManagePermissions = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Encadrant');

  // Check if current user is an admin member (can download all documents)
  const isAdminMember = currentUser && (
    currentUser.role === 'Admin' ||
    currentUser.role === 'Président' ||
    currentUser.role === 'Trésorier'
  );

  const handleDeleteDocument = (id: number) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
  };

  const handleOpenPermissionsModal = (document: Document) => {
    setSelectedDocumentForPermissions(document);
    setTempPermissions(document.permissions || []);
    setShowPermissionsModal(true);
  };

  const handleClosePermissionsModal = () => {
    setShowPermissionsModal(false);
    setSelectedDocumentForPermissions(null);
    setTempPermissions([]);
  };

  const handleTogglePermission = (userId: number) => {
    const existingPermission = tempPermissions.find((p) => p.userId === userId);

    if (existingPermission) {
      // Toggle the permission
      setTempPermissions(
        tempPermissions.map((p) =>
          p.userId === userId ? { ...p, canAccess: !p.canAccess } : p
        )
      );
    } else {
      // Add new permission
      setTempPermissions([...tempPermissions, { userId, canAccess: true }]);
    }
  };

  const hasAccess = (userId: number): boolean => {
    const permission = tempPermissions.find((p) => p.userId === userId);
    return permission ? permission.canAccess : false;
  };

  const handleSavePermissions = () => {
    if (!selectedDocumentForPermissions) return;

    // Update the document with new permissions
    setDocuments(
      documents.map((doc) =>
        doc.id === selectedDocumentForPermissions.id
          ? { ...doc, permissions: tempPermissions }
          : doc
      )
    );

    // Log the changes for debugging
    console.log('Permissions updated for document:', selectedDocumentForPermissions.nameDoc);
    console.log('New permissions:', tempPermissions);

    handleClosePermissionsModal();
  };

  const handleAddDocument = (newDoc: Omit<Document, 'id' | 'date'> & { size?: number }) => {
    // Formater la taille du fichier
    const formatFileSize = (bytes?: number): string => {
      if (!bytes) return '0 KB';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const document: Document = {
      id: documents.length + 1,
      nameDoc: newDoc.nameDoc,
      folderId: newDoc.folderId,
      type: newDoc.type,
      length: formatFileSize(newDoc.size),
      date: new Date().toISOString().split('T')[0],
      uploadedBy: currentUserId,
      uri: newDoc.uri,
      mimeType: newDoc.mimeType,
    };
    setDocuments([...documents, document]);
  };

  const handleCreateFolder = (newFolder: Omit<Folder, 'id' | 'createdAt'>) => {
    const folder: Folder = {
      id: folders.length + 1,
      name: newFolder.name,
      parentId: newFolder.parentId,
      createdBy: newFolder.createdBy,
      createdAt: new Date().toISOString().split('T')[0],
      permissions: newFolder.permissions,
    };
    setFolders([...folders, folder]);
  };

  const handleDeleteFolder = (id: number) => {
    // Supprimer le dossier et tous les documents qu'il contient
    setFolders(folders.filter((f) => f.id !== id && f.parentId !== id));
    setDocuments(documents.filter((doc) => doc.folderId !== id));
  };

  const navigateToFolder = (folderId: number) => {
    const folder = folders.find((f) => f.id === folderId);
    if (folder && canUserAccessFolder(currentUserId, folder, 'view')) {
      setCurrentFolderId(folderId);
    }
  };

  const navigateBack = () => {
    if (currentFolder?.parentId) {
      setCurrentFolderId(currentFolder.parentId);
    } else {
      setCurrentFolderId(null);
    }
  };

  // Fonction pour télécharger tous les documents de l'association
  const handleDownloadAllDocuments = () => {
    if (documents.length === 0) {
      if (isWeb) {
        alert('Aucun document à télécharger');
      } else {
        Alert.alert('Information', 'Aucun document à télécharger');
      }
      return;
    }

    // TODO: Implémenter le téléchargement réel de tous les documents
    // Pour le moment, on simule le téléchargement
    if (isWeb) {
      alert(`Téléchargement de ${documents.length} document(s) de l'association...\n\nCette fonctionnalité sera bientôt disponible.\n\nLes documents seront téléchargés dans un fichier ZIP.`);
    } else {
      Alert.alert(
        'Téléchargement',
        `Téléchargement de ${documents.length} document(s) de l'association...\n\nCette fonctionnalité sera bientôt disponible.\n\nLes documents seront téléchargés dans un fichier ZIP.`
      );
    }

    // Dans une vraie application, vous feriez quelque chose comme :
    // const documentsToDownload = documents.map(doc => ({
    //   name: doc.nameDoc,
    //   uri: doc.uri || '',
    //   folder: folders.find(f => f.id === doc.folderId)?.name || 'root'
    // }));
    // await downloadDocumentsAsZip(documentsToDownload, 'association-documents.zip');
  };

  // Filtrer les dossiers accessibles dans le dossier actuel
  const accessibleFolders = folders.filter((folder) => {
    const isInCurrentFolder = folder.parentId === currentFolderId;
    const hasAccess = canUserAccessFolder(currentUserId, folder, 'view');
    return isInCurrentFolder && hasAccess;
  });

  // Filtrer les documents dans le dossier actuel
  const currentDocuments = currentFolderId
    ? documents.filter((doc) => doc.folderId === currentFolderId)
    : [];

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      PDF: '#ef4444',
      DOCX: '#3b82f6',
      XLSX: '#10b981',
      PPTX: '#f59e0b',
    };
    return colors[type] || '#64748b';
  };

  const renderFolder = ({ item }: { item: Folder }) => {
    const userRole = getUserRoleOnFolder(currentUserId, item);
    const roleDisplay = userRole ? getRoleDisplay(userRole) : null;
    const canDelete = canUserAccessFolder(currentUserId, item, 'delete');
    const documentsCount = documents.filter((doc) => doc.folderId === item.id).length;

    return (
      <TouchableOpacity
        style={styles.folderCard}
        onPress={() => navigateToFolder(item.id)}
      >
        <View style={styles.folderIcon}>
          <FolderIcon color="#3b82f6" size={32} />
        </View>
        <View style={styles.folderInfo}>
          <View style={styles.folderHeader}>
            <Text style={styles.folderName}>{item.name}</Text>
            {roleDisplay && (
              <View style={[styles.roleBadge, { backgroundColor: roleDisplay.color + '20' }]}>
                <Text style={styles.roleIcon}>{roleDisplay.icon}</Text>
                <Text style={[styles.roleText, { color: roleDisplay.color }]}>
                  {roleDisplay.label}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.folderMeta}>
            {documentsCount} document{documentsCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.folderActions}>
          {canDelete && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteFolder(item.id);
              }}
            >
              <Trash2 color="#ef4444" size={18} />
            </TouchableOpacity>
          )}
          <ChevronRight color="#64748b" size={20} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderDocument = ({ item }: { item: Document }) => {
    const isCourseDocument = item.id >= 100;
    const showPermissionsButton = isCourseDocument && canManagePermissions;

    return (
      <View style={styles.documentCard}>
        <View style={styles.documentInfo}>
          <Text style={styles.documentName}>{item.nameDoc}</Text>
          <View style={styles.documentMeta}>
            <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) + '20' }]}>
              <Text style={[styles.typeText, { color: getTypeColor(item.type) }]}>
                {item.type}
              </Text>
            </View>
            <Text style={styles.metaText}>{item.length}</Text>
            <Text style={styles.metaText}>{item.date}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Eye color="#64748b" size={18} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Download color="#64748b" size={18} />
          </TouchableOpacity>
          {showPermissionsButton && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleOpenPermissionsModal(item)}
            >
              <Lock color="#3b82f6" size={18} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteDocument(item.id)}
          >
            <Trash2 color="#ef4444" size={18} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const canAddInCurrentFolder = currentFolder
    ? canUserAccessFolder(currentUserId, currentFolder, 'add')
    : false;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {currentFolder && (
                <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
                  <ChevronRight
                    color="#2563eb"
                    size={20}
                    style={{ transform: [{ rotate: '180deg' }] }}
                  />
                </TouchableOpacity>
              )}
              <View>
                <Text style={styles.title}>
                  {currentFolder ? currentFolder.name : 'Gestion des Documents'}
                </Text>
                <Text style={styles.subtitle}>
                  {accessibleFolders.length} dossier{accessibleFolders.length !== 1 ? 's' : ''} •{' '}
                  {currentDocuments.length} document{currentDocuments.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              {documents.length > 0 && isAdminMember && (
                <TouchableOpacity
                  style={[styles.addButton, styles.downloadAllButton]}
                  onPress={handleDownloadAllDocuments}
                >
                  <FolderDown color="#2563eb" size={20} />
                  <Text style={[styles.addButtonText, styles.downloadAllButtonText]}>
                    Télécharger tout ({documents.length})
                  </Text>
                </TouchableOpacity>
              )}
              {currentFolderId && canAddInCurrentFolder && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowAddModal(true)}
                >
                  <Plus color="#fff" size={20} />
                  <Text style={styles.addButtonText}>Document</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.addButton, styles.createFolderButton]}
                onPress={() => setShowCreateFolderModal(true)}
              >
                <FolderIcon color="#fff" size={20} />
                <Text style={styles.addButtonText}>Dossier</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.listContent}>
            {accessibleFolders.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dossiers</Text>
                {accessibleFolders.map((folder) => (
                  <View key={folder.id}>{renderFolder({ item: folder })}</View>
                ))}
              </View>
            )}

            {currentDocuments.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Documents</Text>
                {currentDocuments.map((doc) => (
                  <View key={doc.id}>{renderDocument({ item: doc })}</View>
                ))}
              </View>
            )}

            {accessibleFolders.length === 0 && currentDocuments.length === 0 && (
              <View style={styles.emptyState}>
                <FolderIcon color="#cbd5e1" size={64} />
                <Text style={styles.emptyStateText}>
                  {currentFolder
                    ? 'Ce dossier est vide'
                    : 'Aucun dossier accessible'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

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
        users={initialUtilisateurs}
        currentUserId={currentUserId}
        parentFolder={currentFolder}
      />

      {/* Permissions Modal */}
      <Modal
        visible={showPermissionsModal}
        transparent
        animationType="slide"
        onRequestClose={handleClosePermissionsModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.permissionsModalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gestion des permissions</Text>
              <TouchableOpacity onPress={handleClosePermissionsModal} style={styles.closeButton}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            {/* Document name */}
            {selectedDocumentForPermissions && (
              <View style={styles.documentNameSection}>
                <Text style={styles.documentNameLabel}>Document:</Text>
                <Text style={styles.documentNameValue}>{selectedDocumentForPermissions.nameDoc}</Text>
              </View>
            )}

            {/* Cadets list */}
            <ScrollView style={styles.cadetsList}>
              <Text style={styles.cadetsListTitle}>Accès des cadets</Text>
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
                    trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
                    thumbColor={hasAccess(cadet.id) ? '#2563eb' : '#f1f5f9'}
                  />
                </View>
              ))}
              {cadets.length === 0 && (
                <Text style={styles.emptyText}>Aucun cadet disponible</Text>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <Button
                variant="secondary"
                onPress={handleClosePermissionsModal}
                style={styles.footerButton}
              >
                Annuler
              </Button>
              <Button
                variant="default"
                onPress={handleSavePermissions}
                style={styles.footerButton}
              >
                Enregistrer
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  createFolderButton: {
    backgroundColor: '#10b981',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  downloadAllButton: {
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#bfdbfe',
  },
  downloadAllButtonText: {
    color: '#2563eb',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  listContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
  },
  folderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  folderIcon: {
    marginRight: 16,
  },
  folderInfo: {
    flex: 1,
  },
  folderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  folderMeta: {
    fontSize: 12,
    color: '#64748b',
  },
  folderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  roleIcon: {
    fontSize: 12,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 16,
  },
  documentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Permissions Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionsModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  closeButton: {
    padding: 4,
  },
  documentNameSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  documentNameLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  documentNameValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  cadetsList: {
    flex: 1,
    padding: 20,
  },
  cadetsListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 16,
  },
  cadetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cadetInfo: {
    flex: 1,
  },
  cadetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  cadetRole: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerButton: {
    flex: 1,
  },
});