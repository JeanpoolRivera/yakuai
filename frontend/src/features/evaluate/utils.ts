import type { EvalPlan, EvalSnapshot } from "@/api/types";
import { fmtNum } from "@/lib/format";

export interface HumidityReading {
  actual: number | null;
  threshold: number | null;
  pmp: number | null;
}

/** Backend: `humedad_pct` en porcentaje; `umbral`/`pmp` en fracción. */
export function humidityFromSnapshot(snapshot: EvalSnapshot | null | undefined): HumidityReading {
  const actual = typeof snapshot?.humedad_pct === "number" ? snapshot.humedad_pct : null;
  const threshold = typeof snapshot?.umbral === "number" ? snapshot.umbral * 100 : null;
  const pmp = typeof snapshot?.pmp === "number" ? snapshot.pmp * 100 : null;
  return { actual, threshold, pmp };
}

export interface RainReading {
  mm: number | null;
  probability: number | null;
}

export function rainFromSnapshot(snapshot: EvalSnapshot | null | undefined): RainReading {
  const mm = typeof snapshot?.rain_mm === "number" ? snapshot.rain_mm : null;
  const probability = typeof snapshot?.rain_prob === "number" ? Math.round(snapshot.rain_prob * 100) : null;
  return { mm, probability };
}

export function planFromSnapshot(snapshot: EvalSnapshot | null | undefined): EvalPlan | null {
  const plan = snapshot?.plan;
  if (!plan || typeof plan !== "object") return null;
  if (typeof plan.inicio !== "string" || typeof plan.litros !== "number" || typeof plan.jornadas !== "number") {
    return null;
  }
  return plan;
}

export function litersRange(
  min: string | number | null | undefined,
  max: string | number | null | undefined,
): string | null {
  if (min === null || min === undefined || max === null || max === undefined) return null;
  return `${fmtNum(min)}–${fmtNum(max)} litros`;
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function dayLabel(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const diff = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}

export function timeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}
