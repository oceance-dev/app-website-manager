import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextStyle } from 'react-native';
import { Candidate } from '@/src/features/association/hooks/useCandidates';
import { Card, Badge } from '@/src/components/cadep';
import { colors, textStyles, spacing, borderRadius } from '@/src/theme';
import { Calendar, FileText, Mail, Phone } from 'lucide-react-native';

interface CandidateCardProps {
  candidate: Candidate;
  onPress: () => void;
}

type BadgeVariant = 'active' | 'pending' | 'inactive';

const getStatusConfig = (status: string): { label: string; variant: BadgeVariant } => {
  switch (status) {
    case 'pending':
      return { label: 'En attente', variant: 'pending' };
    case 'validated':
      return { label: 'Validée', variant: 'active' };
    case 'rejected':
      return { label: 'Refusée', variant: 'inactive' };
    case 'appointment_scheduled':
      return { label: 'RDV programmé', variant: 'pending' };
    default:
      return { label: 'Inconnu', variant: 'inactive' };
  }
};

export const CandidateCard = ({ candidate, onPress }: CandidateCardProps) => {
  const statusConfig = getStatusConfig(candidate.status);

  const docsProgress =
    candidate.documentsRequired > 0
      ? (candidate.documentsUploaded / candidate.documentsRequired) * 100
      : 0;

  const getDocsColor = () => {
    if (docsProgress === 100) return colors.success;
    if (docsProgress >= 50) return colors.warning;
    return colors.error;
  };

  return (
    <Card style={styles.card}>
      <TouchableOpacity onPress={onPress}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>
            {candidate.firstname} {candidate.lastname}
          </Text>
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
        </View>

        {/* Détails */}
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Mail color={colors.gray[500]} size={14} />
            <Text style={styles.detailText} numberOfLines={1}>
              {candidate.email}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Phone color={colors.gray[500]} size={14} />
            <Text style={styles.detailText}>{candidate.phone}</Text>
          </View>

          <View style={styles.detailRow}>
            <Calendar color={colors.gray[500]} size={14} />
            <Text style={styles.detailText}>
              Demande du {candidate.requestDate}
            </Text>
          </View>
        </View>

        {/* Documents */}
        <View style={styles.docsSection}>
          <View style={styles.docsHeader}>
            <View style={styles.docsLabel}>
              <FileText color={getDocsColor()} size={14} />
              <Text style={styles.docsText}>
                Documents: {candidate.documentsUploaded}/{candidate.documentsRequired}
              </Text>
            </View>
            <Text style={[styles.docsPercent, { color: getDocsColor() }]}>
              {Math.round(docsProgress)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${docsProgress}%`,
                  backgroundColor: getDocsColor(),
                },
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  name: {
    ...textStyles.h4,
    color: colors.navy,
    flex: 1,
    marginRight: spacing[2],
  } as TextStyle,
  details: {
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  detailText: {
    ...textStyles.body,
    color: colors.gray[600],
    flex: 1,
  } as TextStyle,
  docsSection: {
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  docsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  docsLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  docsText: {
    ...textStyles.caption,
    color: colors.gray[600],
  } as TextStyle,
  docsPercent: {
    ...textStyles.caption,
    fontWeight: '600',
  } as TextStyle,
  progressBar: {
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
});
