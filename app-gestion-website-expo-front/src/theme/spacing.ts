/**
 * Design System CADEP - Espacement
 */

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  // Aliases pour une utilisation plus sémantique
  xs: 4,    // Padding xs
  sm: 8,    // Padding sm
  md: 12,   // Padding md
  lg: 16,   // Padding lg
  xl: 20,   // Padding xl
  xxl: 24,  // Padding xxl
  '2xl': 48,
};

export const borderRadius = {
  none: 0,
  sm: 8,        // radiusSm - Badges, petits éléments
  md: 10,       // Ancien md
  lg: 12,       // radius - Par défaut (cards, inputs)
  xl: 16,       // radiusLg - Cards principales
  '2xl': 20,    // radiusXl - Boutons hero
  '3xl': 24,
  full: 9999,   // radiusFull - Avatars, pills
};

export const shadows = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  // Card standard (selon design system)
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  // Ombre plus prononcée (hover state)
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  // Ombre dorée (boutons hero)
  gold: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  // Ombre navy
  navy: {
    shadowColor: '#1B2A4E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
};

export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
