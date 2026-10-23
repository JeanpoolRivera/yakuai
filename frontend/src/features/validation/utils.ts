import type { ValidationReport } from "@/api/types";

export function detailLabel(detalle: string): string {
  const [code, ...rest] = detalle.split(" ");
  const mapped = reasonLabel(code);
  return mapped === code ? detalle : `${mapped}${rest.length > 0 ? ` ${rest.join(" ")}` : ""}`;
}

export function reasonLabel(code: string): string {
  const map: Record<string, string> = {
    ok: "Correcto",
    falta_dato: "Falta dato",
    sensor_vencido: "Sensor vencido",
    clima_vencido: "Clima vencido",
    lluvia_alta: "Lluvia alta",
    suelo_critico: "Suelo crítico",
    rango_50l: "Rango 50L",
  };
  return map[code] ?? code;
}

export function resultLabel(result: string): string {
  const map: Record<string, string> = {
    riega: "Riega",
    no: "No riega",
    espera: "Espera",
    incompleta: "Incompleta",
  };
  return map[result] ?? result;
}

export function pctPassed(report: ValidationReport | null): number {
  if (!report || report.total === 0) return 0;
  return Math.round((report.passed / report.total) * 100);
}

export function isAllPassed(report: ValidationReport | null): boolean {
  return report !== null && report.passed === report.total;
}

export function filterCases(cases: ValidationReport["cases"], tab: "todos" | "ok" | "fallos", query: string) {
  let result = [...cases];
  if (tab === "ok") result = result.filter((c) => c.ok);
  else if (tab === "fallos") result = result.filter((c) => !c.ok);
  if (query.trim()) {
    const q = query.trim().toLowerCase();
    result = result.filter((c) => `${c.caso} ${c.detalle}`.toLowerCase().includes(q));
  }
  return result;
}