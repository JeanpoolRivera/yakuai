import type { ReactNode } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/shadcn/input";
import { cn } from "@/lib/utils";

export function FilterBar({ children, label = "Filtros", className }: { children: ReactNode; label?: string; className?: string }): React.JSX.Element {
  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap items-end gap-3", className)}>
      {children}
    </div>
  );
}


export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
  className?: string;
}): React.JSX.Element {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
      <Input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-12"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
          className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/20"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}