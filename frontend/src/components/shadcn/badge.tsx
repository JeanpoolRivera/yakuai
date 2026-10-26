import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge as SystemBadge, type BadgeProps as SystemBadgeProps } from "@/design-system/primitives/badge";
import { badgeVariants as systemBadgeVariants } from "@/design-system/primitives/badge-variants";

const TONE_BY_VARIANT = {
  default: "brand", secondary: "neutral", destructive: "danger", success: "success",
  warning: "warning", info: "info", outline: "neutral", verdictRiega: "riega",
  verdictNo: "no", verdictEspera: "espera", verdictIncompleta: "incompleta",
} as const;
const SIZE_CLASS = { default: "px-2.5 py-1 text-xs", sm: "px-2 py-1 text-xs", lg: "px-3 py-1.5 text-sm" } as const;

export interface BadgeProps extends Omit<SystemBadgeProps, "tone"> {
  variant?: keyof typeof TONE_BY_VARIANT;
  size?: keyof typeof SIZE_CLASS;
}

export function badgeVariants({ variant = "default", size = "default", className }: {
  variant?: keyof typeof TONE_BY_VARIANT;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
} = {}): string {
  return cn(systemBadgeVariants({ tone: TONE_BY_VARIANT[variant] }), SIZE_CLASS[size], variant === "outline" && "border-neutral-400 bg-transparent text-neutral-800", className);
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant = "default", size = "default", ...props }, ref) => (
  <SystemBadge
    ref={ref}
    tone={TONE_BY_VARIANT[variant]}
    className={badgeVariants({ variant, size, className })}
    {...props}
  />
));
Badge.displayName = "Badge";

export function badgeVariantForTone(tone: string): BadgeProps["variant"] {
  if (tone === "critica") return "destructive";
  if (tone === "riega") return "warning";
  if (tone === "no") return "success";
  if (tone === "espera") return "info";
  return "secondary";
}

export { Badge };
