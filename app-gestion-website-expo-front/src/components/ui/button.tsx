import * as React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { colors, spacing, borderRadius, shadows } from '../../theme';

export interface ButtonProps
  extends React.ComponentPropsWithoutRef<typeof TouchableOpacity> {
  children?: React.ReactNode;
  isLoading?: boolean;
  variant?: "default" | "primary" | "secondary" | "destructive" | "outline" | "ghost" | "hero";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<
  React.ElementRef<typeof TouchableOpacity>,
  ButtonProps
>(({ style, variant = "default", size = "default", children, isLoading, disabled, ...props }, ref) => {

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.base,
      ...styles[`size_${size}`],
    };

    switch (variant) {
      case "primary":
        return { ...baseStyle, ...styles.primary };
      case "default":
        return { ...baseStyle, ...styles.primary };
      case "secondary":
        return { ...baseStyle, ...styles.secondary };
      case "destructive":
        return { ...baseStyle, ...styles.destructive };
      case "outline":
        return { ...baseStyle, ...styles.outline };
      case "ghost":
        return { ...baseStyle, ...styles.ghost };
      case "hero":
        return { ...baseStyle, ...styles.hero };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      ...styles.text_base,
      ...styles[`text_${size}`],
    };

    switch (variant) {
      case "primary":
        return { ...baseTextStyle, ...styles.text_primary };
      case "default":
        return { ...baseTextStyle, ...styles.text_primary };
      case "secondary":
        return { ...baseTextStyle, ...styles.text_secondary };
      case "destructive":
        return { ...baseTextStyle, ...styles.text_destructive };
      case "outline":
        return { ...baseTextStyle, ...styles.text_outline };
      case "ghost":
        return { ...baseTextStyle, ...styles.text_ghost };
      case "hero":
        return { ...baseTextStyle, ...styles.text_hero };
      default:
        return baseTextStyle;
    }
  };

  return (
    <TouchableOpacity
      ref={ref}
      style={[
        getButtonStyle(),
        (disabled || isLoading) && styles.disabled,
        style
      ]}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === "outline" || variant === "ghost" ? colors.navy : colors.white}
          size="small"
        />
      ) : typeof children === "string" ? (
        <Text style={getTextStyle()}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
});

Button.displayName = "Button";

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
  },

  // Sizes
  size_default: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  size_sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  size_lg: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
  },
  size_icon: {
    width: 40,
    height: 40,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },

  // Variants
  primary: {
    backgroundColor: colors.navy,
  },
  secondary: {
    backgroundColor: colors.muted,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  destructive: {
    backgroundColor: colors.error,
  },
  hero: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius['2xl'],
    ...shadows.gold,
  },

  // Text styles base
  text_base: {
    fontWeight: '600',
    textAlign: 'center',
  },

  // Text sizes
  text_default: {
    fontSize: 14,
  },
  text_sm: {
    fontSize: 14,
  },
  text_lg: {
    fontSize: 16,
  },
  text_icon: {
    fontSize: 14,
  },

  // Text variants
  text_primary: {
    color: colors.white,
  },
  text_secondary: {
    color: colors.foreground,
  },
  text_outline: {
    color: colors.foreground,
  },
  text_ghost: {
    color: colors.mutedForeground,
  },
  text_destructive: {
    color: colors.white,
  },
  text_hero: {
    color: colors.navyDark,
    fontWeight: '700',
  },

  disabled: {
    opacity: 0.5,
  },
});

export { Button };
