import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, borderRadius, fontSizes, fontWeights } from '../../theme';

type BadgeVariant = 'active' | 'pending' | 'inactive';
type RoleVariant = 'admin' | 'supervisor' | 'cadet';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  role?: RoleVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({ children, variant, role, style, textStyle }: BadgeProps) {
  const getStyles = () => {
    if (role) {
      switch (role) {
        case 'admin':
          return {
            container: { backgroundColor: colors.role.admin.background },
            text: { color: colors.role.admin.text },
          };
        case 'supervisor':
          return {
            container: { backgroundColor: colors.role.supervisor.background },
            text: { color: colors.role.supervisor.text },
          };
        case 'cadet':
          return {
            container: { backgroundColor: colors.role.cadet.background },
            text: { color: colors.role.cadet.text },
          };
      }
    }

    if (variant) {
      switch (variant) {
        case 'active':
          return {
            container: { backgroundColor: colors.badge.active.background },
            text: { color: colors.badge.active.text },
          };
        case 'pending':
          return {
            container: { backgroundColor: colors.badge.pending.background },
            text: { color: colors.badge.pending.text },
          };
        case 'inactive':
          return {
            container: { backgroundColor: colors.badge.inactive.background },
            text: { color: colors.badge.inactive.text },
          };
      }
    }

    // Default
    return {
      container: { backgroundColor: colors.gray[100] },
      text: { color: colors.gray[700] },
    };
  };

  const badgeStyles = getStyles();

  return (
    <View style={[styles.container, badgeStyles.container, style]}>
      <Text style={[styles.text, badgeStyles.text, textStyle]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default Badge;
