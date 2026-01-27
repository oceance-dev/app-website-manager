/**
 * Design System CADEP - Typographie
 * Thème militaire/institutionnel
 */

import { Platform } from 'react-native';

/**
 * Note: React Native ne supporte pas directement les Google Fonts
 * Pour utiliser Inter, il faut :
 * 1. Télécharger les fichiers .ttf (Inter-Regular, Inter-Medium, Inter-SemiBold)
 * 2. Les placer dans assets/fonts/
 * 3. Les charger avec expo-font
 *
 * En attendant, on utilise des fallbacks système
 */

export const fontFamilies = {
  // Titres - Inter SemiBold
  display: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),

  // Corps - Inter Regular
  body: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),

  // Medium - Inter Medium
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),

  // Mono (pour codes, etc.)
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
};

export const fontSizes = {
  xs: 10,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 18,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

export const fontWeights = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const lineHeights = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
};

// Styles de texte prédéfinis
export const textStyles = {
  // Titres (heading1)
  h1: {
    fontFamily: fontFamilies.display,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  // Titres (heading2)
  h2: {
    fontFamily: fontFamilies.display,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  h3: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes['2xl'] * lineHeights.tight,
  },
  h4: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.xl * lineHeights.tight,
  },

  // Corps (body)
  body: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  bodyLarge: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.normal,
    lineHeight: fontSizes.lg * lineHeights.normal,
  },

  // Textes spéciaux (caption)
  caption: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    fontWeight: '400',
  },
  button: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.base * lineHeights.tight,
  },
  // Label
  label: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    fontWeight: '500',
  },
};

export type TextStyles = typeof textStyles;
