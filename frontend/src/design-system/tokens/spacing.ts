/**
 * YakuAI Design System — Espaciado.
 * Base 4px. Usar los pasos para padding/gap/margin coherentes.
 */

export const space = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
} as const;

/** Anchos máximos de contenido del módulo. */
export const contentWidth = {
  prose: "42rem",
  panel: "56rem",
  workspace: "72rem",
} as const;
