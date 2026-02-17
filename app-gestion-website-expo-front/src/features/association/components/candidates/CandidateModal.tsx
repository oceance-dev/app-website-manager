import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TextStyle,
  TouchableOpacity,
  ScrollView,
  Modal as RNModal,
  useWindowDimensions,
} from 'react-native';
import { Candidate } from '@/src/features/association/hooks/useCandidates';
import { isWeb } from '@/src/utils/responsive';
import {
  X,
  Mail,
  Phone,
  Calendar,
  MapPin,
  User,
  FileText,
  GraduationCap,
  Users,
  Clock,
  Check,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows } from '@/src/theme';
import { CandidateDocuments } from './CandidateDocuments';

interface CandidateModalProps {
  visible: boolean;
  candidate: Candidate;
  onClose: () => void;
  onValidate: (candidateId: number) => Promise<void>;
  onReject: (candidateId: number) => Promise<void>;
}

const BREAKPOINT_TABLET = 768;

export const CandidateModal: React.FC<CandidateModalProps> = ({
  visible,
  candidate,
  onClose,
  onValidate,
  onReject,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT_TABLET;

  const handleValidate = useCallback(() => {
    const message = `Êtes-vous sûr de vouloir approuver la candidature de ${candidate.firstname} ${candidate.lastname} ?`;

    if (isWeb) {
      if (confirm(message)) {
        onValidate(candidate.id);
      }
    } else {
      Alert.alert('Approuver la candidature', message, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Approuver', onPress: () => onValidate(candidate.id) },
      ]);
    }
  }, [candidate, onValidate]);

  const handleReject = useCallback(() => {
    const message = `Êtes-vous sûr de vouloir refuser la candidature de ${candidate.firstname} ${candidate.lastname} ?`;

    if (isWeb) {
      if (confirm(message)) {
        onReject(candidate.id);
      }
    } else {
      Alert.alert('Refuser la candidature', message, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Refuser', style: 'destructive', onPress: () => onReject(candidate.id) },
      ]);
    }
  }, [candidate, onReject]);

  const docsProgress = useMemo(() => {
    if (candidate.documentsRequired <= 0) return 0;
    return (candidate.documentsUploaded / candidate.documentsRequired) * 100;
  }, [candidate.documentsUploaded, candidate.documentsRequired]);

  const initials = useMemo(() => {
    return `${candidate.firstname.charAt(0)}${candidate.lastname.charAt(0)}`.toUpperCase();
  }, [candidate.firstname, candidate.lastname]);

  const fullName = `${candidate.firstname} ${candidate.lastname}`;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={isDesktop ? 'fade' : 'slide'}
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, isDesktop && styles.backdropCentered]}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.modalContainer, isDesktop && styles.modalContainerDesktop]}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X color={colors.gray[400]} size={20} />
          </TouchableOpacity>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.headerName}>{fullName}</Text>
                <View style={styles.headerBadges}>
                  <View style={styles.badgePending}>
                    <Clock color={colors.warningDark} size={12} />
                    <Text style={styles.badgePendingText}>En attente de validation</Text>
                  </View>
                  <View style={styles.badgeOutline}>
                    <Text style={styles.badgeOutlineText}>Mineur</Text>
                  </View>
                </View>
                <Text style={styles.headerDate}>
                  Candidature soumise le {candidate.requestDate}
                </Text>
              </View>
            </View>

            {/* Informations personnelles */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <User color={colors.navy} size={16} />
                <Text style={styles.sectionTitle}>Informations personnelles</Text>
              </View>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoCell}>
                    <Mail color={colors.gray[400]} size={16} />
                    <View style={styles.infoCellContent}>
                      <Text style={styles.infoLabel}>Email</Text>
                      <Text style={styles.infoValue}>{candidate.email}</Text>
                    </View>
                  </View>
                  <View style={styles.infoCell}>
                    <Phone color={colors.gray[400]} size={16} />
                    <View style={styles.infoCellContent}>
                      <Text style={styles.infoLabel}>Téléphone</Text>
                      <Text style={styles.infoValue}>{candidate.phone}</Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.infoRow, styles.infoRowLast]}>
                  <View style={styles.infoCell}>
                    <Calendar color={colors.gray[400]} size={16} />
                    <View style={styles.infoCellContent}>
                      <Text style={styles.infoLabel}>Date de naissance</Text>
                      <Text style={styles.infoValue}>
                        {candidate.dateOfBirth || 'Non renseignée'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.infoCell}>
                    <MapPin color={colors.gray[400]} size={16} />
                    <View style={styles.infoCellContent}>
                      <Text style={styles.infoLabel}>Adresse</Text>
                      <Text style={styles.infoValue}>
                        {candidate.postalCode || 'Non renseignée'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Scolarité */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <GraduationCap color={colors.navy} size={16} />
                <Text style={styles.sectionTitle}>Scolarité</Text>
              </View>
              <View style={styles.infoCard}>
                <View style={[styles.infoRow, styles.infoRowLast]}>
                  <View style={styles.infoCellSimple}>
                    <Text style={styles.infoLabel}>Établissement</Text>
                    <Text style={styles.infoValue}>Non renseigné</Text>
                  </View>
                  <View style={styles.infoCellSimple}>
                    <Text style={styles.infoLabel}>Niveau</Text>
                    <Text style={styles.infoValue}>Non renseigné</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Responsable légal */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Users color={colors.navy} size={16} />
                <Text style={styles.sectionTitle}>Responsable légal</Text>
              </View>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoCellSimple}>
                    <Text style={styles.infoLabel}>Nom</Text>
                    <Text style={styles.infoValue}>Non renseigné</Text>
                  </View>
                  <View style={styles.infoCell}>
                    <Mail color={colors.gray[400]} size={16} />
                    <View style={styles.infoCellContent}>
                      <Text style={styles.infoLabel}>Email</Text>
                      <Text style={styles.infoValue}>Non renseigné</Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.infoRow, styles.infoRowLast]}>
                  <View style={styles.infoCell}>
                    <Phone color={colors.gray[400]} size={16} />
                    <View style={styles.infoCellContent}>
                      <Text style={styles.infoLabel}>Téléphone</Text>
                      <Text style={styles.infoValue}>Non renseigné</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Dossier de candidature */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <FileText color={colors.navy} size={16} />
                <Text style={styles.sectionTitle}>Dossier de candidature</Text>
                <Text style={styles.docsCount}>
                  {candidate.documentsUploaded}/{candidate.documentsRequired} documents validés
                </Text>
              </View>

              {/* Progress bar */}
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${docsProgress}%` },
                  ]}
                />
              </View>

              {/* Documents list */}
              <CandidateDocuments candidateId={candidate.id} />
            </View>
          </ScrollView>

          {/* Footer buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.btnClose} onPress={onClose}>
              <Text style={styles.btnCloseText}>Fermer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnReject} onPress={handleReject}>
              <X color={colors.error} size={16} />
              <Text style={styles.btnRejectText}>Refuser</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnApprove} onPress={handleValidate}>
              <Check color={colors.white} size={16} />
              <Text style={styles.btnApproveText}>Approuver</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  backdropCentered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: '92%',
    ...shadows.xl,
  },
  modalContainerDesktop: {
    width: '90%',
    maxWidth: 650,
    borderRadius: borderRadius['2xl'],
    maxHeight: '90%',
  },
  closeButton: {
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[5],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[5],
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[500],
  } as TextStyle,
  headerInfo: {
    flex: 1,
    paddingRight: spacing[6],
  },
  headerName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: spacing[2],
  } as TextStyle,
  headerBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  badgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  badgePendingText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.warningDark,
  } as TextStyle,
  badgeOutline: {
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  badgeOutlineText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.gray[600],
  } as TextStyle,
  headerDate: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: spacing[1],
  } as TextStyle,

  // Section
  section: {
    marginBottom: spacing[5],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
    flex: 1,
  } as TextStyle,
  docsCount: {
    fontSize: 12,
    color: colors.gray[500],
  } as TextStyle,

  // Info card
  infoCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: spacing[4],
  },
  infoRowLast: {
    marginBottom: 0,
  },
  infoCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  infoCellContent: {
    flex: 1,
  },
  infoCellSimple: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 2,
  } as TextStyle,
  infoValue: {
    fontSize: 14,
    color: colors.navy,
    fontWeight: '500',
  } as TextStyle,

  // Progress bar
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    marginBottom: spacing[4],
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: borderRadius.full,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btnClose: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCloseText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.navy,
  } as TextStyle,
  btnReject: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRejectText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.error,
  } as TextStyle,
  btnApprove: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.full,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnApproveText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.white,
  } as TextStyle,
});
