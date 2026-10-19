import { Accessibility } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFieldMode } from "@/hooks/useFieldMode";

export interface FieldModeToggleProps {
  className?: string;
}

export function FieldModeToggle({ className }: FieldModeToggleProps): React.JSX.Element {
  const { enabled, toggle } = useFieldMode();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={toggle}
      className={cn(
        "inline-flex min-h-[var(--target-sm)] items-center gap-2 rounded-md border border-border-strong bg-white px-3 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        className,
      )}
    >
      <Accessibility className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
      <span>Modo campo</span>
      <span
        aria-hidden="true"
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors",
          enabled ? "border-brand bg-brand" : "border-border-strong bg-neutral-100",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 h-4 w-4 rounded-full border border-border-strong bg-white shadow-xs transition-transform",
            enabled && "translate-x-4",
          )}
        />
      </span>
    </button>
  );
}
