import { cn } from "@/lib/utils";
import { Badge, type BadgeProps } from "@/design-system/primitives";

export interface SoilMoistureMeterProps {
  actual: number | null;
  threshold: number | null;
  pmp: number | null;
  showTechnical?: boolean;
  className?: string;
}

type MeterState = "ok" | "low" | "crit";

const STATE: Record<MeterState, { label: string; badge: NonNullable<BadgeProps["tone"]>; fill: string }> = {
  ok: { label: "Adecuado", badge: "success", fill: "bg-brand" },
  low: { label: "Bajo umbral", badge: "warning", fill: "bg-warning-fg" },
  crit: { label: "Crítico", badge: "danger", fill: "bg-danger-fg" },
};

function clampPct(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function SoilMoistureMeter({ actual, threshold, pmp, showTechnical = true, className }: SoilMoistureMeterProps): React.JSX.Element {
  const hasData = actual !== null && Number.isFinite(actual);
  const state: MeterState | null = !hasData
    ? null
    : pmp !== null && actual <= pmp
      ? "crit"
      : threshold !== null && actual <= threshold
        ? "low"
        : "ok";
  const pct = hasData ? clampPct(actual) : 0;
  const mark = threshold !== null && Number.isFinite(threshold) ? clampPct(threshold) : null;
  const meta = state ? STATE[state] : null;
  const label = meta?.label ?? "";

  return (
    <div className={cn("flex flex-1 flex-col justify-between gap-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong className="text-lg font-bold tracking-tight tabular-nums text-neutral-900">
          {hasData ? `${actual.toFixed(1)}%` : "—"}
        </strong>
        {meta ? <Badge tone={meta.badge}>{meta.label}</Badge> : <span className="text-xs text-neutral-600">Sin dato de humedad</span>}
      </div>

      {hasData ? (
        <div
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Humedad ${pct.toFixed(1)} por ciento, ${label}`}
          className="relative h-2.5 overflow-hidden rounded-full bg-border"
        >
          <div className={cn("h-full rounded-full transition-[width]", meta?.fill)} style={{ width: `${pct}%` }} />
          {mark !== null && showTechnical ? (
            <span
              aria-hidden="true"
              className="absolute inset-y-0 w-0.5 bg-neutral-900"
              style={{ left: `${mark}%` }}
              title={`Umbral ${mark.toFixed(1)}%`}
            />
          ) : null}
        </div>
      ) : (
        <div aria-hidden="true" className="h-2.5 rounded-full bg-border/70" />
      )}

      {showTechnical ? (
        <div className="flex items-center justify-between gap-2 text-xs text-neutral-700">
          <span className="rounded-full bg-neutral-bg px-2 py-0.5 tabular-nums">PMP {pmp !== null ? `${pmp.toFixed(1)}%` : "—"}</span>
          <span className="rounded-full bg-neutral-bg px-2 py-0.5 tabular-nums">
            Umbral {threshold !== null ? `${threshold.toFixed(1)}%` : "—"}
          </span>
        </div>
      ) : (
        <div aria-hidden="true" className="min-h-[1.5rem]" />
      )}
    </div>
  );
}
