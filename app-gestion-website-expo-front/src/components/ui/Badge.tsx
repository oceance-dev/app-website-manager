import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, borderRadius } from '../../theme';

type BadgeVariant =
  | 'active'
  | 'pending'
  | 'inactive'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'default';

type RoleVariant = 'admin' | 'supervisor' | 'cadet';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  role?: RoleVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  active: { bg: colors.successLight, text: colors.success },
  success: { bg: colors.successLight, text: colors.successDark },
  pending: { bg: colors.warningLight, text: colors.warningDark },
  warning: { bg: colors.warningLight, text: colors.warningDark },
  inactive: { bg: colors.muted, text: colors.mutedForeground },
  error: { bg: colors.errorLight, text: colors.errorDark },
  info: { bg: colors.infoLight, text: colors.infoDark },
  default: { bg: colors.gray[100], text: colors.gray[700] },
};

const roleStyles: Record<RoleVariant, { bg: string; text: string }> = {
  admin: { bg: colors.role.admin.background, text: colors.role.admin.text },
  supervisor: { bg: colors.role.supervisor.background, text: colors.role.supervisor.text },
  cadet: { bg: colors.role.cadet.background, text: colors.role.cadet.text },
};

export function Badge({ children, variant, role, style, textStyle }: BadgeProps) {
  const getStyles = () => {
    if (role && roleStyles[role]) {
      return {
        container: { backgroundColor: roleStyles[role].bg },
        text: { color: roleStyles[role].text },
      };
    }

    const variantKey = variant || 'default';
    const variantStyle = variantStyles[variantKey] || variantStyles.default;

    return {
      container: { backgroundColor: variantStyle.bg },
      text: { color: variantStyle.text },
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
