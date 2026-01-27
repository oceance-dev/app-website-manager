/**
 * Design System CADEP
 * Export centralisé du thème
 */

export * from './colors';
export * from './typography';
export * from './spacing';

import { colors } from './colors';
import { fontFamilies, fontSizes, fontWeights, lineHeights, textStyles } from './typography';
import { spacing, borderRadius, shadows } from './spacing';

export const theme = {
  colors,
  fonts: {
    families: fontFamilies,
    sizes: fontSizes,
    weights: fontWeights,
    lineHeights,
  },
  textStyles,
  spacing,
  borderRadius,
  shadows,
};

export type Theme = typeof theme;
export default theme;
