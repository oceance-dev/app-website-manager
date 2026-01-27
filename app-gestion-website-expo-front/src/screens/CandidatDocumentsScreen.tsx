import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { Upload, FileCheck, AlertCircle, CheckCircle2, X, Download, FileText, Eye, RefreshCw } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { isWeb } from '../utils/responsive';
import { CandidatsApi, API_CONFIG } from '../api';
import { tokenStorage } from '../api/tokenStorage';
import Toast, { ToastType } from '../components/ui/Toast';
import DocumentViewerModal from '../components/modalsHelper/DocumentViewerModal';
import { colors, textStyles, spacing, shadows, borderRadius } from '../theme';
import { Card, Badge } from '../components/cadep';

interface RequiredDocument {
  id: number;
  name: string;
  description?: string;
  instructions?: string;
  category?: string;
  isRequired: boolean;
  documentTypeId: number;
  documentType?: {
    id: number;
    name: string;
    description?: string;
  };
  templateDocument?: {
    id: number;
    name: string;
    fileName: string;
    fileUrl: string;
    mimeType: string;
  };
  uploaded: boolean;
  fileName?: string;
  uploadDate?: string;
  fileUri?: string;
  fileId?: number;
}

interface CustomDocument {
  id: number;
  name: string;
  fileName: string;
  createdAt: string;
  fileSize?: number;
  category: string;
}

