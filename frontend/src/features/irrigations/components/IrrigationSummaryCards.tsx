import { Badge, Card } from "@/design-system/primitives";
import { cn } from "@/lib/utils";
import { fmtNum } from "@/lib/format";
import { deviationLabel, deviationTone } from "../copy";
import type { IrrigationSummary } from "../utils";

export interface IrrigationSummaryCardsProps {
  summary: IrrigationSummary;
  className?: string;
}

export function IrrigationSummaryCards({
  summary,
  className,
}: IrrigationSummaryCardsProps): React.JSX.Element {
  const deviation =
    summary.deviation === null
      ? "—"
      : summary.deviation === 0
        ? "Sin diferencia"
        : `${fmtNum(Math.abs(summary.deviation))} L ${
            summary.deviation > 0 ? "por encima" : "por debajo"
          }`;

  return (
    <Card aria-label="Resumen del período" className={cn("grid overflow-hidden sm:grid-cols-3", className)}>
      <div className="bg-brand-soft p-5 sm:p-6">
        <p className="text-[10.5px] font-bold uppercase tracking-wide text-brand">Agua aplicada</p>
        <p className="mt-2 flex items-baseline gap-1.5">
          <span className="text-d2 font-bold leading-none tracking-tight tabular-nums text-neutral-900">
            {fmtNum(summary.appliedLiters)}
          </span>
          <span className="text-sm font-semibold text-neutral-700">L</span>
        </p>
        <p className="mt-2 text-xs text-neutral-700">Solo registros vigentes</p>
      </div>

      <div className="border-t border-border p-5 sm:border-l sm:border-t-0 sm:p-6">
        <p className="text-[10.5px] font-bold uppercase tracking-wide text-neutral-600">
          Riegos vigentes
        </p>
        <p className="mt-2 text-d3 font-bold leading-none tracking-tight tabular-nums text-neutral-900">
          {fmtNum(summary.activeCount)}
        </p>
        <p className="mt-2 text-xs text-neutral-600">en el período</p>
      </div>

      <div className="border-t border-border p-5 sm:border-l sm:border-t-0 sm:p-6">
        <p className="text-[10.5px] font-bold uppercase tracking-wide text-neutral-600">
          Diferencia
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-d3 font-bold leading-none tracking-tight tabular-nums text-neutral-900">
            {deviation}
          </span>
          <Badge tone={deviationTone(summary.level)} dot>
            {deviationLabel(summary.level)}
          </Badge>
        </div>
        <p className="mt-2 text-xs text-neutral-600">
          {summary.withRecommendation === 0
            ? "Sin recomendación para comparar"
            : `vs ${fmtNum(summary.recommendedLiters)} L recomendados`}
        </p>
      </div>
    </Card>
  );
}