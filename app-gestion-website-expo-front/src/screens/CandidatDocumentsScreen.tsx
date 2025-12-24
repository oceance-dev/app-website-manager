import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Upload, FileCheck, AlertCircle, CheckCircle2, X, Download, FileText } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { isWeb } from '../utils/responsive';

interface RequiredDocument {
  id: string;
  name: string;
  description: string;
  uploaded: boolean;
  fileName?: string;
  uploadDate?: string;
  fileUri?: string;
}

interface DownloadableForm {
  id: string;
  name: string;
  description: string;
  downloadUrl?: string;
  uploaded: boolean;
  fileName?: string;
  uploadDate?: string;
  fileUri?: string;
}

export default function CandidatDocumentsScreen() {
  const [isUploading, setIsUploading] = useState(false);
  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([
    {
      id: 'id_card',
      name: 'Pièce d\'identité',
      description: 'Carte d\'identité ou passeport en cours de validité',
      uploaded: false,
    },
    {
      id: 'photo',
      name: 'Photo d\'identité',
      description: 'Photo récente au format JPEG ou PNG',
      uploaded: false,
    },
    {
      id: 'medical_certificate',
      name: 'Certificat médical',
      description: 'Certificat médical d\'aptitude de moins de 3 mois',
      uploaded: false,
    },
  ]);

  const [downloadableForms, setDownloadableForms] = useState<DownloadableForm[]>([
    {
      id: 'parental_authorization',
      name: 'Autorisation parentale',
      description: 'Téléchargez le formulaire, faites-le signer par vos parents, puis uploadez-le',
      downloadUrl: '/forms/autorisation_parentale.pdf',
      uploaded: false,
    },
    {
      id: 'inscription_form',
      name: 'Formulaire d\'inscription',
      description: 'Formulaire d\'inscription à compléter et signer',
      downloadUrl: '/forms/formulaire_inscription.pdf',
      uploaded: false,
    },
    {
      id: 'engagement_form',
      name: 'Charte d\'engagement',
      description: 'Charte d\'engagement à lire et signer',
      downloadUrl: '/forms/charte_engagement.pdf',
      uploaded: false,
    },
    {
      id: 'health_form',
      name: 'Fiche sanitaire',
      description: 'Fiche sanitaire de liaison à compléter',
      downloadUrl: '/forms/fiche_sanitaire.pdf',
      uploaded: false,
    },
  ]);

  const handleUploadDocument = async (documentId: string) => {
    try {
      setIsUploading(true);

      // Sélectionner le document
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsUploading(false);
        return;
      }

      const file = result.assets[0];

      // TODO: Implémenter l'upload vers le backend
      // await uploadDocumentToAPI(documentId, file);

      // Simuler un upload réussi
      setTimeout(() => {
        setRequiredDocuments(
          requiredDocuments.map((doc) =>
            doc.id === documentId
              ? {
                  ...doc,
                  uploaded: true,
                  fileName: file.name,
                  uploadDate: new Date().toISOString(),
                  fileUri: file.uri,
                }
              : doc
          )
        );

        setIsUploading(false);

        if (isWeb) {
          alert(`Document "${file.name}" uploadé avec succès`);
        } else {
          Alert.alert('Succès', `Document "${file.name}" uploadé avec succès`);
        }
      }, 1000);
    } catch (error) {
      console.error('Error uploading document:', error);
      setIsUploading(false);

      if (isWeb) {
        alert('Erreur lors de l\'upload du document');
      } else {
        Alert.alert('Erreur', 'Erreur lors de l\'upload du document');
      }
    }
  };

  const handleUploadForm = async (formId: string) => {
    try {
      setIsUploading(true);

      // Sélectionner le formulaire complété
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsUploading(false);
        return;
      }

      const file = result.assets[0];

      // TODO: Implémenter l'upload vers le backend
      // await uploadFormToAPI(formId, file);

      // Simuler un upload réussi
      setTimeout(() => {
        setDownloadableForms(
          downloadableForms.map((form) =>
            form.id === formId
              ? {
                  ...form,
                  uploaded: true,
                  fileName: file.name,
                  uploadDate: new Date().toISOString(),
                  fileUri: file.uri,
                }
              : form
          )
        );

        setIsUploading(false);

        if (isWeb) {
          alert(`Formulaire "${file.name}" uploadé avec succès`);
        } else {
          Alert.alert('Succès', `Formulaire "${file.name}" uploadé avec succès`);
        }
      }, 1000);
    } catch (error) {
      console.error('Error uploading form:', error);
      setIsUploading(false);

      if (isWeb) {
        alert('Erreur lors de l\'upload du formulaire');
      } else {
        Alert.alert('Erreur', 'Erreur lors de l\'upload du formulaire');
      }
    }
  };

  const handleDownloadForm = (form: DownloadableForm) => {
    // TODO: Implémenter le téléchargement réel
    if (isWeb) {
      alert(`Téléchargement de ${form.name}...\nCe formulaire sera bientôt disponible.`);
    } else {
      Alert.alert(
        'Téléchargement',
        `${form.name}\nCe formulaire sera bientôt disponible.`
      );
    }

    // Pour le moment, on simule
    // Dans une vraie app, vous feriez :
    // if (form.downloadUrl) {
    //   Linking.openURL(form.downloadUrl);
    // }
  };

  const handleDeleteDocument = (documentId: string) => {
    const confirmDelete = () => {
      setRequiredDocuments(
        requiredDocuments.map((doc) =>
          doc.id === documentId
            ? {
                ...doc,
                uploaded: false,
                fileName: undefined,
                uploadDate: undefined,
                fileUri: undefined,
              }
            : doc
        )
      );

      if (isWeb) {
        alert('Document supprimé');
      } else {
        Alert.alert('Succès', 'Document supprimé');
      }
    };

    if (isWeb) {
      if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
        confirmDelete();
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

  const handleDeleteForm = (formId: string) => {
    const confirmDelete = () => {
      setDownloadableForms(
        downloadableForms.map((form) =>
          form.id === formId
            ? {
                ...form,
                uploaded: false,
                fileName: undefined,
                uploadDate: undefined,
                fileUri: undefined,
              }
            : form
        )
      );

      if (isWeb) {
        alert('Formulaire supprimé');
      } else {
        Alert.alert('Succès', 'Formulaire supprimé');
      }
    };

    if (isWeb) {
      if (confirm('Êtes-vous sûr de vouloir supprimer ce formulaire ?')) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Confirmation',
        'Êtes-vous sûr de vouloir supprimer ce formulaire ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Supprimer', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  const uploadedDocsCount = requiredDocuments.filter((doc) => doc.uploaded).length;
  const totalDocsCount = requiredDocuments.length;
  const uploadedFormsCount = downloadableForms.filter((form) => form.uploaded).length;
  const totalFormsCount = downloadableForms.length;
  const totalUploadedCount = uploadedDocsCount + uploadedFormsCount;
  const totalCount = totalDocsCount + totalFormsCount;
  const allUploaded = totalUploadedCount === totalCount;
  const progress = (totalUploadedCount / totalCount) * 100;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Documents requis</Text>
              <Text style={styles.subtitle}>
                Téléchargez les documents et formulaires nécessaires pour valider votre inscription
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Progression</Text>
              <Text style={styles.progressText}>
                {totalUploadedCount} / {totalCount} documents
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            {allUploaded && (
              <View style={styles.successMessage}>
                <CheckCircle2 color="#10b981" size={20} />
                <Text style={styles.successMessageText}>
                  Tous les documents ont été téléchargés ! Votre demande sera examinée prochainement.
                </Text>
              </View>
            )}
          </View>

          {/* Information */}
          <View style={styles.infoSection}>
            <AlertCircle color="#2563eb" size={20} />
            <Text style={styles.infoText}>
              Assurez-vous que vos documents sont lisibles et à jour. Les formats acceptés sont PDF, JPEG et PNG.
            </Text>
          </View>

          {/* Documents à fournir */}
          <View style={styles.sectionHeader}>
            <FileCheck color="#1e293b" size={24} />
            <Text style={styles.sectionTitle}>Documents à fournir</Text>
          </View>
          <View style={styles.documentsList}>
            {requiredDocuments.map((doc) => (
              <View key={doc.id} style={styles.documentCard}>
                <View style={styles.documentHeader}>
                  <View style={styles.documentIconContainer}>
                    {doc.uploaded ? (
                      <FileCheck color="#10b981" size={24} />
                    ) : (
                      <Upload color="#64748b" size={24} />
                    )}
                  </View>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentName}>{doc.name}</Text>
                    <Text style={styles.documentDescription}>{doc.description}</Text>
                    {doc.uploaded && doc.fileName && (
                      <View style={styles.uploadedInfo}>
                        <Text style={styles.uploadedFileName}>{doc.fileName}</Text>
                        <Text style={styles.uploadedDate}>
                          {new Date(doc.uploadDate!).toLocaleDateString('fr-FR')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.documentActions}>
                  {doc.uploaded ? (
                    <>
                      <View style={styles.statusBadge}>
                        <CheckCircle2 color="#10b981" size={16} />
                        <Text style={styles.statusBadgeText}>Envoyé</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteDocument(doc.id)}
                        disabled={isUploading}
                      >
                        <X color="#ef4444" size={20} />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={() => handleUploadDocument(doc.id)}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Upload color="#fff" size={18} />
                          <Text style={styles.uploadButtonText}>Télécharger</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Formulaires à compléter */}
          <View style={[styles.sectionHeader, { marginTop: 32 }]}>
            <FileText color="#1e293b" size={24} />
            <Text style={styles.sectionTitle}>Formulaires à compléter</Text>
          </View>
          <View style={styles.formsHelpSection}>
            <Text style={styles.formsHelpText}>
              📥 Téléchargez chaque formulaire, complétez-le, puis uploadez-le une fois rempli et signé.
            </Text>
          </View>
          <View style={styles.documentsList}>
            {downloadableForms.map((form) => (
              <View key={form.id} style={styles.documentCard}>
                <View style={styles.documentHeader}>
                  <View style={styles.documentIconContainer}>
                    {form.uploaded ? (
                      <FileCheck color="#10b981" size={24} />
                    ) : (
                      <FileText color="#64748b" size={24} />
                    )}
                  </View>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentName}>{form.name}</Text>
                    <Text style={styles.documentDescription}>{form.description}</Text>
                    {form.uploaded && form.fileName && (
                      <View style={styles.uploadedInfo}>
                        <Text style={styles.uploadedFileName}>{form.fileName}</Text>
                        <Text style={styles.uploadedDate}>
                          {new Date(form.uploadDate!).toLocaleDateString('fr-FR')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.documentActions}>
                  {!form.uploaded && (
                    <TouchableOpacity
                      style={styles.downloadFormButton}
                      onPress={() => handleDownloadForm(form)}
                    >
                      <Download color="#2563eb" size={18} />
                      <Text style={styles.downloadFormButtonText}>Télécharger</Text>
                    </TouchableOpacity>
                  )}
                  {form.uploaded ? (
                    <>
                      <View style={styles.statusBadge}>
                        <CheckCircle2 color="#10b981" size={16} />
                        <Text style={styles.statusBadgeText}>Envoyé</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteForm(form.id)}
                        disabled={isUploading}
                      >
                        <X color="#ef4444" size={20} />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={() => handleUploadForm(form.id)}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Upload color="#fff" size={18} />
                          <Text style={styles.uploadButtonText}>Envoyer</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Help Section */}
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>Besoin d'aide ?</Text>
            <Text style={styles.helpText}>
              Si vous rencontrez des difficultés pour télécharger vos documents, contactez-nous à{' '}
              <Text style={styles.helpEmail}>contact@cadet-somme.fr</Text>
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
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
    lineHeight: 20,
  },
  progressSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  successMessageText: {
    flex: 1,
    fontSize: 14,
    color: '#047857',
    fontWeight: '500',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  formsHelpSection: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  formsHelpText: {
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },
  documentsList: {
    gap: 16,
  },
  documentCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  documentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  documentDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  uploadedInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#dcfce7',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  uploadedFileName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#047857',
    marginBottom: 2,
  },
  uploadedDate: {
    fontSize: 12,
    color: '#059669',
  },
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#d1fae5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#047857',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  downloadFormButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  downloadFormButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  helpSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  helpEmail: {
    color: '#2563eb',
    fontWeight: '600',
  },
});
