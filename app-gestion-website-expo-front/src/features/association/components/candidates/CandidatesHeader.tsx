import React from 'react';
import { View, Text, StyleSheet, TextStyle } from 'react-native';
import { Card } from '@/src/components/cadep';
import { colors, textStyles, spacing } from '@/src/theme';
import { FileCheck } from 'lucide-react-native';

interface CandidatesHeaderProps {
  count: number;
}

export const CandidatesHeader = ({ count }: CandidatesHeaderProps) => {
  return (
    <Card>
      <View style={styles.header}>
        <FileCheck color={colors.navy} size={24} />
        <Text style={styles.title}>Candidatures</Text>
      </View>
      <Text style={styles.subtitle}>
        {count} candidature{count !== 1 ? 's' : ''} en attente de traitement
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  title: {
    ...textStyles.h2,
    color: colors.navy,
  } as TextStyle,
  subtitle: {
    ...textStyles.body,
    color: colors.gray[600],
  } as TextStyle,
});
