import type { Evaluation, IrrigationSystem } from "@/api/types";

export function verdictTitle(evaluation: Pick<Evaluation, "result" | "is_critical">): string {
  if (evaluation.result === "riega") return evaluation.is_critical ? "Riego prioritario" : "Es momento de regar";
  if (evaluation.result === "no") return "No es necesario regar";
  if (evaluation.result === "espera") return "Espera antes de regar";
  return "Revisar datos";
}

export const INCOMPLETE_HELP: Record<string, { text: string; to: string; action: string }> = {
  sin_humedad_valida: {
    text: "Registra una lectura reciente para poder decidir.",
    to: "/sensores",
    action: "Ir a sensores",
  },
  sin_clima_valido: {
    text: "Actualiza el pronóstico de la parcela para poder decidir.",
    to: "/clima",
    action: "Ir a clima",
  },
};

export const INCOMPLETE_FALLBACK = "Faltan datos para decidir. Revisa la información de la parcela.";
export const FARMER_CONTACT_COPY = "Contacta a tu técnico para actualizar los datos de esta parcela.";

export const REASON_SHORT: Record<string, string> = {
  humedad_suficiente: "Suficiente",
  bajo_umbral: "Bajo umbral",
  humedad_critica: "Crítica",
  lluvia_prevista_suficiente: "Viene lluvia",
  sin_humedad_valida: "Falta humedad",
  sin_clima_valido: "Falta clima",
};

export function reasonShort(value: string | null | undefined): string {
  if (!value) return "—";
  return REASON_SHORT[value] ?? value;
}

export const PLOT_HEADER_NOTE = {
  farmer: "El punto de partida de tu evaluación.",
  staff: "Parcelas de tu zona asignada.",
} as const;

export const IRRIGATION_SYSTEM_LABEL: Record<IrrigationSystem, string> = {
  goteo: "Goteo",
  aspersion: "Aspersión",
  gravedad: "Gravedad",
};

export const PLAN_EARLY_NOTE = "Riega temprano (05:30–07:00) para que el agua rinda más.";
