import type { Evaluation, IrrigationSystem } from "@/api/types";

export function verdictTitle(evaluation: Pick<Evaluation, "result" | "is_critical">): string {
  if (evaluation.result === "riega") return evaluation.is_critical ? "Riego prioritario" : "Es momento de regar";
  if (evaluation.result === "no") return "No es necesario regar";
  if (evaluation.result === "espera") return "Espera antes de regar";
  return "Revisar datos";
}

export const INCOMPLETE_HELP: Record<string, { text: string; to: string; action: string }> = {
  sin_humedad_valida: {
    text: "No hay una lectura de humedad reciente. Conecta el Arduino o registra una lectura.",
    to: "/sensores",
    action: "Revisar sensores",
  },
  sin_clima_valido: {
    text: "El pronóstico está vencido o no disponible. Actualízalo para evaluar.",
    to: "/clima",
    action: "Actualizar clima",
  },
};

export const INCOMPLETE_FALLBACK = "Faltan datos recientes. Revisa la humedad, el clima y la parcela.";
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

export const PLAN_EARLY_NOTE = "Horario sugerido para reducir la pérdida de agua.";
