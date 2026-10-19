/**
 * YakuAI Design System — Colores.
 * Fuente canónica en TS; espejada en `styles/globals.css` (@theme) para Tailwind v4.
 * Pares texto/fondo verificados WCAG 2.2 AA (≥ 4.5:1 texto, ≥ 3:1 UI).
 * Al cambiar un valor aquí, actualizar el token correspondiente en globals.css.
 */

export const palette = {
  primary: {
    50: "#edf7f2",
    100: "#d9eee4",
    200: "#bee0d2",
    300: "#97c9b7",
    400: "#6ab89a",
    500: "#399279",
    600: "#207c63",
    700: "#146852",
    800: "#165349",
    900: "#103e38",
    950: "#092e2b",
  },
  neutral: {
    50: "#f8fafb",
    100: "#f4f6f8",
    200: "#e1e7ec",
    300: "#cadfed",
    400: "#a5b3bd",
    500: "#667b87",
    600: "#5d727f",
    700: "#4d626f",
    800: "#172b36",
    900: "#0f1a20",
    950: "#081015",
  },
} as const;

/** Marca: acción principal, hover y superficie suave. */
export const brand = {
  base: "#146852",
  hover: "#103e38",
  soft: "#edf7f2",
} as const;

/** Pares semánticos accesibles (bg + fg + ratio de contraste). */
export const semantic = {
  success: { bg: "#e8f5ec", fg: "#0f5942", contrast: "7.4:1" },
  warning: { bg: "#fff4dc", fg: "#7a4a05", contrast: "6.8:1" },
  info: { bg: "#e9f1fb", fg: "#1f4a75", contrast: "8.0:1" },
  danger: { bg: "#fdeceb", fg: "#8f2530", contrast: "7.4:1" },
  neutral: { bg: "#f1f4f5", fg: "#43545e", contrast: "7.1:1" },
} as const;

/** Veredictos de riego: mismo contrato que `EvalResult`. */
export const verdict = {
  riega: { bg: "#fff4dc", fg: "#7a4a05", contrast: "6.8:1" },
  no: { bg: "#e8f5ec", fg: "#0f5942", contrast: "7.4:1" },
  espera: { bg: "#e9f1fb", fg: "#1f4a75", contrast: "8.0:1" },
  incompleta: { bg: "#f1f4f5", fg: "#43545e", contrast: "7.1:1" },
} as const;

/** Bordes: `subtle` decorativo; `strong` para controles (≥ 3:1 sobre blanco). */
export const border = {
  subtle: "#e2e9e6",
  strong: "#5f7378",
} as const;

export const focus = { ring: "rgba(20, 104, 82, 0.35)" } as const;

export type VerdictTone = keyof typeof verdict;
