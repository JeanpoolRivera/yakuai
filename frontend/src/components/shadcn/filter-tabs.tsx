import { useRef } from "react";
import { cn } from "@/lib/utils";

/** Filtro segmentado con el mismo contrato que `Tabs` legacy
 * (`components/ui/Navigation.tsx`): botones con navegación por teclado.
 */
export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  label: string;
}): React.JSX.Element {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  function onKey(e: React.KeyboardEvent, idx: number): void {
    let next: number | null = null;
    if (e.key === "ArrowRight") next = (idx + 1) % options.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + options.length) % options.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = options.length - 1;
    if (next !== null) {
      e.preventDefault();
      onChange(options[next].value);
      refs.current[next]?.focus();
    }
  }
  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-neutral-100 p-1" role="group" aria-label={label}>
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            aria-pressed={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15",
              active ? "bg-white text-neutral-800 shadow-sm" : "text-neutral-500 hover:text-neutral-800"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}