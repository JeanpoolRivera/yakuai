import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary-100 text-primary-800 hover:bg-primary-200",
        secondary: "border-transparent bg-neutral-100 text-neutral-800 hover:bg-neutral-200",
        destructive: "border-transparent bg-danger-50 text-danger-700 hover:bg-danger-100",
        success: "border-transparent bg-success-50 text-success-700 hover:bg-success-100",
        warning: "border-transparent bg-warning-50 text-warning-700 hover:bg-warning-100",
        info: "border-transparent bg-info-50 text-info-700 hover:bg-info-100",
        outline: "border-neutral-300 text-neutral-700 hover:bg-neutral-50",
        verdictRiega: "border-transparent bg-verdict-riega-bg text-verdict-riega-text",
        verdictNo: "border-transparent bg-verdict-no-bg text-verdict-no-text",
        verdictEspera: "border-transparent bg-verdict-espera-bg text-verdict-espera-text",
        verdictIncompleta: "border-transparent bg-verdict-incompleta-bg text-verdict-incompleta-text",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, size, className }))} {...props} />
}

/** Variante de badge según tono de dominio (`badgeToneForResult` de `lib/format`).
 * Tonos: "critica" | "riega" | "no" | "espera" | "incompleta".
 */
export function badgeVariantForTone(tone: string): BadgeProps["variant"] {
  if (tone === "critica") return "destructive";
  if (tone === "riega") return "warning";
  if (tone === "no") return "success";
  if (tone === "espera") return "info";
  return "secondary";
}

export { Badge, badgeVariants }