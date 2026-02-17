import React from 'react';
import { View, Text, StyleSheet, TextStyle } from 'react-native';
import { colors, textStyles, spacing, shadows, borderRadius } from '@/src/theme';
import { getResponsivePadding } from '@/src/utils/responsive';

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
}

export const DashboardHeader = ({ title, subtitle }: DashboardHeaderProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: getResponsivePadding(),
    ...shadows.md,
  },
  title: {
    ...textStyles.h2,
    color: colors.navy,
    marginBottom: spacing[1],
  } as TextStyle,
  subtitle: {
    ...textStyles.body,
    color: colors.gray[600],
  } as TextStyle,
});
