import type { Irrigation, IrrigationStatus } from "@/api/types";
import { fmtDateTime, fmtNum, toNum } from "@/lib/format";

export type StatusFilter = "todos" | IrrigationStatus;
export type PeriodFilter = "7d" | "30d" | "todo";
export type DeviationLevel = "none" | "ok" | "over" | "under";

/** Tolerancia del desvío: 100 L o 5 % de la recomendación, lo que sea mayor. */
export const DEVIATION_TOLERANCE_LITERS = 100;
export const DEVIATION_TOLERANCE_RATIO = 0.05;

export interface IrrigationFilters {
  query: string;
  status: StatusFilter;
  plotId: number | null;
  period: PeriodFilter;
  from: string | null;
  to: string | null;
}

export const EMPTY_FILTERS: IrrigationFilters = {
  query: "",
  status: "todos",
  plotId: null,
  period: "todo",
  from: null,
  to: null,
};

export function appliedLiters(item: Pick<Irrigation, "applied_liters">): number {
  return toNum(item.applied_liters) ?? 0;
}

export function recommendedLiters(item: Pick<Irrigation, "recommended_liters">): number | null {
  return toNum(item.recommended_liters);
}

export function deviationFor(item: Pick<Irrigation, "applied_liters" | "recommended_liters">): number | null {
  const recommended = recommendedLiters(item);
  if (recommended === null) return null;
  return appliedLiters(item) - recommended;
}

export function deviationLevelFor(
  applied: number,
  recommended: number | null,
): DeviationLevel {
  if (recommended === null) return "none";
  const deviation = applied - recommended;
  const tolerance = Math.max(DEVIATION_TOLERANCE_LITERS, recommended * DEVIATION_TOLERANCE_RATIO);
  if (Math.abs(deviation) <= tolerance) return "ok";
  return deviation > 0 ? "over" : "under";
}

export function deviationLevel(
  item: Pick<Irrigation, "applied_liters" | "recommended_liters">,
): DeviationLevel {
  return deviationLevelFor(appliedLiters(item), recommendedLiters(item));
}

export function isActionable(item: Pick<Irrigation, "status">): boolean {
  return item.status === "activo";
}

export function isActive(item: Pick<Irrigation, "status">): boolean {
  return item.status === "activo";
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Clave de día en hora local (`YYYY-MM-DD`), no en UTC. */
export function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dayKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "invalid";
  return localDayKey(date);
}

export function dayLabel(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  const diff = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86_400_000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  return date.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });
}

export function timeLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

