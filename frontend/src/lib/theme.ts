/**
 * Design System Tokens - YakuAI
 * Valores exactos extraídos del login v2 + criterio experto
 * Fuente única de verdad para diseño
 */

export const colors = {
  // Verde primario - exacto del login v2
  primary: {
    50: '#edf7f2',
    100: '#d9eee4',
    200: '#bee0d2',
    300: '#97c9b7',
    500: '#399279',
    600: '#207c63',
    700: '#146852',
    800: '#165349',
    900: '#103e38',
    950: '#092e2b',
  },

  // Semánticos - exactos del login v2
  success: {
    50: '#edf7ef',
    100: '#dcf7e8',
    500: '#24734d',
    600: '#1a5839',
    700: '#15803d',
  },
  warning: {
    50: '#fff7e6',
    100: '#fef3d6',
    500: '#99610b',
    600: '#774908',
    700: '#b45309',
  },
  danger: {
    50: '#fff1f1',
    100: '#ffe5e5',
    500: '#b7353d',
    600: '#8f2530',
    700: '#b91c1c',
  },
  info: {
    50: '#edf5fc',
    100: '#dcebfd',
    500: '#326899',
    600: '#254e76',
  },

  // Neutros - exactos del login v2
  neutral: {
    50: '#f8fafb',
    100: '#f4f6f8',
    200: '#e1e7ec',
    300: '#cadfed',
    400: '#a5b3bd',
    500: '#667b87',
    600: '#5d727f',
    700: '#4d626f',
    800: '#172b36',
    900: '#0f1a20',
    950: '#081015',
  },

  // Veredictos - exactos del login v2
  verdict: {
    riega: { bg: '#fff8ea', text: '#99610b' },
    no: { bg: '#eff8f2', text: '#146852' },
    espera: { bg: '#eff6fc', text: '#326899' },
    incompleta: { bg: '#f5f6f7', text: '#526775' },
  },

  // Dark mode (story panel) - exacto del login v2
  dark: {
    bg: '#092e2b',
    card: '#103e38',
    border: '#165349',
    text: '#ffffff',
    muted: '#c5d9d4',
    faint: '#b8d0c8',
    soft: '#e2eee8',
    accent: '#d6e8a9',
  },

  // Overlays
  overlay: {
    backdrop: 'rgba(23, 43, 54, 0.4)',
    scrim: 'rgba(0, 0, 0, 0.5)',
  },
} as const;

export const typography = {
  fontFamily: {
    sans: ['Inter', 'Segoe UI', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
    mono: ['SFMono-Regular', 'Consolas', 'monospace'],
    display: ['Inter', 'Segoe UI', '-apple-system', 'sans-serif'],
  },

  fontSize: {
    '2xs': '0.625rem',   // 10px - kicker/eyebrow
    xs: '0.75rem',       // 12px - tiny
    sm: '0.8125rem',     // 13px - small/labels
    base: '0.875rem',    // 14px - body base
    lg: '1rem',          // 16px - inputs/body large
    xl: '1.125rem',      // 18px - h3
    '2xl': '1.5rem',     // 24px - h2
    '3xl': '2rem',       // 32px - h1
    '4xl': '2.5rem',     // 40px - display
    '5xl': '3rem',       // 48px - large display
    '6xl': '4rem',       // 64px - large display
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.55,
    relaxed: 1.75,
  },

  letterSpacing: {
    tight: '-0.055em',
    normal: '0',
    wide: '0.08em',
    wider: '0.12em',
  },
} as const;

export const spacing = {
  0: '0',
  0.5: '0.125rem',   // 2px
  1: '0.25rem',      // 4px
  1.5: '0.375rem',   // 6px
  2: '0.5rem',       // 8px
  2.5: '0.625rem',   // 10px
  3: '0.75rem',      // 12px
  3.5: '0.875rem',   // 14px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  7: '1.75rem',      // 28px
  8: '2rem',         // 32px
  9: '2.25rem',      // 36px
  10: '2.5rem',      // 40px
  11: '2.75rem',     // 44px
  12: '3rem',        // 48px
  14: '3.5rem',      // 56px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
  28: '7rem',        // 112px
  32: '8rem',        // 128px
} as const;

export const borderRadius = {
  none: '0',
  xs: '3px',       // badges, chips
  sm: '6px',       // inputs, buttons
  md: '8px',       // cards, dropdowns
  lg: '12px',      // modals, sheets, cards
  xl: '16px',      // sheets, drawers, hero
  '2xl': '24px',   // hero sections
  full: '9999px',  // pills, avatars
} as const;

export const shadows = {
  xs: '0 1px 2px rgb(23 43 54 / 0.03)',
  sm: '0 1px 3px rgb(23 43 54 / 0.06), 0 1px 2px rgb(23 43 54 / 0.04)',
  md: '0 4px 12px rgb(23 43 54 / 0.08), 0 2px 4px rgb(23 43 54 / 0.04)',
  lg: '0 12px 28px rgb(23 43 54 / 0.10), 0 4px 12px rgb(23 43 54 / 0.05)',
  xl: '0 20px 40px rgb(23 43 54 / 0.12), 0 8px 16px rgb(23 43 54 / 0.06)',
  '2xl': '0 28px 56px rgb(23 43 54 / 0.15), 0 12px 24px rgb(23 43 54 / 0.08)',
  focus: '0 0 0 3px rgb(32 124 99 / 0.15)',
  focusError: '0 0 0 3px rgb(183 53 61 / 0.15)',
  focusSuccess: '0 0 0 3px rgb(36 115 77 / 0.15)',
  inset: 'inset 0 2px 4px rgb(23 43 54 / 0.05)',
} as const;

export const breakpoints = {
  xs: '360px',
  sm: '480px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
} as const;

export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBack: 400,
  modal: 500,
  popover: 600,
  toast: 700,
  tooltip: 800,
  skipLink: 900,
  max: 9999,
} as const;

export const transitions = {
  instant: '0ms',
  fast: '120ms cubic-bezier(0.2, 0.8, 0.2, 1)',
  normal: '160ms cubic-bezier(0.2, 0.8, 0.2, 1)',
  slow: '240ms cubic-bezier(0.2, 0.8, 0.2, 1)',
  slower: '320ms cubic-bezier(0.2, 0.8, 0.2, 1)',
  ease: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export const layout = {
  sidebar: {
    width: '15.5rem',      // 248px
    collapsed: '4.5rem',   // 72px
    mobile: '18rem',       // 288px sheet
  },
  topbar: {
    height: '4.25rem',     // 68px
    mobile: '3.5rem',      // 56px
  },
  container: {
    max: '88rem',          // 1408px
    padding: '1.5rem',     // 24px
    paddingMobile: '1rem', // 16px
  },
  touchTarget: '2.75rem',  // 44px - WCAG AA
  grid: {
    columns: 12,
    gap: '1rem',           // 16px
    gapMobile: '0.75rem',  // 12px
  },
} as const;

// Export unificado
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  zIndex,
  transitions,
  layout,
} as const;

// Type helpers
export type Theme = typeof theme;
export type ColorScale = keyof typeof colors.primary;
export type SemanticColor = 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type RadiusSize = keyof typeof borderRadius;
export type ShadowSize = keyof typeof shadows;
export type Breakpoint = keyof typeof breakpoints;
export type SpacingSize = keyof typeof spacing;
export type FontSize = keyof typeof typography.fontSize;
export type ZIndexLevel = keyof typeof zIndex;