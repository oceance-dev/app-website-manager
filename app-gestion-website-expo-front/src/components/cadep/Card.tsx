import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
  variant?: 'default' | 'navy';
}

export function Card({ children, style, noPadding, variant = 'default' }: CardProps) {
  const backgroundColor = variant === 'navy' ? colors.navy : colors.white;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor },
        !noPadding && styles.cardWithPadding,
        style
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  cardWithPadding: {
    padding: spacing[4],
  },
});

export default Card;
