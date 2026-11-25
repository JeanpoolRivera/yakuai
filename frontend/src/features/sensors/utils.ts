export const TIPOS = [
  { value: "humedad", label: "Humedad del suelo · capacitivo V1.2", model: "Capacitivo V1.2", pin: "A0" },
  { value: "temperatura_suelo", label: "Temperatura de tierra · DS18B20", model: "DS18B20 impermeable", pin: "D3" },
  { value: "caudal", label: "Caudal · YF-S401", model: "YF-S401", pin: "D2" },
  { value: "agua_suficiente", label: "Nivel de agua · flotador", model: "Interruptor de flotador", pin: "D4" },
  { value: "bomba_estado", label: "Estado de la bomba · relé", model: "Relé y bomba 12 V", pin: "D5" },
];

// Mantiene legibles los registros antiguos; estos tipos ya no se ofrecen al crear sensores.
export const TYPE_LABEL: Record<string, string> = {
  ...Object.fromEntries(TIPOS.map((item) => [item.value, item.label])),
  aire_temp: "Temperatura del aire (registro anterior)",
  temperatura_agua: "Temperatura del agua (registro anterior)",
  aire_hr: "Humedad del aire (registro anterior)",
  lluvia: "Lluvia (registro anterior)",
};

export const STATUS_LABEL: Record<string, string> = {
  ok: "Operativo",
  anomalo: "En revisión",
  sin_datos: "Sin datos",
};

export function rangeMessage(type: string, raw: number): string | null {
  if (!Number.isFinite(raw)) return "Escribe un valor numérico.";
  switch (type) {
    case "humedad":
      return !Number.isInteger(raw) || raw < 0 || raw > 1023 ? "El sensor capacitivo entrega 0–1023 en crudo. Revisa el valor." : null;
    case "aire_temp":
      return raw < -10 || raw > 60 ? "DHT11 mide de -10 a 60 °C. Revisa el valor." : null;
    case "temperatura_suelo":
    case "temperatura_agua":
      return raw < -55 || raw > 125 ? "DS18B20 mide de -55 a 125 °C. Revisa el valor." : null;
    case "aire_hr":
      return raw < 0 || raw > 100 ? "DHT11 mide humedad relativa de 0 a 100. Revisa el valor." : null;
    case "lluvia":
      return raw !== 0 && raw !== 1 ? "FC-37 solo avisa lluvia sí/no (valores 0 o 1). Revisa el valor." : null;
    case "caudal":
      return raw < 0 || raw > 6 ? "YF-S401: el rango esperado es 0–6 L/min. Revisa el valor y calibra el caudalímetro." : null;
    case "agua_suficiente":
    case "bomba_estado":
      return raw !== 0 && raw !== 1 ? "Este estado debe ser 0 o 1." : null;
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


