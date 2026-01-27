import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';

type IconSize = 'sm' | 'md' | 'lg';
type IconVariant = 'info' | 'success' | 'warning' | 'error' | 'purple' | 'gold' | 'navy';

interface IconContainerProps {
  children: React.ReactNode;
  size?: IconSize;
  variant?: IconVariant;
  style?: ViewStyle;
}

export function IconContainer({ children, size = 'md', variant = 'info', style }: IconContainerProps) {
  const sizeStyles = styles[`size_${size}`];
  const variantStyles = styles[`variant_${variant}`];

  return (
    <View style={[styles.base, sizeStyles, variantStyles, style]}>
      {children}
    </View>
  );
}

// Icon colors to use with each variant
export const iconColors = {
  info: colors.info,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  purple: colors.purple,
  gold: colors.goldDark,
  navy: colors.navy,
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sizes
  size_sm: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  size_md: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  size_lg: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },

  // Color variants
  variant_info: { backgroundColor: colors.infoLight },
  variant_success: { backgroundColor: colors.successLight },
  variant_warning: { backgroundColor: colors.warningLight },
  variant_error: { backgroundColor: colors.errorLight },
  variant_purple: { backgroundColor: colors.purpleLight },
  variant_gold: { backgroundColor: colors.goldLight },
  variant_navy: { backgroundColor: colors.navyLight },
});

export default IconContainer;
