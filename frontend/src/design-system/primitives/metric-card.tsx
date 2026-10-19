import type { ReactNode } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  info?: string;
  tone?: "default" | "accent";
  className?: string;
}

export function MetricCard({
  label,
  value,
  hint,
  info,
  tone = "default",
  className,
}: MetricCardProps): React.JSX.Element {
  const content = (
    <>
      <span className="flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wide text-neutral-600">
        {label}
        {info ? <Info className="h-3 w-3 opacity-70" aria-hidden="true" /> : null}
      </span>
      <strong className="text-base font-bold leading-tight tabular-nums text-neutral-800">{value}</strong>
      {hint ? <span className="text-xs text-neutral-600">{hint}</span> : null}
    </>
  );

  const base = cn(
    "grid gap-1 rounded-lg border p-3 text-left",
    tone === "accent" ? "border-brand-soft bg-brand-soft" : "border-border bg-white",
    className,
  );

  if (!info) {
    return <div className={base}>{content}</div>;
  }

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        aria-label={`${label}: qué significa`}
        className={cn(
          base,
          "min-h-[var(--target-lg)] transition-colors hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        )}
      >
        {content}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={6}
          collisionPadding={8}
          className="z-50 max-w-xs rounded-lg border border-border bg-white p-3 text-xs leading-relaxed text-neutral-700 shadow-lg focus-visible:outline-none"
        >
          {info}
          <PopoverPrimitive.Arrow className="fill-white" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
