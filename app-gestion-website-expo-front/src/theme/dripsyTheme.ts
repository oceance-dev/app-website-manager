import { makeTheme } from 'dripsy';

const theme = makeTheme({
  colors: {
    primary: '#2563eb',
    primaryLight: '#eff6ff',
    secondary: '#dbeafe',
    text: '#1e293b',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    background: '#fff',
    backgroundGray: '#f8fafc',
    border: '#e2e8f0',
    error: '#dc2626',
    errorLight: '#fef2f2',
    success: '#10b981',
  },
  space: {
    $0: 0,
    $1: 4,
    $2: 8,
    $3: 12,
    $4: 16,
    $5: 20,
    $6: 24,
    $7: 32,
  },
  fontSizes: {
    $0: 8,
    $1: 10,
    $2: 12,
    $3: 14,
    $4: 16,
    $5: 18,
    $6: 20,
    $7: 24,
  },
  radii: {
    $0: 0,
    $1: 4,
    $2: 6,
    $3: 8,
    $4: 12,
    $5: 16,
    $6: 20,
    full: 999,
  },
  text: {
    heading: {
      fontSize: '$6',
      fontWeight: 'bold',
      color: 'text',
    },
    body: {
      fontSize: '$3',
      color: 'text',
    },
    caption: {
      fontSize: '$2',
      color: 'textSecondary',
    },
  },
});

export type MyTheme = typeof theme;
export default theme;
