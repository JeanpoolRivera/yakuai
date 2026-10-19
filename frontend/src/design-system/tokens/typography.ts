/**
 * YakuAI Design System — Tipografía.
 * Escala en rem sobre base 16px. Los títulos usan `clamp()` para fluidez sin media queries.
 */

export const fontFamily = {
  sans: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
} as const;

export const fontSize = {
  "2xs": "0.625rem",
  xs: "0.75rem",
  sm: "0.8125rem",
  base: "0.875rem",
  md: "0.9375rem",
  lg: "1.0625rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "2rem",
} as const;

/** Títulos display con escalado fluido (mín, fluido, máx). */
export const displaySize = {
  d1: "clamp(1.9rem, 1.3rem + 2.6vw, 2.75rem)",
  d2: "clamp(1.5rem, 1.1rem + 1.8vw, 2rem)",
  d3: "clamp(1.25rem, 1rem + 1vw, 1.5rem)",
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const lineHeight = {
  tight: "1.12",
  snug: "1.28",
  normal: "1.5",
  relaxed: "1.65",
} as const;

export const letterSpacing = {
  tight: "-0.01em",
  normal: "0",
  wide: "0.08em",
} as const;
