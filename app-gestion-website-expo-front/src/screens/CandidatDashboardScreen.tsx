import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { FileText, Upload, CheckCircle2, AlertCircle, User, Mail, Phone, MapPin, Calendar, Loader2 } from 'lucide-react-native';
import { AuthApi, AuthUser, CandidatsApi } from '../api';
import { isWeb, isMobile, getFontSize, getResponsivePadding, getSpacing } from '../utils/responsive';
import { Button } from '../components/ui/button';
import Toast, { ToastType } from '../components/ui/Toast';
import { colors, textStyles, spacing, shadows, borderRadius } from '../theme';
import { Card, StatCard, Badge } from '../components/cadep';

interface CandidatDashboardProps {
  onNavigateToDocuments: () => void;
  onLogout: () => void;
}

export default function CandidatDashboardScreen({ onNavigateToDocuments, onLogout }: CandidatDashboardProps) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [completion, setCompletion] = useState<any>(null);
  const [loadingCompletion, setLoadingCompletion] = useState(true);
  const [canSubmit, setCanSubmit] = useState<boolean>(false);

  // États pour le toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

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

  // Charger les informations de l'utilisateur
  const fetchUserData = async () => {
    try {
      const response = await AuthApi.getMe();
      if (response.success && response.data) {
        setCurrentUser(response.data.user);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      showErrorToast('Erreur lors du chargement de vos informations');
    } finally {
      setLoadingUser(false);
    }
  };

  // Charger les documents du candidat
  const fetchDocumentsCount = async () => {
    try {
      const response = await CandidatsApi.getMyDocuments();
      if (response.success && response.data) {
        setDocumentsCount(response.data.documents.length);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Charger la complétion du dossier
  const fetchCompletion = async () => {
    try {
      const response = await CandidatsApi.getCompletion();
      if (response.success && response.data) {
        setCompletion(response.data);
      }
    } catch (error) {
      console.error('Error fetching completion:', error);
    } finally {
      setLoadingCompletion(false);
    }
  };

  // Vérifier si le candidat peut soumettre
  const checkCanSubmit = async () => {
    try {
      const response = await CandidatsApi.canSubmit();
      if (response.success && response.data) {
        setCanSubmit(response.data.canSubmit);
      }
    } catch (error) {
      console.error('Error checking can submit:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUserData(), fetchDocumentsCount(), fetchCompletion(), checkCanSubmit()]);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchUserData();
    fetchDocumentsCount();
    fetchCompletion();
    checkCanSubmit();
  }, []);

  if (loadingUser) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.navy} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const displayName = currentUser?.firstname && currentUser?.lastname
    ? `${currentUser.firstname} ${currentUser.lastname}`
    : currentUser?.email || 'Candidat';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header avec informations utilisateur */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <User color={colors.white} size={40} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.welcomeText}>Bienvenue,</Text>
              <Text style={styles.userName}>{displayName}</Text>
              <Badge text="Candidat" variant="pending" />
            </View>
          </View>
        </View>

        {/* Informations personnelles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes informations</Text>
          <Card>
            {currentUser?.email && (
              <View style={styles.infoRow}>
                <Mail color={colors.gray[600]} size={20} />
                <Text style={styles.infoText}>{currentUser.email}</Text>
              </View>
            )}
            {currentUser?.phone && (
              <View style={styles.infoRow}>
                <Phone color={colors.gray[600]} size={20} />
                <Text style={styles.infoText}>{currentUser.phone}</Text>
              </View>
            )}
          </Card>
        </View>

        {/* Statut de la candidature */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statut de ma candidature</Text>
          {loadingCompletion ? (
            <Card>
              <View style={[styles.statusHeader, { justifyContent: 'center' }]}>
                <ActivityIndicator size="small" color={colors.navy} />
                <Text style={styles.loadingText}>Chargement...</Text>
              </View>
            </Card>
          ) : completion ? (
            <Card style={[styles.statusCard, completion.completionRate === 100 ? { backgroundColor: colors.successLight, borderColor: colors.success + '40' } : {}]}>
              <View style={styles.statusHeader}>
                {completion.completionRate === 100 ? (
                  <CheckCircle2 color={colors.success} size={32} />
                ) : (
                  <AlertCircle color={colors.warning} size={32} />
                )}
                <View style={styles.statusInfo}>
                  <Text style={[styles.statusTitle, completion.completionRate === 100 ? { color: colors.success } : {}]}>
                    {completion.completionRate === 100 ? 'Dossier complet !' : 'Dossier incomplet'}
                  </Text>
                  <Text style={[styles.statusDescription, completion.completionRate === 100 ? { color: colors.success } : {}]}>
                    {completion.totalCompleted} / {completion.totalRequired} documents fournis ({completion.completionRate}%)
                  </Text>
                </View>
              </View>

              {/* Barre de progression */}
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${completion.completionRate}%`, backgroundColor: completion.completionRate === 100 ? colors.success : colors.warning }]} />
              </View>

              {/* Documents manquants */}
              {completion.missingDocuments && completion.missingDocuments.length > 0 && (
                <View style={styles.missingDocumentsContainer}>
                  <Text style={styles.missingDocumentsTitle}>Documents manquants :</Text>
                  {completion.missingDocuments.slice(0, 3).map((doc: any, index: number) => (
                    <View key={index} style={styles.missingDocumentRow}>
                      <AlertCircle color={colors.error} size={16} />
                      <Text style={styles.missingDocumentText}>{doc.name || doc.documentType?.name}</Text>
                    </View>
                  ))}
                  {completion.missingDocuments.length > 3 && (
                    <Text style={styles.moreDocumentsText}>
                      ... et {completion.missingDocuments.length - 3} autre(s)
                    </Text>
                  )}
                </View>
              )}
            </Card>
          ) : (
            <Card style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <AlertCircle color={colors.warning} size={32} />
                <View style={styles.statusInfo}>
                  <Text style={styles.statusTitle}>En attente de validation</Text>
                  <Text style={styles.statusDescription}>
                    Votre dossier est en cours de traitement par nos équipes
                  </Text>
                </View>
              </View>
            </Card>
          )}
        </View>

        {/* Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes documents</Text>
          <Card>
            <TouchableOpacity onPress={onNavigateToDocuments}>
              <View style={styles.documentsHeader}>
                <FileText color={colors.navy} size={32} />
                <View style={styles.documentsInfo}>
                  <Text style={styles.documentsCount}>
                    {loadingDocuments ? '...' : documentsCount} document{documentsCount !== 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.documentsDescription}>
                    Téléchargez et gérez vos documents requis
                  </Text>
                </View>
              </View>
              <View style={styles.documentsAction}>
                <Text style={styles.actionText}>Gérer mes documents</Text>
              </View>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Actions rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.uploadButton]}
            onPress={onNavigateToDocuments}
          >
            <Upload color={colors.white} size={20} />
            <Text style={styles.actionButtonText}>Ajouter un document</Text>
          </TouchableOpacity>
        </View>

        {/* Bouton de déconnexion */}
        <View style={styles.section}>
          <Button
            variant="outline"
            onPress={onLogout}
          >
            Déconnexion
          </Button>
        </View>
      </ScrollView>

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
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing[4],
    ...textStyles.body,
    color: colors.gray[600],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: getResponsivePadding(),
  },
  header: {
    backgroundColor: colors.navy,
    borderRadius: borderRadius.xl,
    padding: getResponsivePadding(),
    marginBottom: spacing[6],
    ...shadows.lg,
  },
  headerContent: {
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'center' : 'flex-start',
    gap: spacing[4],
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gold + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: isMobile ? 'center' : 'flex-start',
    gap: spacing[2],
  },
  welcomeText: {
    ...textStyles.body,
    color: colors.white + 'E6',
    marginBottom: spacing[1],
  },
  userName: {
    ...textStyles.h1,
    color: colors.white,
    marginBottom: spacing[2],
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    ...textStyles.h3,
    color: colors.navy,
    marginBottom: spacing[3],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  infoText: {
    flex: 1,
    ...textStyles.body,
    color: colors.navy,
  },
  statusCard: {
    backgroundColor: colors.warningLight,
    borderWidth: 2,
    borderColor: colors.warning + '40',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    ...textStyles.h4,
    color: colors.warning,
    marginBottom: spacing[1],
  },
  statusDescription: {
    ...textStyles.body,
    color: colors.warning,
    lineHeight: 20,
  },
  documentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginBottom: spacing[3],
  },
  documentsInfo: {
    flex: 1,
  },
  documentsCount: {
    ...textStyles.h3,
    color: colors.navy,
    marginBottom: spacing[1],
  },
  documentsDescription: {
    ...textStyles.body,
    color: colors.gray[600],
  },
  documentsAction: {
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  actionText: {
    ...textStyles.label,
    fontWeight: '600',
    color: colors.navy,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  uploadButton: {
    backgroundColor: colors.navy,
  },
  actionButtonText: {
    ...textStyles.h4,
    color: colors.white,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginTop: spacing[4],
  },
  progressBar: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  missingDocumentsContainer: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  missingDocumentsTitle: {
    ...textStyles.label,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing[2],
  },
  missingDocumentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
  },
  missingDocumentText: {
    ...textStyles.body,
    color: colors.gray[700],
  },
  moreDocumentsText: {
    ...textStyles.bodySmall,
    color: colors.gray[600],
    marginTop: spacing[2],
    fontStyle: 'italic',
  },
});
