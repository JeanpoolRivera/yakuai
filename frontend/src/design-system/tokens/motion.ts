/**
 * YakuAI Design System — Movimiento.
 * Respetar `prefers-reduced-motion`: las transiciones se anulan globalmente en globals.css.
 */

export const duration = {
  fast: "120ms",
  base: "200ms",
  slow: "320ms",
} as const;

export const easing = {
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  emphasized: "cubic-bezier(0.2, 0.8, 0.2, 1)",
} as const;

export const transition = {
  colors: `color ${duration.base} ${easing.standard}, background-color ${duration.base} ${easing.standard}, border-color ${duration.base} ${easing.standard}`,
  transform: `transform ${duration.base} ${easing.emphasized}`,
} as const;
