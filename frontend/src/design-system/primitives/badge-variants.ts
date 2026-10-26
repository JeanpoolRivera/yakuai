import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-2.5 py-1 text-xs font-semibold leading-4",
  {
    variants: {
      tone: {
        neutral: "bg-neutral-bg text-neutral-fg",
        brand: "bg-brand-soft text-brand",
        success: "bg-success-bg text-success-fg",
        warning: "bg-warning-bg text-warning-fg",
        info: "bg-info-bg text-info-fg",
        danger: "bg-danger-bg text-danger-fg",
        riega: "bg-verdict-riega-bg text-verdict-riega-text",
        no: "bg-verdict-no-bg text-verdict-no-text",
        espera: "bg-verdict-espera-bg text-verdict-espera-text",
        incompleta: "bg-verdict-incompleta-bg text-verdict-incompleta-text",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);
