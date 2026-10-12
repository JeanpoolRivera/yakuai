import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-sm border border-neutral-400 bg-white px-4 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-500 transition-all",
          "hover:border-primary-600",
          "focus:outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-600",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-100",
          "aria-invalid:border-danger-500 aria-invalid:focus:ring-danger-500/15",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }