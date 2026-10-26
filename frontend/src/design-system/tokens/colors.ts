/** Paleta semántica alineada con la propuesta visual de YakuAI. */
export const palette = {
  primary: {
    50: "#E4F2F1", 100: "#DFF0ED", 200: "#B7DFDA", 300: "#83C9C1", 400: "#4BAAA5",
    500: "#087F8C", 600: "#0B6672", 700: "#09525C", 800: "#0A4149", 900: "#12343D", 950: "#112D3B",
  },
  neutral: {
    50: "#F8FAF9", 100: "#F4F7F5", 200: "#DCE6E3", 300: "#C7D5D1", 400: "#A5B8B3",
    500: "#728984", 600: "#536A72", 700: "#35515A", 800: "#18313B", 900: "#112D3B", 950: "#081D27",
  },
  success: { 50: "#E8F3ED", 100: "#CDE5D7", 500: "#33825D", 600: "#246B50", 700: "#1D563F" },
  warning: { 50: "#FFF3D7", 100: "#F5E0AD", 500: "#A36A09", 600: "#885600", 700: "#704600" },
  danger: { 50: "#FCE9E5", 100: "#F2CFC8", 500: "#B84A3D", 600: "#A63B32", 700: "#873027" },
} as const;

export const brand = { base: "#0B6672", hover: "#09525C", soft: "#DFF0ED", deep: "#112D3B", accent: "#83C9C1" } as const;
export const semantic = {
  success: { bg: "#E8F3ED", fg: "#246B50" },
  warning: { bg: "#FFF3D7", fg: "#885600" },
  info: { bg: "#E4F2F1", fg: "#0B6672" },
  danger: { bg: "#FCE9E5", fg: "#A63B32" },
  neutral: { bg: "#F4F7F5", fg: "#35515A" },
} as const;
export const verdict = {
  riega: { bg: "#E4F2F1", fg: "#0B6672" },
  espera: { bg: "#FFF3D7", fg: "#885600" },
  no: { bg: "#E8F3ED", fg: "#246B50" },
  incompleta: { bg: "#F4F7F5", fg: "#35515A" },
} as const;
export const dataVisualization = { water: "#087F8C", vegetation: "#246B50", soil: "#885600", temperature: "#A63B32", sunlight: "#A36A09" } as const;
export const border = { subtle: "#DCE6E3", strong: "#536A72" } as const;
export const focus = { ring: "#0B6672" } as const;
export type VerdictTone = keyof typeof verdict;

