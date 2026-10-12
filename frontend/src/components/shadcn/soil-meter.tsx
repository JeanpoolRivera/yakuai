import { Badge } from "@/components/shadcn/badge";
import { cn } from "@/lib/utils";

/** Humedad y umbrales en porcentaje (0-100).
 * El backend entrega `humedad_pct` en porcentaje y `umbral`/`pmp` en fracción.
 * Los callers convierten la fracción a porcentaje antes de usar este componente.
 * (Lógica portada de `components/ui/Irrigation.tsx:SoilMeter`; cambia solo el visual.)
 */
export function SoilMeter({
  actual,
  umbral,
  critico,
}: {
  actual: number | null;
  umbral: number | null;
  critico: number | null;
}): React.JSX.Element {
  if (actual === null || umbral === null || !Number.isFinite(actual) || !Number.isFinite(umbral)) {
    return <span className="text-xs text-neutral-500">Sin dato de humedad</span>;
  }
  const pct = Math.max(0, Math.min(100, actual));
  const threshold = Math.max(0, Math.min(100, umbral));
  const rawCritical = critico ?? 0;
  const critical = Number.isFinite(rawCritical) ? Math.max(0, Math.min(100, rawCritical)) : 0;
  const state = pct <= critical ? "crit" : pct <= threshold ? "low" : "ok";
  const label = pct <= critical ? "Crítico — regar hoy" : pct <= threshold ? "Bajo umbral" : "Adecuado";
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <strong className="text-sm font-semibold tabular-nums text-neutral-800">{pct.toFixed(1)} %</strong>
        <Badge variant={state === "crit" ? "destructive" : state === "low" ? "warning" : "success"}>{label}</Badge>
      </div>
      <div
        className="relative h-2.5 overflow-hidden rounded-full bg-neutral-200"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Humedad ${pct.toFixed(1)} por ciento, ${label}`}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width]",
            state === "crit" ? "bg-danger-500" : state === "low" ? "bg-warning-500" : "bg-primary-600"
          )}
          style={{ width: `${pct}%` }}
        />
        <span
          aria-hidden="true"
          className="absolute inset-y-0 w-0.5 bg-neutral-800"
          style={{ left: `${threshold}%` }}
          title={`Umbral ${threshold.toFixed(1)}%`}
        />
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
        <span className="rounded bg-neutral-100 px-1.5 py-0.5">PMP {critico !== null ? `${critical.toFixed(1)}%` : "—"}</span>
        <span className="rounded bg-neutral-100 px-1.5 py-0.5">Umbral {threshold.toFixed(1)}%</span>
      </div>
    </div>
  );
}