/** Hora en 24h para la lista densa: "09:30". */
export function timeLabel24h(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function sortByOccurredDesc(items: Irrigation[]): Irrigation[] {
  return [...items].sort((a, b) => {
    const ta = Date.parse(a.occurred_at);
    const tb = Date.parse(b.occurred_at);
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
  });
}

export interface IrrigationDay {
  key: string;
  label: string;
  items: Irrigation[];
  appliedLiters: number;
  /** Suma de litros solo de riegos vigentes (coherente con el KPI "Agua aplicada"). */
  activeLiters: number;
}

export function groupByDay(items: Irrigation[], now = new Date()): IrrigationDay[] {
  const days = new Map<string, IrrigationDay>();
  for (const item of sortByOccurredDesc(items)) {
    const key = dayKey(item.occurred_at);
    const liters = appliedLiters(item);
    const active = isActive(item) ? liters : 0;
    const current = days.get(key);
    if (current) {
      current.items.push(item);
      current.appliedLiters += liters;
      current.activeLiters += active;
      continue;
    }
    days.set(key, {
      key,
      label: key === "invalid" ? "Sin fecha" : dayLabel(item.occurred_at, now),
      items: [item],
      appliedLiters: liters,
      activeLiters: active,
    });
  }
  return [...days.values()];
}

/** Litros con signo para la columna de diferencia: "+40 L", "−140 L", "0 L". */
export function signedLiters(deviation: number | null): string {
  if (deviation === null) return "—";
  const sign = deviation > 0 ? "+" : deviation < 0 ? "−" : "";
  return `${sign}${fmtNum(Math.abs(deviation))} L`;
}

export interface IrrigationSummary {
  activeCount: number;
  appliedLiters: number;
  recommendedLiters: number;
  deviation: number | null;
  level: DeviationLevel;
  withRecommendation: number;
}

export function summarize(items: Irrigation[]): IrrigationSummary {
  let activeCount = 0;
  let applied = 0;
  let appliedWithRecommendation = 0;
  let recommended = 0;
  let withRecommendation = 0;

  for (const item of items) {
    if (!isActive(item)) continue;
    activeCount += 1;
    applied += appliedLiters(item);
    const rec = recommendedLiters(item);
    if (rec !== null) {
      withRecommendation += 1;
      appliedWithRecommendation += appliedLiters(item);
      recommended += rec;
    }
  }

  const deviation = withRecommendation === 0 ? null : appliedWithRecommendation - recommended;
  return {
    activeCount,
    appliedLiters: applied,
    recommendedLiters: recommended,
    deviation,
    level: deviationLevelFor(appliedWithRecommendation, withRecommendation === 0 ? null : recommended),
    withRecommendation,
  };
}

export type StatusCounts = Record<StatusFilter, number>;

export function countByStatus(items: Irrigation[]): StatusCounts {
  const counts: StatusCounts = { todos: items.length, activo: 0, corregido: 0, anulado: 0 };
  for (const item of items) counts[item.status] += 1;
  return counts;
}

export function matchesQuery(item: Irrigation, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = `${item.id} ${item.plot?.name ?? ""} ${item.note ?? ""}`.toLowerCase();
  return haystack.includes(q);
}

/** Inicio inclusivo del período, con el día de hoy como último día. */
export function periodStart(period: PeriodFilter, now = new Date()): Date | null {
  if (period === "todo") return null;
  const days = period === "7d" ? 7 : 30;
  const start = startOfDay(now);
  start.setDate(start.getDate() - (days - 1));
  return start;
}

export function matchesPeriod(
  item: Irrigation,
  period: PeriodFilter,
  now = new Date(),
  from: string | null = null,
  to: string | null = null,
): boolean {
  const key = dayKey(item.occurred_at);
  if (key === "invalid") return false;
  if (from || to) {
    if (from && key < from) return false;
    if (to && key > to) return false;
    return true;
  }
  const start = periodStart(period, now);
  if (start === null) return true;
  return key >= localDayKey(start);
}

export function filterIrrigations(
  items: Irrigation[],
  filters: IrrigationFilters,
  now = new Date(),
): Irrigation[] {
  return sortByOccurredDesc(
    items.filter(
      (item) =>
        (filters.status === "todos" || item.status === filters.status) &&
        (filters.plotId === null || item.plot_id === filters.plotId) &&
        matchesQuery(item, filters.query) &&
        matchesPeriod(item, filters.period, now, filters.from, filters.to),
    ),
  );
}

export function hasActiveFilters(filters: IrrigationFilters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.status !== "todos" ||
    filters.plotId !== null ||
    filters.period !== "todo" ||
    filters.from !== null ||
    filters.to !== null
  );
}

export interface CorrectionChain {
  previous: Irrigation | null;
  next: Irrigation | null;
}

export function correctionChain(
  items: Irrigation[],
  current: Pick<Irrigation, "id" | "supersedes_id">,
): CorrectionChain {
  const previous =
    current.supersedes_id === null
      ? null
      : items.find((item) => item.id === current.supersedes_id) ?? null;
  const next = items.find((item) => item.supersedes_id === current.id) ?? null;
  return { previous, next };
}

export function plotName(item: Pick<Irrigation, "plot" | "plot_id">): string {
  return item.plot?.name ?? `Parcela #${item.plot_id}`;
}

/** Porcentaje de diferencia entre aplicado y recomendado: +12 %, −8 %, 0 %. */
export function deviationPercent(item: Pick<Irrigation, "applied_liters" | "recommended_liters">): number | null {
  const recommended = recommendedLiters(item);
  if (recommended === null || recommended === 0) return null;
  const applied = appliedLiters(item);
  return Math.round(((applied - recommended) / recommended) * 100);
}

/** Determina el tono y label de la píldora de estado para la tabla de historial. */
export type TableStatusTone = "success" | "warning" | "danger" | "neutral";
export type TableStatusLabel = "Cumplido" | "Más riego" | "Menos riego" | "Pendiente" | "Sin registro" | "Sin recomendación" | "Anulado" | "Corregido";

export function tableStatusInfo(item: Pick<Irrigation, "applied_liters" | "recommended_liters" | "status">): { tone: TableStatusTone; label: TableStatusLabel } {
  const recommended = recommendedLiters(item);

  if (recommended === null) return { tone: "neutral", label: "Sin recomendación" };
  if (item.status === "anulado") return { tone: "neutral", label: "Anulado" };
  if (item.status === "corregido") return { tone: "warning", label: "Corregido" };

  // Solo riegos vigentes con recomendación
  const pct = deviationPercent(item);
  if (pct === null) return { tone: "neutral", label: "Sin recomendación" };

  if (Math.abs(pct) <= 10) return { tone: "success", label: "Cumplido" };
  if (pct > 10) return { tone: "warning", label: "Más riego" };
  return { tone: "danger", label: "Menos riego" };
}

