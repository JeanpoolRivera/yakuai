import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary-700 text-white hover:bg-primary-800 h-12 px-4",
        destructive: "bg-danger-500 text-white hover:bg-danger-600 h-12 px-4",
        outline: "border border-neutral-400 bg-transparent hover:bg-neutral-100 h-12 px-4",
        secondary: "bg-neutral-200 text-neutral-800 hover:bg-neutral-300 h-12 px-4",
        ghost: "hover:bg-neutral-100 h-12 px-4",
        link: "text-primary-700 underline-offset-4 hover:underline h-12 px-2",
      },
      size: {
        default: "h-12 px-4 text-sm",
        sm: "h-10 px-3 text-xs",
        lg: "h-14 px-6 text-base",
        xl: "h-16 px-8 text-lg",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }