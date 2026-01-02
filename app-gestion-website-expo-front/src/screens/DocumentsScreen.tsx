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
import { Plus, Eye, Download, Trash2, Folder as FolderIcon, ChevronRight, Lock, X, FolderDown } from 'lucide-react-native';
import { Document, Folder, User, DocumentPermission } from '../types';
import { initialDocuments, initialFolders, initialUtilisateurs, courseDocuments } from '../data/mockData';
import AddDocumentModal from '../components/modalsHelper/AddDocumentModal';
import CreateFolderModal from '../components/modalsHelper/CreateFolderModal';
import DocumentViewerModal from '../components/modalsHelper/DocumentViewerModal';
import { canUserAccessFolder, getUserRoleOnFolder, getRoleDisplay } from '../utils/permissions';
import { isWeb } from '../utils/responsive';
import { Button } from '../components/ui/button';
import { DocumentsApi, FoldersApi, AuthApi, AssociationsApi, type AuthUser } from '../api';
import { tokenStorage } from '../api/tokenStorage';

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

  // Charger les documents depuis la BDD
  const fetchDocuments = async () => {
    try {
      setLoadingDocuments(true);
      const response = await DocumentsApi.getAll();

      if (response.success && response.data) {
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

        // Mapper les dossiers de l'API au format local
        const mappedFolders: Folder[] = response.data.folders.map((folder: any) => ({
          id: folder.id,
          name: folder.name,
          parentId: folder.parentId,
          createdBy: folder.ownerId, // Backend utilise ownerId
          createdAt: folder.createdAt,
          permissions: folder.permissions || [], // Utiliser les permissions du backend
        }));

        console.log('🗂️ Mapped folders:', mappedFolders);
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
      const response = await DocumentsApi.viewDocument(id);
      console.log('📄 View response:', response);

      if (response.success && response.data?.document) {
        const doc = response.data.document;

        // Télécharger le fichier avec authentification et créer un blob URL
        const token = await tokenStorage.getAccessToken();
        const downloadPath = DocumentsApi.downloadDocument(id);

        console.log('📄 Fetching document from:', downloadPath);

        // Télécharger le fichier avec le token d'authentification
        const fileResponse = await fetch(downloadPath, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!fileResponse.ok) {
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
        if (isWeb) {
          alert('Impossible de récupérer les informations du document');
        } else {
          Alert.alert('Erreur', 'Impossible de récupérer les informations du document');
        }
      }
    } catch (error) {
      console.error('❌ Error viewing document:', error);
      if (isWeb) {
        alert(`Erreur lors de l'ouverture du document: ${error}`);
      } else {
        Alert.alert('Erreur', 'Impossible d\'ouvrir le document');
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

  const handleAddDocument = async (newDoc: Omit<Document, 'id' | 'date'> & { size?: number; uri?: string; mimeType?: string; visibility?: 'association' | 'personal' }) => {
    try {
      setUploadingDocument(true);

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

        // Afficher un message de succès
        if (isWeb) {
          alert('Document ajouté avec succès !');
        } else {
          Alert.alert('Succès', 'Document ajouté avec succès !');
        }
      }
    } catch (error) {
      console.error('Error uploading document:', error);

      if (isWeb) {
        alert('Erreur lors de l\'ajout du document');
      } else {
        Alert.alert('Erreur', 'Impossible d\'ajouter le document');
      }
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleCreateFolder = async (newFolder: Omit<Folder, 'id' | 'createdAt'>) => {
    try {
      // Déterminer la visibilité selon le rôle de l'utilisateur
      let visibility: 'private' | 'members' | 'staff' | 'public' = 'members';

      // Super admin peut créer des dossiers pour le staff
      if (currentAuthUser?.role.name === 'super_admin') {
        visibility = 'staff';
      }
      // Les autres utilisateurs créent des dossiers pour tous les membres
      else {
        visibility = 'members';
      }

      // Créer le dossier via l'API
      const response = await FoldersApi.create({
        name: newFolder.name,
        parentId: newFolder.parentId,
        visibility,
        allowUpload: true,
        allowDownload: true,
        allowDelete: false,
      });

      if (response.success && response.data) {
        // Recharger les dossiers depuis la BDD
        await fetchFolders();

        if (isWeb) {
          alert('Dossier créé avec succès !');
        } else {
          Alert.alert('Succès', 'Dossier créé avec succès !');
        }
      }
    } catch (error) {
      console.error('Error creating folder:', error);

      if (isWeb) {
        alert('Erreur lors de la création du dossier');
      } else {
        Alert.alert('Erreur', 'Impossible de créer le dossier');
      }
    }
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

  // Pour le moment, on affiche tous les documents sans système de dossiers
  const accessibleFolders: Folder[] = [];

  // Filtrer les documents selon le dossier actuel
  const currentDocuments = documents.filter((doc) => doc.folderId === currentFolderId);

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
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              console.log('👁️ View button clicked for document:', {
                id: item.id,
                name: item.nameDoc,
                type: item.type,
              });
              handleViewDocument(item.id);
            }}
          >
            <Eye color="#64748b" size={18} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              console.log('⬇️ Download button clicked for document:', {
                id: item.id,
                name: item.nameDoc,
                type: item.type,
              });
              handleDownloadDocument(item.id, item.nameDoc);
            }}
          >
            <Download color="#64748b" size={18} />
          </TouchableOpacity>
          {showPermissionsButton && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                console.log('🔒 Permissions button clicked for document:', {
                  id: item.id,
                  name: item.nameDoc,
                });
                handleOpenPermissionsModal(item);
              }}
            >
              <Lock color="#3b82f6" size={18} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              console.log('🗑️ Delete button clicked for document:', {
                id: item.id,
                name: item.nameDoc,
              });
              handleDeleteDocument(item.id);
            }}
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

  // Afficher un loader si l'utilisateur est en cours de chargement
  if (loadingUser) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 16, color: '#64748b' }}>Chargement...</Text>
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
              <TouchableOpacity
                style={styles.createFolderButton}
                onPress={() => setShowCreateFolderModal(true)}
              >
                <FolderIcon color="#2563eb" size={20} />
                <Text style={styles.createFolderButtonText}>Nouveau dossier</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddModal(true)}
              >
                <Plus color="#fff" size={20} />
                <Text style={styles.addButtonText}>Ajouter un document</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.listContent}>
            {loadingDocuments ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color="#2563eb" />
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
                      {visibleFolders.map((folder) => (
                        <View key={folder.id}>{renderFolder({ item: folder })}</View>
                      ))}
                    </View>
                  ) : null;
                })()}

                {/* Section des documents */}
                {currentDocuments.length > 0 ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Documents</Text>
                    {currentDocuments.map((doc) => (
                      <View key={doc.id}>{renderDocument({ item: doc })}</View>
                    ))}
                  </View>
                ) : folders.filter((f) => f.parentId === currentFolderId).length === 0 ? (
                  <View style={styles.emptyState}>
                    <FolderIcon color="#cbd5e1" size={64} />
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
            <ActivityIndicator size="large" color="#2563eb" />
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
  headerTitleSection: {
    flex: 1,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  breadcrumbItem: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  breadcrumbActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  breadcrumbSeparator: {
    fontSize: 14,
    color: '#cbd5e1',
    marginHorizontal: 8,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  createFolderButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
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
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    gap: 16,
    minWidth: 200,
  },
  loadingText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
});