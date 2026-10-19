import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-brand text-white hover:bg-brand-hover",
        secondary: "bg-neutral-100 text-neutral-800 hover:bg-neutral-200",
        outline: "border border-border-strong bg-white text-neutral-800 hover:bg-neutral-50",
        ghost: "text-neutral-700 hover:bg-neutral-100",
        danger: "bg-danger-fg text-white hover:bg-danger-500",
      },
      size: {
        sm: "min-h-[var(--target-sm)] px-3",
        md: "min-h-[var(--target-md)] px-4",
        lg: "min-h-[var(--target-lg)] px-6 text-base",
        icon: "h-[var(--target-icon)] w-[var(--target-icon)]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);
