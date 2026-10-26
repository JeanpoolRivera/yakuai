/** Tipografía clara, sin serif decorativa en datos ni navegación. */
export const fontFamily = {
  sans: 'Inter, "Segoe UI", Arial, sans-serif',
  display: 'Inter, "Segoe UI", Arial, sans-serif',
  mono: 'ui-monospace, "Cascadia Code", Consolas, monospace',
} as const;
export const fontSize = {
  "2xs": "0.6875rem", xs: "0.75rem", sm: "0.875rem", base: "1rem",
  md: "1rem", lg: "1.125rem", xl: "1.25rem", "2xl": "1.5rem",
  "3xl": "1.875rem", "4xl": "2.25rem",
} as const;
export const displaySize = {
  d1: "clamp(1.75rem, 1.2rem + 2.4vw, 2.25rem)",
  d2: "clamp(1.5rem, 1.2rem + 1.5vw, 2rem)",
  d3: "clamp(1.125rem, 1rem + .6vw, 1.375rem)",
} as const;
export const fontWeight = { regular: "400", medium: "500", semibold: "600", bold: "700" } as const;
export const lineHeight = { tight: "1.15", snug: "1.3", normal: "1.55", relaxed: "1.65" } as const;
export const letterSpacing = { tight: "-0.025em", normal: "0", wide: "0.06em" } as const;

