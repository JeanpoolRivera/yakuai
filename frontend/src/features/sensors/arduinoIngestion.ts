import { createMeasurement } from "@/api/endpoints";
import type { ArduinoSensorConfiguration, SensorType } from "@/api/types";
import { arduinoSerial, type ArduinoReading } from "./arduinoSerial";

const STORAGE_KEY = "yakuai-arduino-configuration";
const SAMPLE_INTERVAL_MS = 10_000;
type MeasurementKey = keyof ArduinoSensorConfiguration["sensors"];

export interface ArduinoIngestionState {
  configuration: ArduinoSensorConfiguration | null;
  savedCount: number;
  error: string;
}

function readStoredConfiguration(): ArduinoSensorConfiguration | null {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as ArduinoSensorConfiguration | null;
    if (!value || typeof value.plot_id !== "number" || !value.sensors) return null;
    const keys: MeasurementKey[] = ["humedad", "temperatura_suelo", "caudal", "agua_suficiente", "bomba_estado"];
    return keys.every((key) => Number.isInteger(value.sensors[key]) && value.sensors[key] > 0) ? value : null;
  } catch {
    return null;
  }
}

let state: ArduinoIngestionState = { configuration: readStoredConfiguration(), savedCount: 0, error: "" };
const listeners = new Set<() => void>();
const lastSampleAt: Partial<Record<MeasurementKey, number>> = {};
let lastWaterState: number | null = null;
let lastPumpState: number | null = null;

export function getArduinoIngestionSnapshot(): ArduinoIngestionState {
  return state;
}

export function subscribeArduinoIngestion(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function update(patch: Partial<ArduinoIngestionState>): void {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

export function setArduinoConfiguration(configuration: ArduinoSensorConfiguration): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configuration));
  } catch {
    update({ error: "No se pudo guardar la configuración del Arduino en este navegador." });
    return;
  }
  for (const key of Object.keys(lastSampleAt) as MeasurementKey[]) delete lastSampleAt[key];
  lastWaterState = null;
  lastPumpState = null;
  update({ configuration, savedCount: 0, error: "" });
}

async function save(key: MeasurementKey, type: SensorType, rawValue: number, measuredAt: string): Promise<void> {
  const configuration = state.configuration;
  if (!configuration) return;
  try {
    await createMeasurement({
      sensor_id: configuration.sensors[key],
      measured_at: measuredAt,
      raw_value: rawValue,
      origin: "sensor",
    });
    update({ savedCount: state.savedCount + 1, error: "" });
  } catch (cause) {
    update({ error: cause instanceof Error ? cause.message : `No se pudo guardar el dato de ${type}.` });
  }
}

function persistReading(reading: ArduinoReading): void {
  const configuration = state.configuration;
  if (!configuration) return;
  const now = Date.now();
  const receivedAt = arduinoSerial.getSnapshot().lastReceivedAt ?? now;
  const measuredAt = new Date(receivedAt).toISOString().slice(0, 19);
  const samples: { key: MeasurementKey; type: SensorType; value: number; valid: boolean }[] = [
    { key: "humedad", type: "humedad", value: reading.humedad_raw, valid: true },
    { key: "temperatura_suelo", type: "temperatura_suelo", value: reading.temperatura_c ?? 0, valid: reading.ds18_detectado && reading.temperatura_c !== null },
    { key: "caudal", type: "caudal", value: reading.caudal_l_min, valid: true },
  ];

  for (const sample of samples) {
    if (!sample.valid || now - (lastSampleAt[sample.key] ?? 0) < SAMPLE_INTERVAL_MS) continue;
    lastSampleAt[sample.key] = now;
    void save(sample.key, sample.type, sample.value, measuredAt);
  }

  const waterState = reading.flotador === "Hay agua suficiente" ? 1 : 0;
  if (lastWaterState !== waterState) {
    lastWaterState = waterState;
    void save("agua_suficiente", "agua_suficiente", waterState, measuredAt);
  }

  const pumpState = reading.bomba ? 1 : 0;
  if (lastPumpState !== pumpState) {
    lastPumpState = pumpState;
    void save("bomba_estado", "bomba_estado", pumpState, measuredAt);
  }
}

// Esta suscripción vive en la aplicación aunque el usuario navegue entre pantallas.
const unsubscribeReading = arduinoSerial.subscribeReading(persistReading);
if (import.meta.hot) import.meta.hot.dispose(unsubscribeReading);