/** Filas planas para la tabla de historial (protótipo: combina irrigaciones + evaluaciones pendientes). */
export interface HistRow {
  id: number;
  ts: string;
  plotId: number;
  plotName: string;
  recommended: number | null;
  applied: number | null;
  /** true si es una evaluación pendiente de registro (no hay irrigación aún). */
  pending: boolean;
}

export function histRows(
  irrigations: Irrigation[],
  evaluations: Map<number, { decision: string; lo: number | null; ts: string }>,
  plots: Map<number, string>,
): HistRow[] {
  const rows: HistRow[] = [];

  // Irrigaciones reales
  for (const irr of irrigations) {
    rows.push({
      id: irr.id,
      ts: irr.occurred_at,
      plotId: irr.plot_id,
      plotName: plots.get(irr.plot_id) ?? `Parcela #${irr.plot_id}`,
      recommended: recommendedLiters(irr),
      applied: appliedLiters(irr),
      pending: false,
    });
  }

  // Evaluaciones con decisión "riega" que aún no tienen irrigación registrada ese día
  for (const [plotId, ev] of evaluations) {
    if (ev.decision === "riega" && ev.lo !== null) {
      const evDate = new Date(ev.ts).toDateString();
      const hasIrrToday = irrigations.some(
        (i) => i.plot_id === plotId && new Date(i.occurred_at).toDateString() === evDate,
      );
      if (!hasIrrToday) {
        rows.push({
          id: -(plotId * 1000), // id sintético negativo
          ts: ev.ts,
          plotId,
          plotName: plots.get(plotId) ?? `Parcela #${plotId}`,
          recommended: ev.lo,
          applied: null,
          pending: true,
        });
      }
    }
  }

  return rows.sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts));
}

/** Agrupa filas por día para el gráfico de 7 días. */
export interface HistDay {
  key: string;
  label: string; // "Lun", "Mar", etc.
  recommended: number;
  applied: number;
}

export function histDays(rows: HistRow[], now = new Date()): HistDay[] {
  const out: HistDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const dayRows = rows.filter((r) => new Date(r.ts).toDateString() === key);
    const recommended = dayRows.reduce((s, r) => s + (r.recommended ?? 0), 0);
    const applied = dayRows.reduce((s, r) => s + (r.applied ?? 0), 0);
    const label = d.toLocaleDateString("es-PE", { weekday: "short" }).replace(".", "").slice(0, 3);
    out.push({ key, label, recommended, applied });
  }
  return out;
}

/** Etiqueta corta de día para gráfico: "Lun", "Mar"… */
export function dayLabelShort(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-PE", { weekday: "short" }).replace(".", "").slice(0, 3);
}

/** Clase de píldora suave para la diferencia en la lista. */
export function diffPillClass(level: DeviationLevel): string {
  switch (level) {
    case "ok":
      return "bg-success-bg text-success-fg";
    case "over":
      return "bg-warning-bg text-warning-fg";
    case "under":
      return "bg-danger-bg text-danger-fg";
    default:
      return "bg-neutral-bg text-neutral-fg";
  }
}

/** Etiqueta de la píldora de diferencia. */
export function diffPillLabel(level: DeviationLevel): string {
  switch (level) {
    case "ok":
      return "En rango";
    case "over":
      return "Por encima";
    case "under":
      return "Por debajo";
    default:
      return "Sin recomendación";
  }
}

/** Datos de comparación para el detalle (antes → ahora). */
export interface ComparisonData {
  applied: { before: number; after: number };
  recommended: { before: number | null; after: number | null };
  labelBefore: string;
  labelAfter: string;
  dateBefore: string;
  dateAfter: string;
  openLabel: string;
  openAction: () => void;
}

export function buildComparisonData(
  items: Irrigation[],
  current: Irrigation,
  onOpenRelated: (item: Irrigation) => void,
): ComparisonData | null {
  const chain = correctionChain(items, current);
  const related = chain.previous ?? chain.next;
  if (!related) return null;

  const before = chain.previous ? chain.previous : current;
  const after = chain.next ? chain.next : current;

  return {
    applied: { before: appliedLiters(before), after: appliedLiters(after) },
    recommended: { before: recommendedLiters(before), after: recommendedLiters(after) },
    labelBefore: chain.previous ? "Antes" : "Ahora",
    labelAfter: chain.previous ? "Ahora" : "Después",
    dateBefore: fmtDateTime(before.occurred_at),
    dateAfter: fmtDateTime(after.occurred_at),
    openLabel: chain.previous ? "Abrir registro anterior" : "Abrir registro siguiente",
    openAction: () => onOpenRelated(related),
  };
}
