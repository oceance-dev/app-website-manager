import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Shield } from 'lucide-react-native';
import { colors, textStyles, spacing } from '../../theme';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  variant?: 'default' | 'light' | 'dark';
  style?: ViewStyle;
}

export function Logo({ size = 'medium', showText = true, variant = 'default', style }: LogoProps) {
  const iconSize = {
    small: 20,
    medium: 32,
    large: 48,
  }[size];

  const textSize = {
    small: textStyles.body,
    medium: textStyles.h3,
    large: textStyles.h1,
  }[size];

  const iconColor = variant === 'light' ? colors.white : colors.gold;
  const textColor = variant === 'light' ? colors.white : variant === 'dark' ? colors.white : colors.navy;

  return (
    <View style={[styles.container, style]}>
      <Shield color={iconColor} size={iconSize} fill={iconColor} />
      {showText && (
        <Text style={[textSize, { color: textColor, marginLeft: spacing[2] }]}>
          CADEP
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default Logo;
