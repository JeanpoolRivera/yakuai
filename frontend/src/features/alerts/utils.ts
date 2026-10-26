import type { AlertItem, Plot } from "@/api/types";

export type AlertTone = "critica" | "sensor" | "incompleta";

export function toneOf(a: AlertItem): AlertTone {
  if (a.tipo.includes("critica")) return "critica";
  if (a.tipo.startsWith("sensor")) return "sensor";
  return "incompleta";
}

export function plotLabel(a: AlertItem & { plot?: Plot }): string | null {
  if (a.plot?.name) return a.plot.name;
  if (a.plot_id) return `Parcela #${a.plot_id}`;
  return null;
}

export const ALERT_HELP: Record<string, { hint: string }> = {
  sensor_sin_datos: { hint: "El sensor no envía lecturas. Revisa su conexión o registra una lectura manual." },
  sensor_anomalo: { hint: "El sensor reporta un valor imposible y está en revisión. Verifica el dispositivo." },
  evaluacion_incompleta: { hint: "La última evaluación quedó incompleta por falta de datos. Complétalos y vuelve a evaluar." },
  humedad_critica: { hint: "La humedad está en nivel crítico. Evalúa la parcela y riega hoy mismo." },
};

export const ALERT_LABELS: Record<string, string> = {
  sensor_sin_datos: "Sensor sin datos",
  sensor_anomalo: "Sensor anómalo",
  evaluacion_incompleta: "Evaluación incompleta",
  humedad_critica: "Humedad crítica",
};

export function toneColor(tone: AlertTone): string {
  switch (tone) {
    case "critica": return "danger";
    case "sensor": return "warning";
    default: return "info";
  }
}

export function alertSeverityRank(alert: AlertItem): number {
  if (alert.tipo.includes("critica")) return 0;
  if (alert.tipo.startsWith("sensor")) return 1;
  if (alert.tipo === "evaluacion_incompleta") return 2;
  return 3;
}

export function alertTypeLabel(tipo: string): string {
  return ALERT_LABELS[tipo] ?? tipo.replace(/_/g, " ");
}