import { cva } from "class-variance-authority";

const primary =
  "border border-primary-500 bg-primary-500 text-white hover:border-primary-700 hover:bg-primary-700";
const danger =
  "border border-danger-600 bg-danger-600 text-white hover:border-danger-700 hover:bg-danger-700";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium tracking-normal transition-[color,background-color,border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-2 active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary,
        default: primary,
        secondary:
          "border border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300 hover:bg-neutral-50",
        outline:
          "border border-neutral-300 bg-transparent text-neutral-800 hover:border-primary-500 hover:bg-primary-50 hover:text-primary-800",
        ghost:
          "border border-transparent text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900",
        danger,
        destructive: danger,
        link: "h-auto min-h-11 border-0 bg-transparent px-2 text-primary-600 underline-offset-4 hover:text-primary-800 hover:underline",
      },
      size: {
        sm: "min-h-[var(--target-sm)] px-3.5",
        md: "min-h-[var(--target-md)] px-4",
        default: "min-h-12 px-4",
        lg: "min-h-[var(--target-lg)] px-6 text-base",
        xl: "min-h-14 px-7 text-base",
        icon: "h-[var(--target-icon)] w-[var(--target-icon)]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);
