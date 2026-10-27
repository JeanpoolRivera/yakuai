import { fmtDate, fmtNum } from "@/lib/format";
import type { Irrigation } from "@/api/types";
import { appliedLiters, recommendedLiters, deviationPercent } from "../utils";
import type { IrrigationDay } from "../utils";

export interface IrrigationLedgerProps {
  days: IrrigationDay[];
  onOpen: (item: Irrigation) => void;
  irrigations: Irrigation[];
  visibleIrrigations?: Irrigation[];
}

const TH_CLASS = "px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-neutral-600";

const DIFF_TONE_CLASS = {
  success: "text-success-fg",
  warning: "text-warning-fg",
  danger: "text-danger-fg",
  neutral: "text-neutral-500",
} as const;

function buildChartDays(irrigations: Irrigation[]) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const dayIrrs = irrigations.filter((irr) => new Date(irr.occurred_at).toDateString() === key);
    const rec = dayIrrs.reduce((s, irr) => s + (recommendedLiters(irr) ?? 0), 0);
    const app = dayIrrs.reduce((s, irr) => s + appliedLiters(irr), 0);
    const label = d.toLocaleDateString("es-PE", { weekday: "short" }).replace(".", "").slice(0, 3);
    days.push({ label, recommended: rec, applied: app });
  }
  return days;
}

function compliancePct(irrigations: Irrigation[]) {
  const completed = irrigations.filter(
    (i) => i.status === "activo" && recommendedLiters(i) !== null && recommendedLiters(i) !== 0,
  );
  const within = completed.filter((i) => Math.abs(deviationPercent(i) ?? 100) <= 10).length;
  return completed.length > 0 ? Math.round((within / completed.length) * 100) : 0;
}

function statusElement(irr: Irrigation): React.JSX.Element {
  if (irr.status === "anulado") return <span className="text-neutral-600">Anulado</span>;
  const pct = deviationPercent(irr);
  if (pct === null) return <span className="text-neutral-600">Sin recomendación</span>;
  if (Math.abs(pct) <= 10) return <span className="font-semibold text-success-fg">Cumplido</span>;
  if (pct > 10) return <span className="font-semibold text-warning-fg">Más riego</span>;
  return <span className="font-semibold text-danger-fg">Menos riego</span>;
}

export function IrrigationLedger({
  days,
  onOpen,
  irrigations,
  visibleIrrigations,
}: IrrigationLedgerProps): React.JSX.Element | null {
  if (irrigations.length === 0) return null;

  const chartDays = buildChartDays(irrigations);
  const maxRec = Math.max(...chartDays.map((d) => d.recommended), 1);
  const maxApp = Math.max(...chartDays.map((d) => d.applied), 1);
  const compliance = compliancePct(irrigations);

  const rows = (visibleIrrigations ?? irrigations)
    .slice()
    .sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at));

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      {/* KPI strip: gráfico 7 días + cumplimiento */}
      <div className="grid gap-4 border-b border-border bg-neutral-50/50 p-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-white p-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="text-sm font-semibold text-neutral-800">Últimos 7 días</h3>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <span className="h-0.5 w-3 rounded bg-teal-100" />
                Recomendado
              </span>
              <span className="flex items-center gap-1">
                <span className="h-0.5 w-3 rounded bg-teal-600" />
                Aplicado
              </span>
            </div>
          </div>
          <div className="flex h-24 items-end justify-around gap-1">
            {chartDays.map((day, idx) => (
              <div key={idx} className="flex flex-1 flex-col items-center justify-end gap-1">
                <div className="flex h-full gap-0.5">
                  <div
                    className="flex-1 rounded-t bg-teal-100"
                    style={{ height: day.recommended > 0 ? `${(day.recommended / maxRec) * 100}%` : "0%" }}
                  />
                  <div
                    className="flex-1 rounded-t bg-teal-600"
                    style={{ height: day.applied > 0 ? `${(day.applied / maxApp) * 100}%` : "0%" }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-neutral-600">{day.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-4">
          <h3 className="mb-4 text-sm font-semibold text-neutral-800">Cumplimiento</h3>
          <div className="text-4xl font-bold tracking-tight text-neutral-900">{compliance} %</div>
          <p className="mt-2 mb-4 text-xs text-neutral-500">de los riegos dentro de ±10 % de lo recomendado</p>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-teal-600 transition-all duration-300"
              style={{ width: `${compliance}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm" role="table">
          <thead>
            <tr className="border-b border-border bg-neutral-50">
              <th scope="col" className={`${TH_CLASS} text-left`}>Fecha</th>
              <th scope="col" className={`${TH_CLASS} text-left`}>Parcela</th>
              <th scope="col" className={`${TH_CLASS} text-right`}>Recomendado</th>
              <th scope="col" className={`${TH_CLASS} text-right`}>Aplicado</th>
              <th scope="col" className={`${TH_CLASS} text-right`}>Diferencia</th>
              <th scope="col" className={`${TH_CLASS} text-left`}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((irr) => {
              const rec = recommendedLiters(irr);
              const app = appliedLiters(irr);
              const pct = deviationPercent(irr);
              const diffDisplay = pct === null ? "—" : `${pct > 0 ? "+" : ""}${pct} %`;
              const tone: keyof typeof DIFF_TONE_CLASS =
                pct === null ? "neutral" : Math.abs(pct) <= 10 ? "success" : pct > 10 ? "warning" : "danger";
              const plotName = days.flatMap((d) => d.items).find((i) => i.id === irr.id)?.plot?.name;

              return (
                <tr
                  key={irr.id}
                  className="border-b border-border/60 transition-colors hover:bg-neutral-50"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold tabular-nums text-neutral-800">
                    <button
                      type="button"
                      className="rounded-sm text-left underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      aria-label={`Ver detalle del riego de ${plotName ?? `Parcela #${irr.plot_id}`} del ${fmtDate(irr.occurred_at)}`}
                      onClick={() => onOpen(irr)}
                    >
                      {fmtDate(irr.occurred_at)}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-neutral-800">
                    {plotName ?? `Parcela #${irr.plot_id}`}
                  </td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-neutral-700">
                    {rec !== null ? `${fmtNum(rec)} L` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-neutral-700">
                    {fmtNum(app)} L
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums ${DIFF_TONE_CLASS[tone]}`}>
                      {diffDisplay}
                    </span>
                  </td>
                  <td className="px-4 py-3">{statusElement(irr)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
