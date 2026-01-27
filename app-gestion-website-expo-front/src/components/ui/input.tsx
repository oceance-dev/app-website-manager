import * as React from "react";
import { TextInput, View, Text, StyleSheet, Platform } from "react-native";
import { colors, spacing, borderRadius } from '../../theme';

export interface InputProps
  extends React.ComponentPropsWithoutRef<typeof TextInput> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperStyle?: any;
}

const Input = React.forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  ({ style, label, error, leftIcon, rightIcon, wrapperStyle, ...props }, ref) => {
    return (
      <View style={styles.container}>
        {label && (
          <Text style={styles.label}>
            {label}
          </Text>
        )}
        <View
          style={[
            styles.inputWrapper,
            error && styles.inputWrapperError,
            wrapperStyle,
          ]}
        >
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            style={[styles.input, style]}
            placeholderTextColor={colors.mutedForeground}
            {...props}
          />
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
        {error && (
          <Text style={styles.error}>{error}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = "Input";

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  inputWrapperError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.foreground,
    paddingVertical: spacing.md,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  } as any,
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  error: {
    fontSize: 12,
    color: colors.error,
  },
});

export { Input };
