/* Funciones de acceso a cada recurso. Contratos según backend (routes/api.php). */
import { api, apiList, qs } from "./client";
import type {
  AlertItem,
  AuthPayload,
  AuthUser,
  Crop,
  Evaluation,
  Farmer,
  Forecast,
  Irrigation,
  Measurement,
  Plot,
  Sensor,
  SoilTexture,
  ValidationReport,
} from "./types";

/* ---------- Auth ---------- */
export function login(email: string, secret: string): Promise<AuthPayload> {
  return api<AuthPayload>("auth/login", { method: "POST", body: { email, secret } });
}

export function me(): Promise<AuthUser> {
  return api<AuthUser>("auth/me");
}

export function logout(): Promise<{ message: string }> {
  return api<{ message: string }>("auth/logout", { method: "POST" });
}

export function recoverPin(email: string): Promise<{ message: string }> {
  return api<{ message: string }>("auth/recover-pin", {
    method: "POST",
    body: { email },
  });
}

export function resetPin(email: string, recoveryCode: string, newPin: string): Promise<{ message: string }> {
  return api<{ message: string }>("auth/reset-pin", {
    method: "POST",
    body: { email, recovery_code: recoveryCode, new_pin: newPin },
  });
}

/* ---------- Catálogos (solo lectura) ---------- */
export function listCrops(): Promise<Crop[]> {
  return apiList<Crop>("crops");
}

export function listSoils(): Promise<SoilTexture[]> {
  return apiList<SoilTexture>("soil-textures");
}

/* ---------- Agricultores ---------- */
export interface FarmerInput {
  name: string;
  phone?: string;
  is_active?: boolean;
}

export function listFarmers(): Promise<Farmer[]> {
  return apiList<Farmer>("farmers");
}

export function createFarmer(input: FarmerInput): Promise<Farmer> {
  return api<Farmer>("farmers", { method: "POST", body: input });
}

export function updateFarmer(id: number, input: FarmerInput): Promise<Farmer> {
  return api<Farmer>(`farmers/${id}`, { method: "PATCH", body: input });
}

/* ---------- Parcelas ---------- */
export interface PlotInput {
  farmer_id: number;
  name: string;
  latitude: number;
  longitude: number;
  boundary?: number[][][] | null;
  area_m2: number;
  area_origin?: "dibujo" | "manual";
  crop_id: number;
  sowing_date: string;
  soil_texture_code: string;
  irrigation_system: string;
  irrigation_efficiency: number;
  flow_lpm?: number | null;
  status?: string;
}

export function listPlots(farmerId?: number): Promise<Plot[]> {
  return apiList<Plot>(`plots${qs({ farmer_id: farmerId })}`);
}

export function createPlot(input: PlotInput): Promise<Plot> {
  return api<Plot>("plots", { method: "POST", body: input });
}

export function updatePlot(id: number, input: PlotInput): Promise<Plot> {
  return api<Plot>(`plots/${id}`, { method: "PATCH", body: input });
}

/* ---------- Sensores ---------- */
export interface SensorInput {
  plot_id: number;
  type: string;
  model?: string;
  pin?: string | null;
  dry_ref?: number | null;
  wet_ref?: number | null;
  is_active?: boolean;
}

export function listSensors(plotId?: number): Promise<Sensor[]> {
  return apiList<Sensor>(`sensors${qs({ plot_id: plotId })}`);
}

export function createSensor(input: SensorInput): Promise<Sensor> {
  return api<Sensor>("sensors", { method: "POST", body: input });
}

/* ---------- Mediciones ---------- */
export interface MeasurementInput {
  sensor_id: number;
  measured_at: string;
  raw_value: number;
  origin?: "manual" | "sensor" | "demo";
}

export function createMeasurement(input: MeasurementInput): Promise<Measurement> {
  return api<Measurement>("measurements", { method: "POST", body: input });
}

/* ---------- Clima ---------- */
export interface WeatherDemo {
  rain_mm?: number;
  rain_prob?: number;
  temp_max?: number;
  temp_min?: number;
}

export function getWeather(plotId: number): Promise<Forecast> {
  return api<Forecast>(`plots/${plotId}/weather`);
}

export function refreshWeather(plotId: number, demo?: WeatherDemo): Promise<Forecast> {
  return api<Forecast>(`plots/${plotId}/weather/refresh`, {
    method: "POST",
    body: demo ? { demo } : {},
  });
}

/* ---------- Evaluaciones ---------- */
export function evaluatePlot(plotId: number): Promise<Evaluation> {
  return api<Evaluation>(`plots/${plotId}/evaluate`, { method: "POST" });
}

export function listEvaluations(plotId?: number): Promise<Evaluation[]> {
  return apiList<Evaluation>(`evaluations${qs({ plot_id: plotId })}`);
}

export function getEvaluationMessage(id: number): Promise<{ texto: string }> {
  return api<{ texto: string }>(`evaluations/${id}/mensaje`);
}

/* ---------- Riegos ---------- */
export interface IrrigationInput {
  plot_id: number;
  evaluation_id?: number | null;
  occurred_at: string;
  recommended_liters?: number | null;
  applied_liters: number;
  note?: string;
}

export function listIrrigations(plotId?: number): Promise<Irrigation[]> {
  return apiList<Irrigation>(`irrigations${qs({ plot_id: plotId })}`);
}

export function createIrrigation(input: IrrigationInput): Promise<Irrigation> {
  return api<Irrigation>("irrigations", { method: "POST", body: input });
}

export function correctIrrigation(id: number, appliedLiters: number, motivo: string): Promise<Irrigation> {
  return api<Irrigation>(`irrigations/${id}/corregir`, {
    method: "POST",
    body: { applied_liters: appliedLiters, motivo },
  });
}

export function voidIrrigation(id: number, motivo: string): Promise<Irrigation> {
  return api<Irrigation>(`irrigations/${id}/anular`, { method: "POST", body: { motivo } });
}

/* ---------- Alertas y validación ---------- */
export function listAlerts(): Promise<AlertItem[]> {
  return apiList<AlertItem>("alerts");
}

export function runValidation(): Promise<ValidationReport> {
  return api<ValidationReport>("validation");
}

export interface MetricsSummary {
  plots_active: number;
  sensors_active: number;
  sensors_ok: number;
  sensors_sin_datos: number;
  evaluations_today: number;
  evaluations_riega: number;
  evaluations_no: number;
  evaluations_espera: number;
  evaluations_incompleta: number;
  critical_today: number;
}

export function getMetricsSummary(): Promise<MetricsSummary> {
  return api<MetricsSummary>("metrics/summary");
}
