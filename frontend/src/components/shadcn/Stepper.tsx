import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stepper({ steps, current }: { steps: string[]; current: number }): React.JSX.Element {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-3" aria-label="Progreso del formulario">
      {steps.map((s, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li
            key={s}
            aria-current={active ? "step" : undefined}
            className={cn(
              "flex min-w-0 items-center gap-2 text-sm leading-snug",
              done || active ? "font-medium text-neutral-800" : "text-neutral-500"
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "grid h-7 w-7 place-items-center rounded-full border text-xs font-semibold",
                done
                  ? "border-primary-700 bg-primary-700 text-white"
                  : active
                    ? "border-primary-700 text-primary-700"
                    : "border-neutral-400 text-neutral-500"
              )}
            >
              {done ? <Check className="h-4 w-4" /> : n}
            </span>
            {s}
            {n < steps.length ? <span aria-hidden="true" className="mx-1 h-px w-6 shrink-0 bg-neutral-300" /> : null}
          </li>
        );
      })}
    </ol>
  );
}