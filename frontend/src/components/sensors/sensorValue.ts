import type { Sensor } from "../../api/types";
import { fmtNum } from "../../lib/format";

export function sensorValue(sensor: Sensor): string {
  const m = sensor.latest_measurement;
  if (!m) return "Sin lectura";
  if (m.quality !== "ok") return "Lectura no válida";
  const raw = m.norm_value ?? (sensor.type === "humedad" ? null : m.raw_value);
  if (raw === null || raw.trim() === "" || !Number.isFinite(Number(raw))) return "Sin dato válido";
  const n = Number(raw);
  if (sensor.type === "lluvia") return n === 1 ? "Lluvia detectada" : n === 0 ? "Sin lluvia detectada" : "Lectura no válida";
  if ((sensor.type === "humedad" || sensor.type === "aire_hr") && (n < 0 || n > 100)) return "Lectura no válida";
  const unit = sensor.type === "aire_temp" ? "°C" : sensor.type === "caudal" ? "L/min" : "%";
  return fmtNum(n, 1) + " " + unit;
}
