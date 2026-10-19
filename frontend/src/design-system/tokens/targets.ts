/**
 * YakuAI Design System — Tamaños de objetivo táctil.
 * WCAG 2.2 (2.5.8): mínimo 24px; objetivo cómodo 44px.
 * `fieldMode` define la escala de fuente y los objetivos ampliados.
 */

export const target = {
  min: "24px",
  base: "44px",
  comfortable: "52px",
  field: "56px",
  sm: "44px",
  md: "48px",
  lg: "56px",
  icon: "44px",
} as const;

export const fieldMode = {
  fontScale: "122%",
  targetScale: "1.18",
  sm: "52px",
  md: "57px",
  lg: "66px",
  icon: "52px",
} as const;
