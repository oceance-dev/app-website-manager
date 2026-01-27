/**
 * Design System CADEP - Couleurs
 * Thème militaire/institutionnel
 */

export const colors = {
  // Base
  background: '#F8F9FB',           // hsl(220, 20%, 98%)
  foreground: '#0F172A',           // hsl(222, 47%, 11%)

  // Navy (Primaire)
  navy: '#1B2A4E',                 // hsl(222, 47%, 20%)
  navyLight: '#E8EBF0',            // hsl(222, 30%, 92%)
  navyDark: '#0F172A',             // hsl(222, 47%, 11%)

  // Gold (Accent)
  gold: '#F59E0B',                 // hsl(45, 93%, 47%)
  goldLight: '#FEF3C7',            // hsl(45, 100%, 94%)
  goldDark: '#A16207',             // hsl(45, 80%, 35%)

  // Semantic
  success: '#22C55E',              // hsl(142, 71%, 45%)
  successLight: '#DCFCE7',         // hsl(142, 76%, 94%)
  successDark: '#047857',

  warning: '#F59E0B',              // hsl(38, 92%, 50%)
  warningLight: '#FEF3C7',         // hsl(38, 100%, 94%)
  warningDark: '#d97706',

  error: '#EF4444',                // hsl(0, 84%, 60%)
  errorLight: '#FEE2E2',           // hsl(0, 100%, 96%)
  errorDark: '#dc2626',

  info: '#3B82F6',                 // hsl(217, 91%, 60%)
  infoLight: '#DBEAFE',            // hsl(217, 100%, 96%)
  infoDark: '#2563eb',

  purple: '#8B5CF6',               // hsl(262, 83%, 58%)
  purpleLight: '#EDE9FE',          // hsl(262, 100%, 96%)

  // Muted
  muted: '#F1F5F9',                // hsl(220, 14%, 96%)
  mutedForeground: '#64748B',      // hsl(220, 9%, 46%)

  // Bordures
  border: '#E2E8F0',               // hsl(220, 13%, 91%)

  // Sidebar
  sidebarBg: '#0F172A',            // Navy dark
  sidebarForeground: '#E2E8F0',
  sidebarAccent: '#1E293B',

  // Neutres
  white: '#ffffff',
  black: '#000000',

  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Badge statuts (conservés pour rétro-compatibilité)
  badge: {
    active: {
      background: '#DCFCE7',
      text: '#22C55E',
    },
    pending: {
      background: '#FEF3C7',
      text: '#A16207',
    },
    inactive: {
      background: '#F1F5F9',
      text: '#64748B',
    },
  },

  // Badge rôles (conservés pour rétro-compatibilité)
  role: {
    admin: {
      background: '#E8EBF0',
      text: '#1B2A4E',
    },
    supervisor: {
      background: '#DBEAFE',
      text: '#3B82F6',
    },
    cadet: {
      background: '#F59E0B',
      text: '#ffffff',
    },
  },

  // Input
  input: {
    background: '#F8F9FB',
    border: '#E2E8F0',
    borderFocus: '#1B2A4E',
    placeholder: '#64748B',
  },

  // Transparences
  overlay: 'rgba(0, 0, 0, 0.5)',
  cardShadow: 'rgba(0, 0, 0, 0.1)',
};

export type Colors = typeof colors;
