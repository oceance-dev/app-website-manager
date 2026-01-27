import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, ImageSourcePropType } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: ImageSourcePropType;
  initials?: string;
  size?: AvatarSize;
  style?: ViewStyle;
}

export function Avatar({ source, initials, size = 'md', style }: AvatarProps) {
  const sizeStyles = styles[size];
  const textSizeStyles = styles[`text_${size}`];

  return (
    <View style={[styles.base, sizeStyles, !source && styles.fallback, style]}>
      {source ? (
        <Image source={source} style={styles.image} />
      ) : (
        <Text style={[styles.fallbackText, textSizeStyles]}>
          {initials || 'U'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // Sizes
  sm: {
    width: 32,
    height: 32,
  },
  md: {
    width: 40,
    height: 40,
  },
  lg: {
    width: 48,
    height: 48,
  },
  xl: {
    width: 64,
    height: 64,
  },

  image: {
    width: '100%',
    height: '100%',
  },

  // Fallback (initials)
  fallback: {
    backgroundColor: colors.navy,
  },

  fallbackText: {
    color: colors.white,
    fontWeight: '600',
  },

  text_sm: { fontSize: 12 },
  text_md: { fontSize: 14 },
  text_lg: { fontSize: 16 },
  text_xl: { fontSize: 20 },
});

export default Avatar;
