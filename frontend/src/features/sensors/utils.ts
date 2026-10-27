export const TIPOS = [
  { value: "humedad", label: "Humedad de suelo", model: "YL-69" },
  { value: "aire_temp", label: "Temperatura del aire", model: "DHT11" },
  { value: "aire_hr", label: "Humedad del aire", model: "DHT11" },
  { value: "lluvia", label: "Lluvia (sí/no)", model: "FC-37" },
  { value: "caudal", label: "Caudal", model: "YF-S201" },
];

export const STATUS_LABEL: Record<string, string> = {
  ok: "Operativo",
  anomalo: "En revisión",
  sin_datos: "Sin datos",
};

export function rangeMessage(type: string, raw: number): string | null {
  if (!Number.isFinite(raw)) return "Escribe un valor numérico.";
  switch (type) {
    case "humedad":
      return !Number.isInteger(raw) || raw < 0 || raw > 1023 ? "YL-69 entrega 0–1023 en crudo. Revisa el valor." : null;
    case "aire_temp":
      return raw < -10 || raw > 60 ? "DHT11 mide de -10 a 60 °C. Revisa el valor." : null;
    case "aire_hr":
      return raw < 0 || raw > 100 ? "DHT11 mide humedad relativa de 0 a 100. Revisa el valor." : null;
    case "lluvia":
      return raw !== 0 && raw !== 1 ? "FC-37 solo avisa lluvia sí/no (valores 0 o 1). Revisa el valor." : null;
    case "caudal":
      return raw < 0 || raw > 60 ? "Caudal YF-S201: rango válido 0–60. Revisa el valor." : null;
    default:
      return null;
  }
}

export function deviceIcon(type: string): string {
  if (type === "humedad" || type === "caudal") return "droplet";
  if (type === "lluvia") return "cloud";
  if (type === "aire_temp") return "thermometer";
  return "radio";
}

export function stateLabel(s: { is_active: boolean; status: string }): string {
  if (!s.is_active) return "Inactivo";
  return STATUS_LABEL[s.status] ?? s.status;
}

export function stateTone(s: { is_active: boolean; status: string }): "neutral" | "good" | "warn" {
  if (!s.is_active) return "neutral";
  if (s.status === "ok") return "good";
  if (s.status === "anomalo") return "warn";
  return "neutral";
}

export function sensorValue(s: { latest_measurement?: { value?: number; raw_value?: number } | null }): string {
  const m = s.latest_measurement;
  if (!m) return "—";
  return String(m.value ?? m.raw_value ?? "—");
}


