import { palette, semantic, verdict, dataVisualization } from "../design-system/tokens/colors";
import { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing } from "../design-system/tokens/typography";

export const colors = {
  primary: palette.primary, neutral: palette.neutral,
  success: palette.success, warning: palette.warning, danger: palette.danger,
  info: { 50: "#E4F2F1", 100: "#B7DFDA", 500: "#087F8C", 600: "#0B6672", 700: "#09525C" },
  verdict, semantic, dataVisualization,
} as const;
export const typography = { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing } as const;
export const spacing = { 0: "0", 1: ".25rem", 2: ".5rem", 3: ".75rem", 4: "1rem", 5: "1.25rem", 6: "1.5rem", 8: "2rem", 10: "2.5rem", 12: "3rem", 16: "4rem" } as const;
export const borderRadius = { none: "0", xs: ".25rem", sm: ".375rem", md: ".5rem", lg: ".75rem", xl: "1rem", "2xl": "1.125rem", full: "9999px" } as const;
export const shadows = {
  xs: "0 1px 2px rgba(17,45,59,.04)", sm: "0 4px 14px rgba(17,45,59,.06)",
  md: "0 12px 32px rgba(17,45,59,.09)", lg: "0 20px 48px rgba(17,45,59,.14)",
  focus: "0 0 0 3px rgba(11,102,114,.28)",
} as const;
export const breakpoints = { xs: "360px", sm: "480px", md: "768px", lg: "1024px", xl: "1280px" } as const;
export const zIndex = { hide: -1, base: 0, dropdown: 100, sticky: 200, fixed: 300, modalBack: 400, modal: 500, popover: 600, toast: 700, tooltip: 800, skipLink: 900, max: 9999 } as const;
export const transitions = { instant: "0ms", fast: "140ms ease", normal: "220ms ease", slow: "320ms ease" } as const;
export const layout = { sidebar: { width: "15.5rem", collapsed: "4.5rem", mobile: "18rem" }, topbar: { height: "4rem", mobile: "3.5rem" }, container: { max: "80rem", padding: "2rem", paddingMobile: "1rem" }, touchTarget: "2.75rem", grid: { columns: 12, gap: "1.5rem", gapMobile: "1rem" } } as const;
export const theme = { colors, typography, spacing, borderRadius, shadows, breakpoints, zIndex, transitions, layout } as const;
export type Theme = typeof theme;
export type ColorScale = keyof typeof colors.primary;
export type SemanticColor = "primary" | "success" | "warning" | "danger" | "info";
export type RadiusSize = keyof typeof borderRadius;
export type ShadowSize = keyof typeof shadows;
export type Breakpoint = keyof typeof breakpoints;
export type SpacingSize = keyof typeof spacing;
export type FontSize = keyof typeof typography.fontSize;
export type ZIndexLevel = keyof typeof zIndex;

