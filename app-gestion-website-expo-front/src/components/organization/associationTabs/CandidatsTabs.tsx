import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, useWindowDimensions, TextStyle } from 'react-native';
import {
  Candidate,
  useCandidates,
} from '@/src/features/association/hooks/useCandidates';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { ErrorMessage } from '../../ui/ErrorMessage';
import { CandidateModal } from '../../../features/association/components/candidates/CandidateModal';
import { Card, Badge } from '@/src/components/cadep';
import { colors, textStyles, spacing, borderRadius } from '@/src/theme';
import { Search, Mail, Phone, MoreHorizontal, Clock, CheckCircle } from 'lucide-react-native';

const BREAKPOINT_TABLET = 768;

export const CandidatesTab = () => {
  const {
    candidates,
    loading,
    error,
    validateCandidate,
    rejectCandidate,
    refetch,
  } = useCandidates();

  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT_TABLET;

  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrer les candidatures
  const filteredCandidates = useMemo(() => {
    let filtered = candidates;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.firstname.toLowerCase().includes(query) ||
          c.lastname.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [candidates, searchQuery]);

  const handleViewCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCandidate(null);
  };

  const handleValidate = async (candidateId: number) => {
    const success = await validateCandidate(candidateId);
    if (success) {
      handleCloseModal();
    }
  };

  const handleReject = async (candidateId: number) => {
    const success = await rejectCandidate(candidateId);
    if (success) {
      handleCloseModal();
    }
  };

  if (loading) {
    return <LoadingSpinner message="Chargement des candidatures..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch} />;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <View style={[styles.statusBadge, styles.statusPending]}>
            <Clock color={colors.warningDark} size={12} />
            <Text style={[styles.statusText, { color: colors.warningDark }]}>En attente</Text>
          </View>
        );
      case 'validated':
        return (
          <View style={[styles.statusBadge, styles.statusApproved]}>
            <CheckCircle color={colors.successDark} size={12} />
            <Text style={[styles.statusText, { color: colors.successDark }]}>Approuvé</Text>
          </View>
        );
      case 'rejected':
        return (
          <View style={[styles.statusBadge, styles.statusRejected]}>
            <Text style={[styles.statusText, { color: colors.gray[600] }]}>Refusé</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const renderDocsBadge = (uploaded: number, required: number) => {
    const isComplete = uploaded >= required;
    if (isComplete) {
      return (
        <View style={styles.docsBadgeComplete}>
          <Text style={styles.docsBadgeCompleteText}>{uploaded}/{required}</Text>
        </View>
      );
    }
    return <Text style={styles.docsText}>{uploaded}/{required}</Text>;
  };

  return (
    <View style={styles.container}>
      <Card>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Candidatures des futurs cadets</Text>
            <Text style={styles.subtitle}>
              Gérez les inscriptions des candidats souhaitant devenir cadets
            </Text>
          </View>
          <View style={styles.searchContainer}>
            <Search color={colors.gray[400]} size={16} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher..."
              placeholderTextColor={colors.gray[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Table Header - Desktop only */}
        {isDesktop && (
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colCandidat]}>Candidat</Text>
            <Text style={[styles.tableHeaderText, styles.colContact]}>Contact</Text>
            <Text style={[styles.tableHeaderText, styles.colDate]}>Date de naissance</Text>
            <Text style={[styles.tableHeaderText, styles.colDocs]}>Documents</Text>
            <Text style={[styles.tableHeaderText, styles.colStatus]}>Statut</Text>
            <Text style={[styles.tableHeaderText, styles.colActions]}>Actions</Text>
          </View>
        )}

        {/* Table Body */}
        {filteredCandidates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune candidature trouvée</Text>
          </View>
        ) : (
          filteredCandidates.map((candidate, index) => (
            <TouchableOpacity
              key={candidate.id}
              style={[
                styles.tableRow,
                index === filteredCandidates.length - 1 && styles.tableRowLast,
              ]}
              onPress={() => handleViewCandidate(candidate)}
              activeOpacity={0.7}
            >
              {isDesktop ? (
                // Desktop: Table layout
                <>
                  <View style={styles.colCandidat}>
                    <Text style={styles.candidateName}>
                      {candidate.firstname} {candidate.lastname}
                    </Text>
                    <Text style={styles.candidateDate}>
                      Soumis le {candidate.requestDate}
                    </Text>
                  </View>
                  <View style={styles.colContact}>
                    <View style={styles.contactRow}>
                      <Mail color={colors.gray[500]} size={14} />
                      <Text style={styles.contactText}>{candidate.email}</Text>
                    </View>
                    <View style={styles.contactRow}>
                      <Phone color={colors.gray[500]} size={14} />
                      <Text style={styles.contactText}>{candidate.phone}</Text>
                    </View>
                  </View>
                  <View style={styles.colDate}>
                    <Text style={styles.dateText}>
                      {candidate.dateOfBirth || '-'}
                    </Text>
                  </View>
                  <View style={styles.colDocs}>
                    {renderDocsBadge(candidate.documentsUploaded, candidate.documentsRequired)}
                  </View>
                  <View style={styles.colStatus}>
                    {getStatusBadge(candidate.status)}
                  </View>
                  <View style={styles.colActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleViewCandidate(candidate)}
                    >
                      <MoreHorizontal color={colors.gray[500]} size={20} />
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                // Mobile: Card-like layout
                <View style={styles.mobileRow}>
                  <View style={styles.mobileHeader}>
                    <View>
                      <Text style={styles.candidateName}>
                        {candidate.firstname} {candidate.lastname}
                      </Text>
                      <Text style={styles.candidateDate}>
                        Soumis le {candidate.requestDate}
                      </Text>
                    </View>
                    {getStatusBadge(candidate.status)}
                  </View>
                  <View style={styles.mobileDetails}>
                    <View style={styles.contactRow}>
                      <Mail color={colors.gray[500]} size={14} />
                      <Text style={styles.contactText}>{candidate.email}</Text>
                    </View>
                    <View style={styles.contactRow}>
                      <Phone color={colors.gray[500]} size={14} />
                      <Text style={styles.contactText}>{candidate.phone}</Text>
                    </View>
                  </View>
                  <View style={styles.mobileFooter}>
                    <Text style={styles.mobileLabel}>Documents: </Text>
                    {renderDocsBadge(candidate.documentsUploaded, candidate.documentsRequired)}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </Card>

      {selectedCandidate && (
        <CandidateModal
          visible={showModal}
          candidate={selectedCandidate}
          onClose={handleCloseModal}
          onValidate={handleValidate}
          onReject={handleReject}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[6],
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  headerLeft: {
    flex: 1,
    minWidth: 200,
  },
  title: {
    ...textStyles.h2,
    color: colors.foreground,
    marginBottom: spacing[1],
  } as TextStyle,
  subtitle: {
    ...textStyles.body,
    color: colors.gray[600],
  } as TextStyle,
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    minWidth: 200,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing[2],
    ...textStyles.body,
    color: colors.foreground,
  } as TextStyle,

  // Table Header
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderText: {
    ...textStyles.caption,
    color: colors.gray[500],
    fontWeight: '500',
  } as TextStyle,

  // Columns
  colCandidat: { flex: 2, paddingRight: spacing[2] },
  colContact: { flex: 2, paddingRight: spacing[2] },
  colDate: { flex: 1.2, paddingRight: spacing[2] },
  colDocs: { flex: 1, paddingRight: spacing[2], alignItems: 'center' },
  colStatus: { flex: 1.2, paddingRight: spacing[2] },
  colActions: { width: 50, alignItems: 'center' },

  // Table Row
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },

  // Candidate info
  candidateName: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 2,
  } as TextStyle,
  candidateDate: {
    ...textStyles.caption,
    color: colors.gray[500],
  } as TextStyle,

  // Contact
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: 4,
  },
  contactText: {
    ...textStyles.body,
    color: colors.gray[600],
  } as TextStyle,

  // Date
  dateText: {
    ...textStyles.body,
    color: colors.foreground,
  } as TextStyle,

  // Documents
  docsText: {
    ...textStyles.body,
    color: colors.foreground,
  } as TextStyle,
  docsBadgeComplete: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  docsBadgeCompleteText: {
    ...textStyles.caption,
    color: colors.white,
    fontWeight: '600',
  } as TextStyle,

  // Status badges
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  statusPending: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warningLight,
  },
  statusApproved: {
    backgroundColor: colors.successLight,
    borderColor: colors.successLight,
  },
  statusRejected: {
    backgroundColor: colors.gray[100],
    borderColor: colors.gray[200],
  },
  statusText: {
    ...textStyles.caption,
    fontWeight: '500',
  } as TextStyle,

  // Actions
  actionButton: {
    padding: spacing[2],
  },

  // Empty state
  emptyContainer: {
    paddingVertical: spacing[10],
    alignItems: 'center',
  },
  emptyText: {
    ...textStyles.body,
    color: colors.gray[500],
  } as TextStyle,

  // Mobile styles
  mobileRow: {
    flex: 1,
  },
  mobileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  mobileDetails: {
    marginBottom: spacing[3],
  },
  mobileFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileLabel: {
    ...textStyles.caption,
    color: colors.gray[600],
  } as TextStyle,
});