export default function CandidatDocumentsScreen() {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([]);
  const [customDocuments, setCustomDocuments] = useState<CustomDocument[]>([]);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const [showDocumentViewerModal, setShowDocumentViewerModal] = useState(false);
  const [viewerDocumentUrl, setViewerDocumentUrl] = useState<string | null>(null);
  const [viewerDocumentName, setViewerDocumentName] = useState('');
  const [viewerDocumentMimeType, setViewerDocumentMimeType] = useState('');

  const [showAddCustomDocModal, setShowAddCustomDocModal] = useState(false);

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

  const fetchRequirements = async () => {
    try {
      const requirementsResponse = await CandidatsApi.getDocumentRequirements();
      const myDocsResponse = await CandidatsApi.getMyDocuments();

      if (requirementsResponse.success && requirementsResponse.data && myDocsResponse.success && myDocsResponse.data) {
        const requirements = requirementsResponse.data.requirements;
        const myDocs = myDocsResponse.data.documents;

        const docsWithRequirement: any[] = [];
        const docsWithoutRequirement: any[] = [];

        myDocs.forEach((doc: any) => {
          const reqId = doc.documentRequirementId || doc.document_requirement_id;
          if (reqId) {
            docsWithRequirement.push(doc);
          } else {
            docsWithoutRequirement.push(doc);
          }
        });

        const merged = requirements.map((req: any) => {
            const uploadedDoc = docsWithRequirement.find((doc: any) => {
              const reqIdCamel = doc.documentRequirementId;
              const reqIdSnake = doc.document_requirement_id;
              return reqIdCamel === req.id || reqIdSnake === req.id;
            });

            return {
              id: req.id,
              name: req.name || 'Document',
              description: req.description || '',
              instructions: req.instructions || req.description,
              category: req.category || '',
              isRequired: req.isRequired === 1 || req.isRequired === true,
              documentTypeId: req.documentTypeId,
              documentType: req.documentType,
              templateDocument: req.templateDocument,
              uploaded: !!uploadedDoc,
              fileName: uploadedDoc?.originalName || uploadedDoc?.fileName || null,
              uploadDate: uploadedDoc?.createdAt || null,
              fileUri: uploadedDoc?.filePath || null,
              fileId: uploadedDoc?.id || null,
            };
          });

        setRequiredDocuments(merged);

        const customDocs = docsWithoutRequirement.map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          fileName: doc.originalName || doc.fileName,
          createdAt: doc.createdAt,
          fileSize: doc.fileSize,
          category: doc.category || 'other',
        }));

        setCustomDocuments(customDocs);
      }
    } catch (error) {
      console.error('Error fetching requirements:', error);
      showErrorToast('Erreur lors du chargement des documents requis');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequirements();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  const handleUploadDocument = async (documentId: number) => {
    try {
      setIsUploading(true);

      const requirement = requiredDocuments.find(doc => doc.id === documentId);
      if (!requirement) {
        showErrorToast('Document requirement introuvable');
        setIsUploading(false);
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsUploading(false);
        return;
      }

      const file = result.assets[0];
      const formData = new FormData();

      if (isWeb) {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        formData.append('file', blob, file.name);
      } else {
        formData.append('file', {
          uri: file.uri,
          type: file.mimeType || 'application/octet-stream',
          name: file.name,
        } as any);
      }

      formData.append('documentRequirementId', documentId.toString());

      if (requirement.category) {
        formData.append('category', requirement.category);
      }

      const uploadResponse = await CandidatsApi.uploadDocument(formData);

      if (uploadResponse.success) {
        showSuccessToast(`Document "${file.name}" uploadé avec succès`);
        await fetchRequirements();
      } else {
        showErrorToast('Erreur lors de l\'upload du document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      showErrorToast('Erreur lors de l\'upload du document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (fileId: number) => {
    const confirmDelete = async () => {
      try {
        const response = await CandidatsApi.deleteDocument(fileId);
        if (response.success) {
          showSuccessToast('Document supprimé avec succès');
          await fetchRequirements();
        } else {
          showErrorToast('Erreur lors de la suppression du document');
        }
      } catch (error) {
        console.error('Error deleting document:', error);
        showErrorToast('Erreur lors de la suppression du document');
      }
    };

    if (isWeb) {
      if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
        await confirmDelete();
      }
    } else {
      Alert.alert(
        'Confirmation',
        'Êtes-vous sûr de vouloir supprimer ce document ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Supprimer', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  const handleDownloadDocument = async (fileId: number, fileName: string) => {
    try {
      const response = await CandidatsApi.downloadDocument(fileId);
      if (response.success && response.data) {
        if (isWeb) {
          const blob = response.data;
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          showSuccessToast('Document téléchargé');
        } else {
          showSuccessToast('Téléchargement en cours...');
        }
      } else {
        showErrorToast('Erreur lors du téléchargement');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      showErrorToast('Erreur lors du téléchargement du document');
    }
  };

  const handleViewDocument = async (fileId: number, fileName: string) => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        showErrorToast('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      const downloadUrl = `${API_CONFIG.BASE_URL}/candidats/download-my-document/${fileId}`;
      const fileResponse = await fetch(downloadUrl, {
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

      const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';
      const arrayBuffer = await fileResponse.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);

      setViewerDocumentUrl(blobUrl);
      setViewerDocumentName(fileName || 'Document');
      setViewerDocumentMimeType(contentType);
      setShowDocumentViewerModal(true);
    } catch (error: any) {
      showErrorToast(error?.message || 'Impossible d\'ouvrir le document');
    }
  };

  const handleDownloadTemplateDocument = async (templateDocumentId: number, fileName: string) => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        showErrorToast('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      const downloadUrl = `${API_CONFIG.BASE_URL}/documents/users/download/${templateDocumentId}`;
      const fileResponse = await fetch(downloadUrl, {
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

      const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';
      const arrayBuffer = await fileResponse.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: contentType });

      if (isWeb) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        showSuccessToast('Formulaire téléchargé avec succès');
      } else {
        showSuccessToast('Téléchargement en cours...');
      }
    } catch (error: any) {
      showErrorToast(error?.message || 'Erreur lors du téléchargement');
    }
  };

  const handleUploadCustomDocument = async () => {
    try {
      setIsUploading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsUploading(false);
        return;
      }

      const file = result.assets[0];
      const formData = new FormData();

      if (isWeb) {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        formData.append('file', blob, file.name);
      } else {
        formData.append('file', {
          uri: file.uri,
          type: file.mimeType || 'application/octet-stream',
          name: file.name,
        } as any);
      }

      formData.append('category', 'other');
      formData.append('name', file.name);

      const uploadResponse = await CandidatsApi.uploadDocument(formData);

      if (uploadResponse.success) {
        showSuccessToast(`Document "${file.name}" ajouté avec succès`);
        setShowAddCustomDocModal(false);
        await fetchRequirements();
      } else {
        showErrorToast('Erreur lors de l\'ajout du document');
      }
    } catch (error) {
      console.error('Error uploading custom document:', error);
      showErrorToast('Erreur lors de l\'ajout du document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReplaceDocument = async (requirementId: number, fileId: number) => {
    try {
      setIsUploading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsUploading(false);
        return;
      }

      const file = result.assets[0];
      const formData = new FormData();
      formData.append('file', file as any);

      const response = await CandidatsApi.replaceDocument(fileId, formData);

      if (response.success) {
        showSuccessToast(`Document "${file.name}" remplacé avec succès`);
        await fetchRequirements();
      } else {
        showErrorToast('Erreur lors du remplacement du document');
      }
    } catch (error) {
      console.error('Error replacing document:', error);
      showErrorToast('Erreur lors du remplacement du document');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadedDocsCount = requiredDocuments.filter((doc) => doc.uploaded).length;
  const totalDocsCount = requiredDocuments.length;
  const allUploaded = uploadedDocsCount === totalDocsCount && totalDocsCount > 0;
  const progress = totalDocsCount > 0 ? (uploadedDocsCount / totalDocsCount) * 100 : 0;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.navy} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Documents requis</Text>
          <Text style={styles.subtitle}>
            Téléchargez les documents et formulaires nécessaires pour valider votre inscription
          </Text>
        </View>

        {/* Progression */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progression</Text>
            <Text style={styles.progressCount}>
              {uploadedDocsCount} / {totalDocsCount} documents
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <AlertCircle color={colors.info} size={20} />
          <Text style={styles.infoText}>
            Assurez-vous que vos documents sont lisibles et à jour. Les formats acceptés sont PDF, JPEG et PNG.
          </Text>
        </View>

        {/* Documents à fournir */}
        <Text style={styles.sectionTitle}>Documents à fournir</Text>
        <View style={styles.documentsList}>
          {requiredDocuments.map((doc) => (
            <View key={doc.id} style={styles.documentItem}>
              {/* Icône gauche */}
              <View style={styles.uploadIconContainer}>
                {doc.uploaded ? (
                  <CheckCircle2 color={colors.success} size={24} />
                ) : (
                  <Upload color={colors.gray[400]} size={24} />
                )}
              </View>

              {/* Contenu central */}
              <View style={styles.documentMainContent}>
                <Text style={styles.documentTitle}>{doc.name}</Text>
                {doc.description && (
                  <Text style={styles.documentDesc}>{doc.description}</Text>
                )}
                {doc.instructions && doc.instructions !== doc.description && (
                  <Text style={styles.documentDesc}>{doc.instructions}</Text>
                )}
              </View>

              {/* Boutons à droite */}
              <View style={styles.documentActionsContainer}>
                {/* Bouton télécharger le formulaire (si template disponible) */}
                {!doc.uploaded && doc.templateDocument && (
                  <TouchableOpacity
                    style={styles.downloadTemplateButton}
                    onPress={() => handleDownloadTemplateDocument(doc.templateDocument!.id, doc.templateDocument!.fileName)}
                    disabled={isUploading}
                  >
                    <Download color={colors.navy} size={18} />
                    <Text style={styles.downloadTemplateButtonText}>Télécharger</Text>
                  </TouchableOpacity>
                )}

                {/* Bouton principal (Transmettre ou Envoyé) */}
                <TouchableOpacity
                  style={[
                    styles.uploadActionButton,
                    doc.uploaded && styles.uploadActionButtonSuccess
                  ]}
                  onPress={() => doc.uploaded ? handleViewDocument(doc.fileId!, doc.fileName!) : handleUploadDocument(doc.id)}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <>
                      {doc.uploaded ? (
                        <>
                          <CheckCircle2 color={colors.white} size={18} />
                          <Text style={styles.uploadActionButtonText}>Envoyé</Text>
                        </>
                      ) : (
                        <>
                          <Upload color={colors.white} size={18} />
                          <Text style={styles.uploadActionButtonText}>Transmettre</Text>
                        </>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Documents personnalisés */}
        <View style={styles.customSection}>
          <Text style={styles.sectionTitle}>Autres documents</Text>
          <Text style={styles.sectionSubtitle}>
            Ajoutez des documents complémentaires si nécessaire
          </Text>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddCustomDocModal(true)}
            disabled={isUploading}
          >
            <Upload color={colors.navy} size={20} />
            <Text style={styles.addButtonText}>Ajouter un document</Text>
          </TouchableOpacity>

          {customDocuments.length > 0 && (
            <View style={styles.documentsList}>
              {customDocuments.map((doc) => (
                <Card key={doc.id} style={styles.documentCard}>
                  <View style={styles.documentRow}>
                    <View style={styles.documentContent}>
                      <View style={[styles.documentIcon, { backgroundColor: colors.successLight }]}>
                        <FileCheck color={colors.success} size={24} />
                      </View>
                      <View style={styles.documentInfo}>
                        <Text style={styles.documentName}>{doc.name}</Text>
                        <Text style={styles.documentDate}>
                          {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                        </Text>
                        <Badge text="Envoyé" variant="active" style={styles.badge} />
                      </View>
                    </View>
                    <View style={styles.actionsColumn}>
                      <TouchableOpacity
                        style={styles.iconButtonSmall}
                        onPress={() => handleViewDocument(doc.id, doc.fileName)}
                      >
                        <Eye color={colors.info} size={16} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconButtonSmall}
                        onPress={() => handleDownloadDocument(doc.id, doc.fileName)}
                      >
                        <Download color={colors.success} size={16} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.iconButtonSmall, styles.deleteButton]}
                        onPress={() => handleDeleteDocument(doc.id)}
                      >
                        <X color={colors.error} size={16} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de visualisation */}
      <DocumentViewerModal
        visible={showDocumentViewerModal}
        onClose={() => {
          if (viewerDocumentUrl && viewerDocumentUrl.startsWith('blob:')) {
            URL.revokeObjectURL(viewerDocumentUrl);
          }
          setShowDocumentViewerModal(false);
          setViewerDocumentUrl(null);
          setViewerDocumentName('');
          setViewerDocumentMimeType('');
        }}
        documentUrl={viewerDocumentUrl}
        documentName={viewerDocumentName}
        mimeType={viewerDocumentMimeType}
        showDownload={true}
      />

      {/* Modal d'ajout de document */}
      <Modal
        visible={showAddCustomDocModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddCustomDocModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un document</Text>
              <TouchableOpacity onPress={() => setShowAddCustomDocModal(false)}>
                <X color={colors.gray[600]} size={24} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.modalDescription}>
                Ajoutez un document complémentaire à votre dossier (PDF, JPEG, PNG)
              </Text>
              <TouchableOpacity
                style={styles.modalUploadButton}
                onPress={handleUploadCustomDocument}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <>
                    <Upload color={colors.white} size={20} />
                    <Text style={styles.modalUploadButtonText}>Sélectionner un fichier</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...textStyles.body,
    color: colors.gray[600],
    marginTop: spacing[3],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
  },
  header: {
    marginBottom: spacing[4],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: 15,
    color: colors.gray[600],
    lineHeight: 22,
  },
  progressSection: {
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    marginBottom: spacing[4],
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  progressCount: {
    fontSize: 16,
    color: colors.gray[600],
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    padding: spacing[3],
    backgroundColor: colors.infoLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.info + '40',
    marginBottom: spacing[5],
  },
  infoText: {
    flex: 1,
    ...textStyles.bodySmall,
    color: colors.infoDark,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: spacing[4],
    marginTop: spacing[2],
  },
  sectionSubtitle: {
    ...textStyles.body,
    color: colors.gray[600],
    marginBottom: spacing[3],
  },
  documentsList: {
    gap: spacing[0],
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    paddingVertical: spacing[5],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  uploadIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[50],
  },
  documentMainContent: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: spacing[1],
  },
  documentDesc: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
  },
  documentActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  downloadTemplateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.navy,
    minWidth: 120,
    justifyContent: 'center',
  },
  downloadTemplateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
  },
  uploadActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.navy,
    borderRadius: borderRadius.lg,
    minWidth: 140,
    justifyContent: 'center',
  },
  uploadActionButtonSuccess: {
    backgroundColor: colors.success,
  },
  uploadActionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  customSection: {
    marginTop: spacing[4],
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[3],
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[300],
    marginBottom: spacing[4],
  },
  addButtonText: {
    ...textStyles.label,
    color: colors.navy,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 500,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    ...textStyles.h3,
    color: colors.navy,
  },
  modalContent: {
    padding: spacing[4],
  },
  modalDescription: {
    ...textStyles.body,
    color: colors.gray[600],
    marginBottom: spacing[4],
    lineHeight: 20,
  },
  modalUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[3],
    backgroundColor: colors.navy,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  modalUploadButtonText: {
    ...textStyles.label,
    color: colors.white,
    fontWeight: '600',
  },
});
