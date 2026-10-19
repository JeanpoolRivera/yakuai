import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onChange, label, placeholder, onKeyDown, ...props }, ref) => {
    const clear = (): void => onChange("");
    return (
      <div className={cn("relative", className)}>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600"
          aria-hidden="true"
        />
        <input
          ref={ref}
          type="search"
          autoComplete="off"
          spellCheck={false}
          aria-label={label}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && value) {
              e.preventDefault();
              clear();
            }
            onKeyDown?.(e);
          }}
          className={cn(
            "min-h-[var(--target-sm)] w-full rounded-md border border-border-strong bg-white pl-9 pr-12 text-sm text-neutral-800 placeholder:text-neutral-600",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
            "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-60",
          )}
          {...props}
        />
        {value ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Limpiar búsqueda"
            className="absolute right-0 top-0 grid h-[var(--target-sm)] w-[var(--target-sm)] place-items-center rounded-md text-neutral-600 transition-colors hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    );
  },
);
SearchInput.displayName = "SearchInput";

export { SearchInput };
