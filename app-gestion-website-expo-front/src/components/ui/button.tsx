import * as React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from "react-native";

export interface ButtonProps
  extends React.ComponentPropsWithoutRef<typeof TouchableOpacity> {
  children?: React.ReactNode;
  isLoading?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
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
      case "default":
        return { ...baseStyle, ...styles.default };
      case "destructive":
        return { ...baseStyle, ...styles.destructive };
      case "outline":
        return { ...baseStyle, ...styles.outline };
      case "secondary":
        return { ...baseStyle, ...styles.secondary };
      case "ghost":
        return { ...baseStyle, ...styles.ghost };
      case "link":
        return { ...baseStyle, ...styles.link };
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
      case "default":
        return { ...baseTextStyle, ...styles.text_default };
      case "destructive":
        return { ...baseTextStyle, ...styles.text_destructive };
      case "outline":
        return { ...baseTextStyle, ...styles.text_outline };
      case "secondary":
        return { ...baseTextStyle, ...styles.text_secondary };
      case "ghost":
        return { ...baseTextStyle, ...styles.text_ghost };
      case "link":
        return { ...baseTextStyle, ...styles.text_link };
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
          color={variant === "outline" || variant === "ghost" ? "#2563eb" : "#fff"}
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
    borderRadius: 10,
  },

  // Sizes
  size_default: {
    height: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  size_sm: {
    height: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  size_lg: {
    height: 56,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  size_icon: {
    height: 40,
    width: 40,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },

  // Variants
  default: {
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  destructive: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  secondary: {
    backgroundColor: '#f1f5f9',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  link: {
    backgroundColor: 'transparent',
  },

  // Text styles base
  text_base: {
    fontWeight: '600',
    textAlign: 'center',
  },

  // Text sizes
  text_default: {
    fontSize: 16,
  },
  text_sm: {
    fontSize: 14,
  },
  text_lg: {
    fontSize: 18,
  },
  text_icon: {
    fontSize: 16,
  },

  // Text variants
  text_default: {
    color: '#fff',
  },
  text_destructive: {
    color: '#fff',
  },
  text_outline: {
    color: '#1e293b',
  },
  text_secondary: {
    color: '#475569',
  },
  text_ghost: {
    color: '#1e293b',
  },
  text_link: {
    color: '#2563eb',
    textDecorationLine: 'underline',
  },

  disabled: {
    opacity: 0.5,
  },
});

export { Button };
