import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex min-h-12 w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 placeholder:text-neutral-500 transition-[border-color,background-color,box-shadow]",
        "hover:border-primary-400",
        "focus-visible:border-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25",
        "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500 disabled:opacity-70",
        "aria-invalid:border-danger-600 aria-invalid:focus-visible:ring-danger-500/20",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
