import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TextStyle } from 'react-native';
import { Candidate } from '@/src/features/association/hooks/useCandidates';
import { CandidateCard } from './CandidateCard';
import { colors, textStyles, spacing } from '@/src/theme';
import { FileX } from 'lucide-react-native';

interface CandidatesListProps {
  candidates: Candidate[];
  onViewCandidate: (candidate: Candidate) => void;
}

const BREAKPOINT_TABLET = 768;
const BREAKPOINT_DESKTOP = 1200;

export const CandidatesList = ({
  candidates,
  onViewCandidate,
}: CandidatesListProps) => {
  const { width } = useWindowDimensions();

  const isTablet = width >= BREAKPOINT_TABLET && width < BREAKPOINT_DESKTOP;
  const isDesktop = width >= BREAKPOINT_DESKTOP;

  if (candidates.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <FileX color={colors.gray[400]} size={48} />
        <Text style={styles.emptyTitle}>Aucune candidature</Text>
        <Text style={styles.emptyText}>
          Les nouvelles candidatures apparaîtront ici
        </Text>
      </View>
    );
  }

  // Layout responsive: 1 colonne mobile, 2 tablette, 3 desktop
  if (isDesktop || isTablet) {
    const numColumns = isDesktop ? 3 : 2;
    const rows: Candidate[][] = [];

    for (let i = 0; i < candidates.length; i += numColumns) {
      rows.push(candidates.slice(i, i + numColumns));
    }

    return (
      <View style={styles.container}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((candidate) => (
              <View
                key={candidate.id}
                style={[
                  styles.cardWrapper,
                  isDesktop ? styles.cardWrapperDesktop : styles.cardWrapperTablet,
                ]}
              >
                <CandidateCard
                  candidate={candidate}
                  onPress={() => onViewCandidate(candidate)}
                />
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  }

  // Mobile: liste simple
  return (
    <View style={styles.container}>
      {candidates.map((candidate) => (
        <CandidateCard
          key={candidate.id}
          candidate={candidate}
          onPress={() => onViewCandidate(candidate)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
  },
  row: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  cardWrapper: {
    flex: 1,
  },
  cardWrapperTablet: {
    maxWidth: '50%',
  },
  cardWrapperDesktop: {
    maxWidth: '33.33%',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
  emptyTitle: {
    ...textStyles.h4,
    color: colors.navy,
    marginTop: spacing[3],
    marginBottom: spacing[1],
  } as TextStyle,
  emptyText: {
    ...textStyles.body,
    color: colors.gray[500],
    textAlign: 'center',
  } as TextStyle,
});
