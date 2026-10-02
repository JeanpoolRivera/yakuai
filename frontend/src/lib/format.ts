/* Formato de fechas, números y etiquetas (es-PE, vista America/Lima). */

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-PE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtNum(n: number | string | null | undefined, digits = 0): string {
  if (n === null || n === undefined || n === "") return "—";
  const v = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString("es-PE", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export function toNum(n: string | number | null | undefined): number | null {
  if (n === null || n === undefined || n === "") return null;
  const v = typeof n === "string" ? Number(n) : n;
  return Number.isFinite(v) ? v : null;
}

export function initial(name: string | null | undefined): string {
  const c = (name ?? "?").trim().charAt(0);
  return c ? c.toUpperCase() : "?";
}

/** Minutos transcurridos desde una fecha ISO hasta ahora. Null si inválida. */
export function ageMinutes(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.round((Date.now() - t) / 60000));
}

export function ageLabel(iso: string | null | undefined): string {
  const m = ageMinutes(iso);
  if (m === null) return "sin dato";
  if (m < 1) return "ahora mismo";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

export const RESULT_LABEL: Record<string, string> = {
  riega: "Regar",
  no: "Todo bien",
  espera: "Esperar",
  incompleta: "Revisar datos",
};

export function resultLabel(v: string | null | undefined): string {
  if (!v) return "—";
  return RESULT_LABEL[v] ?? v;
}

/** Tono de badge según resultado + criticidad. */
export function badgeToneForResult(result: string, critical: boolean): string {
  if (critical) return "critica";
  if (result === "riega") return "riega";
  if (result === "no") return "no";
  if (result === "espera") return "espera";
  return "incompleta";
}

/** Fecha-hora local actual en formato `datetime-local` (para inputs). */
export function nowLocalInput(): string {
  const d = new Date();
  const p = (n: number): string => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Convierte valor `datetime-local` a ISO legible por el backend. */
export function localInputToIso(v: string): string {
  if (!v) return new Date().toISOString().slice(0, 19);
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 19);
  return d.toISOString().slice(0, 19);
}

/** Hoy en formato YYYY-MM-DD para inputs date. */
export function todayInput(): string {
  const d = new Date();
  const p = (n: number): string => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
