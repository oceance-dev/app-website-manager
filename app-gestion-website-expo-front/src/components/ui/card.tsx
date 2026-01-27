import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  paddedSm?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, padded, paddedSm }) => {
  return (
    <View
      style={[
        styles.base,
        padded && styles.padded,
        paddedSm && styles.paddedSm,
        style
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    borderWidth: 0,
    ...shadows.card,
  },
  padded: {
    padding: spacing.xl,
  },
  paddedSm: {
    padding: spacing.lg,
  },
});
