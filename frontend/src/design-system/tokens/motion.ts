/** Motion tokens; honor prefers-reduced-motion in globals.css. */
export const duration = { fast: "140ms", base: "220ms", slow: "320ms" } as const;
export const easing = {
  standard: "cubic-bezier(0.2, 0.7, 0.2, 1)",
  emphasized: "cubic-bezier(0.2, 0.7, 0.2, 1)",
} as const;
export const transition = {
  colors: "color 220ms cubic-bezier(0.2, 0.7, 0.2, 1), background-color 220ms cubic-bezier(0.2, 0.7, 0.2, 1), border-color 220ms cubic-bezier(0.2, 0.7, 0.2, 1)",
  transform: "transform 220ms cubic-bezier(0.2, 0.7, 0.2, 1)",
} as const;
