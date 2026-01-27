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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Plus, Eye, Download, Trash2, Folder as FolderIcon, ChevronRight, Lock, X, FolderDown, Grid3x3, List, MoreVertical, FileText, File as FileIcon } from 'lucide-react-native';
import { Document, Folder, User, DocumentPermission } from '../types';
import { initialDocuments, initialFolders, initialUtilisateurs, courseDocuments } from '../data/mockData';
import { colors, textStyles, spacing, shadows, borderRadius } from '../theme';
import { Card, SearchBar, Badge } from '../components/cadep';
import AddDocumentModal from '../components/modalsHelper/AddDocumentModal';
import CreateFolderModal from '../components/modalsHelper/CreateFolderModal';
import DocumentViewerModal from '../components/modalsHelper/DocumentViewerModal';
import DeleteFolderModal from '../components/modalsHelper/DeleteFolderModal';
import DeleteDocumentModal from '../components/modalsHelper/DeleteDocumentModal';
import Toast, { ToastType } from '../components/ui/Toast';
import { canUserAccessFolder, getUserRoleOnFolder, getRoleDisplay } from '../utils/permissions';
import { isWeb, isMobile, getFontSize, getSpacing, getResponsivePadding, MIN_TOUCH_TARGET, isSmallMobile } from '../utils/responsive';
import { Button } from '../components/ui/button';
import { DocumentsApi, FoldersApi, AuthApi, AssociationsApi, type AuthUser } from '../api';
import { tokenStorage } from '../api/tokenStorage';
import { generateFolderSlug } from '../utils/slug';
import { authEventEmitter } from '../api/authEventEmitter';

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedDocumentForPermissions, setSelectedDocumentForPermissions] = useState<Document | null>(null);
  const [tempPermissions, setTempPermissions] = useState<DocumentPermission[]>([]);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [currentAuthUser, setCurrentAuthUser] = useState<AuthUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [viewerDocumentUrl, setViewerDocumentUrl] = useState<string | null>(null);
  const [viewerDocumentName, setViewerDocumentName] = useState('');
  const [viewerDocumentMimeType, setViewerDocumentMimeType] = useState('');
  const [associationMembers, setAssociationMembers] = useState<User[]>([]);

  // États pour la suppression de dossier
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<{
    id: number;
    name: string;
    documentsCount: number;
    childrenCount: number;
  } | null>(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);

  // États pour la suppression de document
  const [showDeleteDocumentModal, setShowDeleteDocumentModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{
    id: number;
    name: string;
    type: string;
    size: string;
  } | null>(null);
  const [isDeletingDocument, setIsDeletingDocument] = useState(false);

  // États pour le toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  // État pour le mode d'affichage (grid ou list)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // États pour le menu contextuel
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuType, setContextMenuType] = useState<'folder' | 'document'>('document');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  const currentFolder = folders.find((f) => f.id === currentFolderId);
  const currentUserId = currentAuthUser?.id || 1;
  const currentUser = initialUtilisateurs.find((u) => u.id === currentUserId);

  // Get all cadets for permissions management
  const cadets = initialUtilisateurs.filter((user) =>
    user.role === 'Cadet' || user.role === 'Ancien Cadet'
  );

  // Récupérer l'utilisateur connecté
  const fetchCurrentUser = async () => {
    try {
      setLoadingUser(true);
      const response = await AuthApi.getMe();
      if (response.success && response.data?.user) {
        setCurrentAuthUser(response.data.user);
        console.log('👤 Current user:', response.data.user);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    } finally {
      setLoadingUser(false);
    }
  };

  // Charger l'utilisateur au montage
  React.useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Écouter les événements de session expirée
  React.useEffect(() => {
    const handleSessionExpired = () => {
      console.log('🔒 Session expired, showing error message');
      showErrorToast('Votre session a expiré. Veuillez vous reconnecter.');
      // Vous pouvez aussi rediriger vers l'écran de connexion ici
    };

    // S'abonner aux événements d'expiration de session
    const unsubscribe = authEventEmitter.subscribe(handleSessionExpired);

    return () => {
      // Cleanup: retirer le listener au démontage
      unsubscribe();
    };
  }, []);

  // Charger les documents depuis la BDD
  const fetchDocuments = async () => {
    try {
      setLoadingDocuments(true);
      const response = await DocumentsApi.getAll();

      if (response.success && response.data) {
        console.log('📄 Documents from API:', response.data.documents);
        console.log('📊 Total documents count:', response.data.documents.length);

        // Mapper les documents de l'API au format local
        const mappedDocuments: Document[] = response.data.documents.map((doc) => ({
          id: doc.id,
          nameDoc: doc.name,
          folderId: doc.folderId || null,
          type: getFileType(doc.fileName),
          length: formatFileSize(doc.fileSize),
          date: new Date(doc.createdAt).toISOString().split('T')[0],
          uploadedBy: doc.userId,
          uri: doc.filePath,
          mimeType: doc.mimeType,
        }));

        console.log('📄 Mapped documents:', mappedDocuments);
        console.log('📊 Documents by folder:');
        const byFolder = mappedDocuments.reduce((acc, doc) => {
          const key = doc.folderId === null ? 'root (null)' : `folder ${doc.folderId}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log(byFolder);

        setDocuments(mappedDocuments);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      if (isWeb) {
        alert('Erreur lors du chargement des documents');
      } else {
        Alert.alert('Erreur', 'Impossible de charger les documents');
      }
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Charger les dossiers depuis l'API
  const fetchFolders = async () => {
    try {
      console.log('🔄 Fetching folders...');
      const response = await FoldersApi.getAll();
      console.log('📦 API Response:', response);

      if (response.success && response.data) {
        console.log('✅ Folders from API:', response.data.folders);
        console.log('📊 Total folders count:', response.data.folders.length);

        // Log des dossiers privés spécifiquement
        const privateFolders = response.data.folders.filter((f: any) => f.type === 'private' || f.visibility === 'private');
        console.log('🔒 Private folders:', privateFolders);

        // Mapper les dossiers de l'API au format local
        const mappedFolders: Folder[] = response.data.folders.map((folder: any) => ({
          id: folder.id,
          name: folder.name,
          slug: folder.slug,
          parentId: folder.parentId,
          createdBy: folder.ownerId || folder.createdBy, // Backend utilise ownerId
          createdAt: folder.createdAt,
          permissions: folder.permissions || [], // Utiliser les permissions du backend
          visibility: folder.visibility,
          description: folder.description,
          icon: folder.icon,
          color: folder.color,
          allowUpload: folder.allowUpload,
          allowDownload: folder.allowDownload,
          allowDelete: folder.allowDelete,
        }));

        console.log('🗂️ Mapped folders:', mappedFolders);
        console.log('📂 Root folders (parentId === null):', mappedFolders.filter(f => f.parentId === null));
        setFolders(mappedFolders);
        console.log('📁 Folders loaded and set in state:', mappedFolders.length);
      } else {
        console.warn('⚠️ API returned no data or failed');
      }
    } catch (error) {
      console.error('❌ Error loading folders:', error);
      // Continuer avec les dossiers mock en cas d'erreur
      setFolders(initialFolders);
    }
  };

  // Charger les membres de l'association
  const fetchAssociationMembers = async () => {
    try {
      const response = await AssociationsApi.getMembers({ limit: 100 });

      if (response.success && response.data) {
        // Mapper les membres au format User
        const mappedMembers: User[] = response.data.members.map((member: any) => ({
          id: member.id,
          firstname: member.firstname,
          lastname: member.lastname,
          email: member.email,
          role: member.role?.name || 'membre',
        }));

        setAssociationMembers(mappedMembers);
        console.log('👥 Association members loaded:', mappedMembers.length);
      }
    } catch (error) {
      console.error('Error loading association members:', error);
      // Continuer avec les utilisateurs mock en cas d'erreur
      setAssociationMembers(initialUtilisateurs);
    }
  };

  // Charger les documents, dossiers et membres au montage
  React.useEffect(() => {
    fetchDocuments();
    fetchFolders();
    fetchAssociationMembers();
  }, []);

  // Fonction helper pour déterminer le type de fichier
  const getFileType = (fileName: string): 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'OTHER' => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return 'PDF';
    if (extension === 'docx' || extension === 'doc') return 'DOCX';
    if (extension === 'xlsx' || extension === 'xls') return 'XLSX';
    if (extension === 'pptx' || extension === 'ppt') return 'PPTX';
    return 'OTHER';
  };

  // Fonction helper pour formater la taille
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Check if current user can manage permissions (utilise les vraies données de rôle)
  const canManagePermissions = currentAuthUser && (
    currentAuthUser.isSuperAdmin ||
    currentAuthUser.isAdmin ||
    currentAuthUser.role.level >= 70 // Niveau encadrant
  );

  // Check if current user is an admin member (can download all documents)
  const isAdminMember = currentAuthUser && (
    currentAuthUser.isSuperAdmin ||
    currentAuthUser.isAdmin ||
    currentAuthUser.role.level >= 80 // Niveau admin/président/trésorier
  );

  const handleViewDocument = async (id: number) => {
    console.log('📄 Viewing document:', id);
    try {
      // Vérifier d'abord si on a un token valide
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        console.error('❌ No access token available');
        showErrorToast('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      const response = await DocumentsApi.viewDocument(id);
      console.log('📄 View response:', response);

      if (response.success && response.data?.document) {
        const doc = response.data.document;

        // Télécharger le fichier avec authentification et créer un blob URL
        const downloadPath = DocumentsApi.downloadDocument(id);

        console.log('📄 Fetching document from:', downloadPath);

        // Télécharger le fichier avec le token d'authentification
        const fileResponse = await fetch(downloadPath, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!fileResponse.ok) {
          if (fileResponse.status === 401) {
            showErrorToast('Session expirée. Veuillez vous reconnecter.');
            return;
          }
          throw new Error(`Erreur HTTP: ${fileResponse.status}`);
        }

        // Récupérer le Content-Type depuis les headers de la réponse
        const contentType = fileResponse.headers.get('content-type') || doc.mimeType || 'application/octet-stream';

        console.log('📄 Content-Type from response:', contentType);
        console.log('📄 MimeType from doc:', doc.mimeType);

        // Convertir en blob avec le bon type MIME
        const arrayBuffer = await fileResponse.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: contentType });

        // Créer une URL blob locale
        const blobUrl = URL.createObjectURL(blob);

        console.log('📄 Opening viewer modal with blob URL:', blobUrl);
        console.log('📄 Blob type:', blob.type);

        // Ouvrir la modal de visualisation
        setViewerDocumentUrl(blobUrl);
        setViewerDocumentName(doc.name || doc.fileName || 'Document');
        setViewerDocumentMimeType(contentType);
        setShowViewerModal(true);
      } else {
        console.warn('📄 No document in response:', response);
        showErrorToast('Impossible de récupérer les informations du document');
      }
    } catch (error: any) {
      console.error('❌ Error viewing document:', error);

      // Gestion des erreurs d'authentification
      if (error?.code === 'SESSION_EXPIRED' || error?.status === 401) {
        showErrorToast('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error?.code === 'NETWORK_ERROR') {
        showErrorToast('Erreur de connexion. Vérifiez votre réseau.');
      } else {
        const errorMessage = error?.message || 'Impossible d\'ouvrir le document';
        showErrorToast(errorMessage);
      }
    }
  };

  const handleDownloadDocument = async (id: number, name: string) => {
    console.log('💾 Downloading document:', id, name);
    try {
      const downloadUrl = DocumentsApi.downloadDocument(id);
      console.log('💾 Download URL:', downloadUrl);

      if (isWeb) {
        // Pour le web, créer un lien temporaire et déclencher le téléchargement
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = name;
        link.target = '_blank'; // Ouvrir dans un nouvel onglet si le téléchargement échoue
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('💾 Download triggered');
      } else {
        // Pour mobile, utiliser Linking
        // await Linking.openURL(downloadUrl);
        Alert.alert('Info', 'Téléchargement en cours...');
      }
    } catch (error) {
      console.error('❌ Error downloading document:', error);
      if (isWeb) {
        alert(`Erreur lors du téléchargement du document: ${error}`);
      } else {
        Alert.alert('Erreur', 'Impossible de télécharger le document');
      }
    }
  };

  // Ouvrir la modal de suppression de document
  const handleOpenDeleteDocumentModal = (id: number) => {
    const document = documents.find((doc) => doc.id === id);
    if (!document) return;

    setDocumentToDelete({
      id,
      name: document.nameDoc,
      type: document.type,
      size: document.length,
    });
    setShowDeleteDocumentModal(true);
  };

  // Confirmer la suppression du document
  const handleConfirmDeleteDocument = async () => {
    if (!documentToDelete) return;

    setIsDeletingDocument(true);

    try {
      console.log('🗑️ Deleting document:', documentToDelete.id);
      const response = await DocumentsApi.deleteDocument(documentToDelete.id);

      if (response.success) {
        console.log('✅ Document deleted successfully');

        // Fermer la modal
        setShowDeleteDocumentModal(false);
        setDocumentToDelete(null);

        // Remove from local state
        setDocuments(documents.filter((doc) => doc.id !== documentToDelete.id));

        // Afficher le toast de succès
        showSuccessToast(`Document "${documentToDelete.name}" supprimé avec succès`);
      }
    } catch (error: any) {
      console.error('❌ Error deleting document:', error);

      // Fermer la modal
      setShowDeleteDocumentModal(false);
      setDocumentToDelete(null);

      // Afficher le toast d'erreur
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la suppression du document';
      showErrorToast(errorMessage);
    } finally {
      setIsDeletingDocument(false);
    }
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

  const handleAddDocument = async (newDoc: Omit<Document, 'id' | 'date'> & { size?: number; uri?: string; mimeType?: string; visibility?: 'association' | 'personal' }) => {
    try {
      setUploadingDocument(true);

      console.log('📤 Uploading document with data:', {
        nameDoc: newDoc.nameDoc,
        folderId: newDoc.folderId,
        currentFolderId: currentFolderId,
        visibility: newDoc.visibility,
      });

      // Convertir l'URI en File pour l'upload (en gardant le nom et le type MIME)
      let file: File;

      if (newDoc.uri) {
        // Pour le web, récupérer le fichier depuis l'URI
        const response = await fetch(newDoc.uri);
        const blob = await response.blob();

        // Créer un File avec le nom et le type MIME originaux
        file = new File([blob], newDoc.nameDoc, {
          type: newDoc.mimeType || blob.type
        });
      } else {
        throw new Error('Aucun fichier sélectionné');
      }

      // Mapper la visibilité du frontend vers le backend
      const backendVisibility = newDoc.visibility === 'personal' ? 'private' : 'members';

      console.log('📤 Sending to API:', {
        name: newDoc.nameDoc,
        folderId: newDoc.folderId,
        visibility: backendVisibility,
        category: 'other',
      });

      // Uploader le document via l'API
      const uploadResponse = await DocumentsApi.upload({
        name: newDoc.nameDoc,
        file: file,
        folderId: newDoc.folderId,
        visibility: backendVisibility,
        category: 'other', // Catégorie par défaut
      });

      if (uploadResponse.success && uploadResponse.data) {
        // Recharger les documents depuis la BDD pour afficher les données à jour
        await fetchDocuments();

        // Afficher le toast de succès
        showSuccessToast(`Document "${newDoc.nameDoc}" ajouté avec succès`);
      }
    } catch (error: any) {
      console.error('Error uploading document:', error);

      // Afficher le toast d'erreur
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de l\'ajout du document';
      showErrorToast(errorMessage);
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleCreateFolder = async (newFolder: Omit<Folder, 'id' | 'createdAt'>) => {
    console.log('📁 Creating folder with data:', newFolder);
    console.log('👤 Current auth user:', {
      id: currentAuthUser?.id,
      associationId: currentAuthUser?.associationId,
    });

    // Générer le slug: nom-dossier-userId-associationId
    const slug = generateFolderSlug(
      newFolder.name,
      currentAuthUser?.id || currentUserId,
      currentAuthUser?.associationId || null
    );

    console.log('🏷️ Generated slug:', slug);
    console.log('🔍 Slug breakdown:', {
      folderName: newFolder.name,
      userId: currentAuthUser?.id || currentUserId,
      associationId: currentAuthUser?.associationId || null,
      result: slug
    });

    // Créer l'objet de données à envoyer
    const folderDataToSend = {
      name: newFolder.name,
      slug,
      parentId: newFolder.parentId,
      visibility: newFolder.visibility || 'members',
      description: newFolder.description,
      icon: newFolder.icon,
      color: newFolder.color,
      allowUpload: true,
      allowDownload: true,
      allowDelete: false,
    };

    console.log('📤 Sending to API:', JSON.stringify(folderDataToSend, null, 2));

    // Créer le dossier via l'API avec toutes les propriétés
    const response = await FoldersApi.create(folderDataToSend);

    if (response.success && response.data) {
      console.log('✅ Folder created successfully:', response.data);
      // Recharger les dossiers depuis la BDD
      await fetchFolders();

      // Afficher le toast de succès
      showSuccessToast(`Dossier "${newFolder.name}" créé avec succès`);
    }
    // Les erreurs seront propagées à la modal qui les gérera
  };

  // Fonction pour afficher un toast
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

  // Gérer l'ouverture du menu contextuel
  const handleOpenContextMenu = (id: number, type: 'folder' | 'document') => {
    setSelectedItemId(id);
    setContextMenuType(type);
    setShowContextMenu(true);
  };

  const handleCloseContextMenu = () => {
    setShowContextMenu(false);
    setSelectedItemId(null);
  };

  const handleContextMenuAction = async (action: string) => {
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
          handleOpenPermissionsModal(document);
          break;
      }
    } else {
      const folder = folders.find(f => f.id === selectedItemId);
      if (!folder) return;

      switch (action) {
        case 'open':
          navigateToFolder(selectedItemId);
          break;
        case 'delete':
          handleOpenDeleteFolderModal(selectedItemId);
          break;
      }
    }
  };

  // Ouvrir la modal de suppression avec les informations du dossier
  const handleOpenDeleteFolderModal = async (id: number) => {
    const folder = folders.find((f) => f.id === id);
    if (!folder) return;

    // Compter les documents et sous-dossiers
    const documentsCount = documents.filter((doc) => doc.folderId === id).length;
    const childrenCount = folders.filter((f) => f.parentId === id).length;

    setFolderToDelete({
      id,
      name: folder.name,
      documentsCount,
      childrenCount,
    });
    setShowDeleteFolderModal(true);
  };

  // Confirmer la suppression du dossier
  const handleConfirmDeleteFolder = async () => {
    if (!folderToDelete) return;

    setIsDeletingFolder(true);

    try {
      console.log('🗑️ Deleting folder:', folderToDelete.id);

      // Toujours utiliser force=true si on arrive ici (l'utilisateur a déjà confirmé via la modal)
      const hasContent = folderToDelete.documentsCount > 0 || folderToDelete.childrenCount > 0;
      const response = await FoldersApi.delete(folderToDelete.id, hasContent);

      if (response.success) {
        console.log('✅ Folder deleted successfully');

        // Fermer la modal
        setShowDeleteFolderModal(false);
        setFolderToDelete(null);

        // Recharger les dossiers et documents
        await fetchFolders();
        await fetchDocuments();

        // Afficher le toast de succès
        showSuccessToast(`Dossier "${folderToDelete.name}" supprimé avec succès`);
      }
    } catch (error: any) {
      console.error('❌ Error deleting folder:', error);

      // Fermer la modal
      setShowDeleteFolderModal(false);
      setFolderToDelete(null);

      // Afficher le toast d'erreur
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la suppression du dossier';
      showErrorToast(errorMessage);
    } finally {
      setIsDeletingFolder(false);
    }
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

  // Pour le moment, on affiche tous les documents sans système de dossiers
  const accessibleFolders: Folder[] = [];

  // Filtrer les documents selon le dossier actuel
  const currentDocuments = documents.filter((doc) => doc.folderId === currentFolderId);

  const getTypeColor = (type: string) => {
    const typeColors: Record<string, string> = {
      PDF: '#EA4335',
      DOCX: '#4285F4',
      XLSX: '#0F9D58',
      PPTX: '#FBBC04',
    };
    return typeColors[type] || colors.gray[600];
  };

  const getFileIcon = (type: string) => {
    return FileText;
  };

  const renderFolder = ({ item }: { item: Folder }) => {
    const userRole = getUserRoleOnFolder(currentUserId, item);
    const roleDisplay = userRole ? getRoleDisplay(userRole) : null;
    const canDelete = canUserAccessFolder(currentUserId, item, 'delete');
    const documentsCount = documents.filter((doc) => doc.folderId === item.id).length;

    // Déterminer l'icône et la couleur
    const folderIcon = item.icon || '📁';
    const folderColor = item.color || '#3b82f6';

    // Déterminer si le dossier est restreint pour l'utilisateur actuel
    const isRestricted = item.visibility === 'private' && item.createdBy !== currentUserId;
    const isStaffOnly = item.visibility === 'staff' && currentAuthUser?.role?.level && currentAuthUser.role.level < 70;

    // Icône de restriction
    const getVisibilityIcon = () => {
      if (item.visibility === 'private') return '🔒';
      if (item.visibility === 'staff') return '👥';
      if (item.visibility === 'public') return '🌐';
      return null;
    };

    return (
      <TouchableOpacity
        style={[
          viewMode === 'grid' ? styles.folderCardGrid : styles.folderCard,
          (isRestricted || isStaffOnly) && styles.folderCardRestricted
        ]}
        onPress={() => navigateToFolder(item.id)}
        disabled={isRestricted || isStaffOnly}
      >
        <View style={[
          styles.folderIcon,
          viewMode === 'grid' && styles.folderIconGrid
        ]}>
          <FolderIcon
            color="#F9AB00"
            size={viewMode === 'grid' ? 48 : 24}
            fill="#F9AB00"
          />
          {(isRestricted || isStaffOnly) && (
            <View style={styles.restrictedBadge}>
              <Lock color={colors.error} size={16} />
            </View>
          )}
        </View>
        <View style={[styles.folderInfo, viewMode === 'grid' && styles.folderInfoGrid]}>
          <View style={styles.folderHeader}>
            <Text style={[
              styles.folderName,
              (isRestricted || isStaffOnly) && styles.folderNameRestricted,
              viewMode === 'grid' && styles.folderNameGrid
            ]} numberOfLines={viewMode === 'grid' ? 2 : undefined}>
              {item.name}
            </Text>
            {getVisibilityIcon() && (
              <Text style={styles.visibilityIcon}>{getVisibilityIcon()}</Text>
            )}
          </View>
          {viewMode === 'list' && item.description && (
            <Text style={styles.folderDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <Text style={styles.folderMeta}>
            {documentsCount} doc{documentsCount !== 1 ? 's' : ''}
          </Text>
        </View>
        {viewMode === 'list' && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={(e) => {
              e.stopPropagation();
              handleOpenContextMenu(item.id, 'folder');
            }}
          >
            <MoreVertical color={colors.gray[600]} size={20} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderDocument = ({ item }: { item: Document }) => {
    const isCourseDocument = item.id >= 100;
    const showPermissionsButton = isCourseDocument && canManagePermissions;
    const FileIconComponent = getFileIcon(item.type);
    const iconColor = getTypeColor(item.type);

    return (
      <TouchableOpacity
        style={viewMode === 'grid' ? styles.documentCardGrid : styles.documentCard}
        onPress={() => handleViewDocument(item.id)}
        activeOpacity={0.7}
      >
        {viewMode === 'list' && (
          <View style={styles.documentIconContainer}>
            <FileIconComponent
              color={iconColor}
              size={24}
              fill={iconColor}
            />
          </View>
        )}
        <View style={[styles.documentInfo, viewMode === 'grid' && styles.documentInfoGrid]}>
          {viewMode === 'grid' && (
            <View style={[styles.documentIconContainer, styles.documentIconContainerGrid]}>
              <FileIconComponent
                color={iconColor}
                size={48}
                fill={iconColor}
              />
            </View>
          )}
          <Text style={[
            styles.documentName,
            viewMode === 'grid' && styles.documentNameGrid
          ]} numberOfLines={viewMode === 'grid' ? 2 : 1}>
            {item.nameDoc}
          </Text>
          <View style={styles.documentMeta}>
            {viewMode === 'list' && (
              <>
                <Text style={styles.metaText}>{item.length}</Text>
                <Text style={styles.metaText}>{item.date}</Text>
              </>
            )}
            {viewMode === 'grid' && (
              <Text style={styles.metaText}>{item.length}</Text>
            )}
          </View>
        </View>
        {viewMode === 'list' ? (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={(e) => {
              e.stopPropagation();
              handleOpenContextMenu(item.id, 'document');
            }}
          >
            <MoreVertical color={colors.gray[600]} size={20} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.actions, styles.actionsGrid]}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleViewDocument(item.id);
              }}
            >
              <Eye color={colors.gray[600]} size={18} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDownloadDocument(item.id, item.nameDoc);
              }}
            >
              <Download color={colors.gray[600]} size={18} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleOpenDeleteDocumentModal(item.id);
              }}
            >
              <Trash2 color={colors.error} size={18} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const canAddInCurrentFolder = currentFolder
    ? canUserAccessFolder(currentUserId, currentFolder, 'add')
    : false;

  // Afficher un loader si l'utilisateur est en cours de chargement
  if (loadingUser) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.navy} />
        <Text style={{ marginTop: spacing[4], color: colors.gray[600] }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerTitleSection}>
                <Text style={styles.title}>Gestion des Documents</Text>

                {/* Breadcrumb / Fil d'Ariane */}
                <View style={styles.breadcrumb}>
                  <TouchableOpacity onPress={() => setCurrentFolderId(null)}>
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
                  {currentDocuments.length} document{currentDocuments.length !== 1 ? 's' : ''}
                  {currentAuthUser && ` • ${currentAuthUser.role.displayName}`}
                </Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              {/* View Mode Toggle */}
              <View style={styles.viewModeToggle}>
                <TouchableOpacity
                  style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
                  onPress={() => setViewMode('list')}
                >
                  <List color={viewMode === 'list' ? colors.white : colors.navy} size={20} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.viewModeButton, viewMode === 'grid' && styles.viewModeButtonActive]}
                  onPress={() => setViewMode('grid')}
                >
                  <Grid3x3 color={viewMode === 'grid' ? colors.white : colors.navy} size={20} />
                </TouchableOpacity>
              </View>

              {documents.length > 0 && isAdminMember && (
                <TouchableOpacity
                  style={[styles.addButton, styles.downloadAllButton]}
                  onPress={handleDownloadAllDocuments}
                >
                  <FolderDown color={colors.navy} size={20} />
                  <Text style={[styles.addButtonText, styles.downloadAllButtonText]}>
                    Télécharger tout ({documents.length})
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.createFolderButton}
                onPress={() => setShowCreateFolderModal(true)}
              >
                <FolderIcon color={colors.navy} size={20} />
                <Text style={styles.createFolderButtonText}>Nouveau dossier</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddModal(true)}
              >
                <Plus color={colors.white} size={20} />
                <Text style={styles.addButtonText}>Ajouter un document</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.listContent}>
            {loadingDocuments ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color={colors.navy} />
                <Text style={styles.emptyStateText}>Chargement des documents...</Text>
              </View>
            ) : (
              <>
                {/* Section des dossiers */}
                {(() => {
                  const visibleFolders = folders.filter((f) => f.parentId === currentFolderId);
                  console.log('📂 Visible folders (parentId === ' + currentFolderId + '):', visibleFolders);
                  console.log('📊 All folders:', folders);
                  console.log('🔍 Current folder ID:', currentFolderId);
                  return visibleFolders.length > 0 ? (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Dossiers</Text>
                      <View style={viewMode === 'grid' ? styles.gridContainer : null}>
                        {visibleFolders.map((folder) => (
                          <View
                            key={folder.id}
                            style={viewMode === 'grid' ? styles.gridItem : null}
                          >
                            {renderFolder({ item: folder })}
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null;
                })()}

                {/* Section des documents */}
                {currentDocuments.length > 0 ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Documents</Text>
                    <View style={viewMode === 'grid' ? styles.gridContainer : null}>
                      {currentDocuments.map((doc) => (
                        <View
                          key={doc.id}
                          style={viewMode === 'grid' ? styles.gridItem : null}
                        >
                          {renderDocument({ item: doc })}
                        </View>
                      ))}
                    </View>
                  </View>
                ) : folders.filter((f) => f.parentId === currentFolderId).length === 0 ? (
                  <View style={styles.emptyState}>
                    <FolderIcon color={colors.gray[400]} size={64} />
                    <Text style={styles.emptyStateText}>Aucun document ni dossier</Text>
                  </View>
                ) : null}
              </>
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
        users={associationMembers.length > 0 ? associationMembers : initialUtilisateurs}
        currentUserId={currentUserId}
        parentFolder={currentFolder}
      />

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        visible={showViewerModal}
        onClose={() => {
          // Libérer l'URL blob pour éviter les fuites mémoire
          if (viewerDocumentUrl && viewerDocumentUrl.startsWith('blob:')) {
            URL.revokeObjectURL(viewerDocumentUrl);
          }
          setShowViewerModal(false);
          setViewerDocumentUrl(null);
          setViewerDocumentName('');
          setViewerDocumentMimeType('');
        }}
        documentUrl={viewerDocumentUrl}
        documentName={viewerDocumentName}
        mimeType={viewerDocumentMimeType}
      />

      {/* Loading Modal for Upload */}
      <Modal
        visible={uploadingDocument}
        transparent
        animationType="fade"
      >
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.navy} />
            <Text style={styles.loadingText}>Upload du document en cours...</Text>
          </View>
        </View>
      </Modal>

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
                <X color={colors.gray[600]} size={24} />
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
                    trackColor={{ false: colors.gray[400], true: colors.navy }}
                    thumbColor={hasAccess(cadet.id) ? colors.navyLight : colors.gray[100]}
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

      {/* Context Menu Modal */}
      <Modal
        visible={showContextMenu}
        transparent
        animationType="fade"
        onRequestClose={handleCloseContextMenu}
      >
        <TouchableOpacity
          style={styles.contextMenuOverlay}
          activeOpacity={1}
          onPress={handleCloseContextMenu}
        >
          <View style={styles.contextMenuContainer}>
            {contextMenuType === 'document' ? (
              <>
                <TouchableOpacity
                  style={styles.contextMenuItem}
                  onPress={() => handleContextMenuAction('view')}
                >
                  <Eye color={colors.gray[700]} size={20} />
                  <Text style={styles.contextMenuText}>Ouvrir</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.contextMenuItem}
                  onPress={() => handleContextMenuAction('download')}
                >
                  <Download color={colors.gray[700]} size={20} />
                  <Text style={styles.contextMenuText}>Télécharger</Text>
                </TouchableOpacity>
                {selectedItemId && selectedItemId >= 100 && canManagePermissions && (
                  <TouchableOpacity
                    style={styles.contextMenuItem}
                    onPress={() => handleContextMenuAction('permissions')}
                  >
                    <Lock color={colors.gray[700]} size={20} />
                    <Text style={styles.contextMenuText}>Gérer les permissions</Text>
                  </TouchableOpacity>
                )}
                <View style={styles.contextMenuDivider} />
                <TouchableOpacity
                  style={styles.contextMenuItem}
                  onPress={() => handleContextMenuAction('delete')}
                >
                  <Trash2 color={colors.error} size={20} />
                  <Text style={[styles.contextMenuText, { color: colors.error }]}>Supprimer</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.contextMenuItem}
                  onPress={() => handleContextMenuAction('open')}
                >
                  <FolderIcon color={colors.gray[700]} size={20} />
                  <Text style={styles.contextMenuText}>Ouvrir</Text>
                </TouchableOpacity>
                <View style={styles.contextMenuDivider} />
                <TouchableOpacity
                  style={styles.contextMenuItem}
                  onPress={() => handleContextMenuAction('delete')}
                >
                  <Trash2 color={colors.error} size={20} />
                  <Text style={[styles.contextMenuText, { color: colors.error }]}>Supprimer</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Folder Modal */}
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

      {/* Delete Document Modal */}
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

      {/* Toast Notification */}
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
  backButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: colors.navyLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
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
  addButtonText: {
    color: colors.white,
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
    marginHorizontal: -spacing[1.5],
  },
  gridItem: {
    width: isMobile ? '50%' : '25%',
    paddingHorizontal: spacing[2],
    marginBottom: spacing[4],
  },
  folderCard: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.md,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[1],
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: isMobile ? MIN_TOUCH_TARGET : 48,
  },
  folderCardGrid: {
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
  folderIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
    position: 'relative',
  },
  folderIconGrid: {
    width: 48,
    height: 48,
    marginRight: 0,
    marginBottom: spacing[3],
    alignSelf: 'flex-start',
  },
  folderIconEmoji: {
    fontSize: 24,
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
  folderCardRestricted: {
    opacity: 0.6,
    backgroundColor: colors.gray[50],
  },
  folderInfo: {
    flex: 1,
  },
  folderInfoGrid: {
    alignItems: 'center',
    textAlign: 'center',
  },
  folderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
    flexWrap: 'wrap',
  },
  folderName: {
    fontSize: getFontSize(14),
    fontWeight: '400',
    color: '#202124',
    lineHeight: 20,
  },
  folderNameGrid: {
    fontSize: getFontSize(14),
    lineHeight: 20,
    fontWeight: '400',
    color: '#202124',
  },
  folderNameRestricted: {
    color: colors.gray[500],
  },
  visibilityIcon: {
    fontSize: 14,
    marginLeft: spacing[1],
  },
  folderDescription: {
    fontSize: getFontSize(14),
    color: colors.gray[600],
    marginBottom: spacing[2],
    lineHeight: 20,
  },
  folderMeta: {
    fontSize: getFontSize(12),
    color: '#5f6368',
    fontWeight: '400',
  },
  folderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
    gap: spacing[1],
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
    paddingVertical: spacing[15],
  },
  emptyStateText: {
    ...textStyles.h4,
    color: colors.gray[500],
    marginTop: spacing[4],
    textAlign: 'center',
    paddingHorizontal: spacing[5],
  },
  documentCard: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.md,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[1],
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'stretch' : 'center',
    gap: isMobile ? spacing[3] : 0,
    minHeight: isMobile ? MIN_TOUCH_TARGET : 48,
  },
  documentCardGrid: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    height: '100%',
  },
  documentIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  documentIconContainerGrid: {
    width: 48,
    height: 48,
    marginRight: 0,
    marginBottom: spacing[3],
    alignSelf: 'flex-start',
  },
  documentInfo: {
    flex: 1,
  },
  documentInfoGrid: {
    alignItems: 'flex-start',
    width: '100%',
  },
  documentName: {
    fontSize: getFontSize(14),
    fontWeight: '400',
    color: '#202124',
    lineHeight: 20,
  },
  documentNameGrid: {
    fontSize: getFontSize(14),
    lineHeight: 20,
    fontWeight: '400',
    color: '#202124',
    marginBottom: spacing[2],
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flexWrap: 'wrap',
  },
  typeBadge: {
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.md,
  },
  typeText: {
    fontSize: getFontSize(12),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  metaText: {
    fontSize: getFontSize(12),
    color: '#5f6368',
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2.5],
    flexWrap: 'wrap',
    justifyContent: isMobile ? 'flex-start' : 'flex-end',
  },
  actionsGrid: {
    justifyContent: 'center',
    marginTop: 'auto',
  },
  actionButton: {
    width: isMobile ? MIN_TOUCH_TARGET : 32,
    height: isMobile ? MIN_TOUCH_TARGET : 32,
    borderRadius: borderRadius.full,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: 'transparent',
  },
  menuButton: {
    width: isMobile ? MIN_TOUCH_TARGET : 32,
    height: isMobile ? MIN_TOUCH_TARGET : 32,
    borderRadius: borderRadius.full,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Permissions Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: isMobile ? 'flex-end' : 'center',
    alignItems: 'center',
    padding: isMobile ? 0 : spacing[5],
  },
  permissionsModalContainer: {
    backgroundColor: colors.white,
    borderRadius: isMobile ? borderRadius.xl : borderRadius.xl,
    borderBottomLeftRadius: isMobile ? 0 : borderRadius.xl,
    borderBottomRightRadius: isMobile ? 0 : borderRadius.xl,
    width: '100%',
    maxWidth: isMobile ? '100%' : 500,
    maxHeight: isMobile ? '90%' : '80%',
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getResponsivePadding(),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
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
  documentNameSection: {
    padding: getResponsivePadding(),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  documentNameLabel: {
    ...textStyles.caption,
    fontWeight: '600',
    color: colors.gray[600],
    marginBottom: spacing[1],
  },
  documentNameValue: {
    ...textStyles.h4,
    color: colors.navy,
  },
  cadetsList: {
    flex: 1,
    padding: getResponsivePadding(),
  },
  cadetsListTitle: {
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
  },
  emptyText: {
    ...textStyles.body,
    color: colors.gray[500],
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: spacing[5],
  },
  modalFooter: {
    flexDirection: isMobile ? 'column' : 'row',
    padding: getResponsivePadding(),
    gap: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerButton: {
    flex: 1,
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
  loadingText: {
    ...textStyles.h4,
    color: colors.navy,
  },
  // Context Menu Styles
  contextMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  contextMenuContainer: {
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
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    gap: spacing[3],
    minHeight: isMobile ? MIN_TOUCH_TARGET : 48,
    backgroundColor: colors.white,
  },
  contextMenuText: {
    fontSize: getFontSize(14),
    color: colors.gray[700],
    fontWeight: '400',
  },
  contextMenuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing[1],
  },
});