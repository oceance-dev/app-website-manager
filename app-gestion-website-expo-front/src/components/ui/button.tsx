import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Text } from "dripsy";
import { colors, spacing, borderRadius } from "@/src/theme";
import { LucideIcon } from "lucide-react-native";

export type ButtonVariant = "primary" | "secondary" | "destructive" | "success" | "outline" | "ghost" | "default";

export interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: LucideIcon;
  disabled?: boolean;
  style?: ViewStyle;
  className?: string;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: colors.navy, text: colors.white },
  secondary: { bg: colors.muted, text: colors.foreground },
  destructive: { bg: colors.error, text: colors.white },
  success: { bg: colors.success, text: colors.white },
  outline: { bg: "transparent", text: colors.navy, border: colors.navy },
  ghost: { bg: "transparent", text: colors.mutedForeground },
  default: { bg: colors.navy, text: colors.white },
};

export const Button = ({
  children,
  onPress,
  variant = "primary",
  icon: Icon,
  disabled = false,
  style,
}: ButtonProps) => {
  const vs = variantStyles[variant];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: vs.bg },
        vs.border ? { borderWidth: 1, borderColor: vs.border } : undefined,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {Icon && <Icon size={18} color={vs.text} style={styles.icon} />}
      <Text style={[styles.text, { color: vs.text }]}>{children}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    minHeight: 44,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
  },
  icon: {
    marginRight: spacing.xs,
  },
  disabled: {
    opacity: 0.5,
  },
});
