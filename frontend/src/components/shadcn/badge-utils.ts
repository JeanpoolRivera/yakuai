import { cn } from "@/lib/utils";
import { badgeVariants as systemBadgeVariants } from "@/design-system/primitives/badge-variants";

export const TONE_BY_VARIANT = {
  default: "brand", secondary: "neutral", destructive: "danger", success: "success",
  warning: "warning", info: "info", outline: "neutral", verdictRiega: "riega",
  verdictNo: "no", verdictEspera: "espera", verdictIncompleta: "incompleta",
} as const;
export const SIZE_CLASS = { default: "px-2.5 py-1 text-xs", sm: "px-2 py-1 text-xs", lg: "px-3 py-1.5 text-sm" } as const;
export type CompatBadgeVariant = keyof typeof TONE_BY_VARIANT;

export function badgeVariants({ variant = "default", size = "default", className }: {
  variant?: CompatBadgeVariant;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
} = {}): string {
  return cn(systemBadgeVariants({ tone: TONE_BY_VARIANT[variant] }), SIZE_CLASS[size], variant === "outline" && "border-neutral-400 bg-transparent text-neutral-800", className);
}

export function badgeVariantForTone(tone: string): CompatBadgeVariant {
  if (tone === "critica") return "destructive";
  if (tone === "riega") return "warning";
  if (tone === "no") return "success";
  if (tone === "espera") return "info";
  return "secondary";
}
