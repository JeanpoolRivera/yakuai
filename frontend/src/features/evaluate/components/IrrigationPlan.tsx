import { CalendarDays, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtDateTime } from "@/lib/format";
import type { Evaluation } from "@/api/types";
import { PLAN_EARLY_NOTE } from "../copy";
import { planFromSnapshot } from "../utils";

export interface IrrigationPlanProps {
  evaluation: Pick<Evaluation, "inputs_snapshot">;
  className?: string;
}

export function IrrigationPlan({ evaluation, className }: IrrigationPlanProps): React.JSX.Element | null {
  const plan = planFromSnapshot(evaluation.inputs_snapshot);
  if (!plan) return null;

  return (
    <section aria-labelledby="irrigation-plan-title" className={cn("grid gap-4 border-t border-border p-6", className)}>
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-brand" aria-hidden="true" />
        <h3 id="irrigation-plan-title" className="text-base font-semibold text-neutral-800">
          Plan de riego
        </h3>
      </div>

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="grid gap-1">
          <dt className="text-xs text-neutral-600">Inicio</dt>
          <dd className="text-base font-semibold tabular-nums text-neutral-800">{fmtDateTime(plan.inicio)}</dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-xs text-neutral-600">Fin</dt>
          <dd className="text-base font-semibold tabular-nums text-neutral-800">
            {plan.fin ? fmtDateTime(plan.fin) : "—"}
          </dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-xs text-neutral-600">Duración</dt>
          <dd className="text-base font-semibold tabular-nums text-neutral-800">
            {plan.minutos !== null ? `${plan.minutos} min` : "—"}
          </dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-xs text-neutral-600">Jornadas</dt>
          <dd className="text-base font-semibold tabular-nums text-neutral-800">{plan.jornadas}</dd>
        </div>
      </dl>

      <p className="flex items-start gap-3 rounded-lg bg-warning-bg p-4 text-xs leading-relaxed text-warning-fg">
        <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{plan.nota ?? PLAN_EARLY_NOTE}</span>
      </p>
    </section>
  );
}
