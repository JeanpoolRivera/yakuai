/* YakuAI — tipos de dominio. Reflejan el contrato real del backend (api/v1). */

export type Role = "admin" | "tecnico" | "agricultor";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface AuthPayload {
  access_token: string;
  token_type: "Bearer";
  expires_at: string;
  user: AuthUser;
}

export interface CropStage {
  id: number;
  crop_id: number;
  stage: "ini" | "des" | "med" | "fin";
  days: number;
  kc: string;
  root_depth_m: string;
  depletion_fraction: string;
  version: number;
  source: string;
  source_url: string | null;
  reviewed_at: string | null;
}

export interface Crop {
  id: number;
  code: string;
  name: string;
  scientific_name: string | null;
  is_active: boolean;
  stages?: CropStage[];
}

export interface SoilTexture {
  id: number;
  code: string;
  name: string;
  field_capacity: string;
  wilting_point: string;
  source: string;
  source_url: string | null;
  reviewed_at: string | null;
  version: number;
}

export interface Farmer {
  id: number;
  name: string;
  phone: string | null;
  email?: string | null;
  access_status?: "sin_cuenta" | "invitacion_pendiente" | "invitacion_vencida" | "invitacion_requerida" | "activo";
  can_resend_invitation?: boolean;
  invitation_sent?: boolean | null;
  is_active: boolean;
  plots_count?: number;
  plots?: Plot[];
}

export type IrrigationSystem = "goteo" | "aspersion" | "gravedad";
export type PlotStatus = "activa" | "pausada" | "cerrada";

export interface Plot {
  id: number;
  farmer_id: number;
  name: string;
  latitude: string;
  longitude: string;
  boundary: number[][][] | null;
  area_m2: string;
  area_origin: "dibujo" | "manual";
  crop_id: number;
  sowing_date: string;
  soil_texture_code: string;
  irrigation_system: IrrigationSystem;
  irrigation_efficiency: string;
  flow_lpm: string | null;
  status: PlotStatus;
  farmer?: Farmer;
  crop?: Crop;
}

export type SensorType = "humedad" | "aire_temp" | "aire_hr" | "lluvia" | "caudal";
export type SensorStatus = "ok" | "anomalo" | "sin_datos";

export interface Sensor {
  id: number;
  plot_id: number;
  type: SensorType;
  model: string;
  pin: string | null;
  dry_ref: number | null;
  wet_ref: number | null;
  status: SensorStatus;
  is_active: boolean;
  plot?: Plot;
  measurements?: Measurement[];
  latest_measurement?: Measurement | null;
}

export type MeasurementQuality = "ok" | "anomalo";
export type MeasurementOrigin = "manual" | "sensor" | "demo";

export interface Measurement {
  id: number;
  sensor_id: number;
  plot_id: number;
  measured_at: string;
  raw_value: string;
  norm_value: string | null;
  quality: MeasurementQuality;
  origin: MeasurementOrigin;
  sensor?: Sensor;
}

export interface Forecast {
  id: number;
  plot_id: number;
  fetched_at: string;
  issued_at: string | null;
  period_from: string;
  period_to: string;
  temp_max: string | null;
  temp_min: string | null;
  rain_mm: string;
  rain_prob: string;
  raw_json: unknown;
  origin: string;
}

export type EvalResult = "riega" | "no" | "espera" | "incompleta";

export interface EvalPlan {
  litros: number;
  minutos: number | null;
  inicio: string;
  fin: string | null;
  jornadas: number;
  nota: string | null;
}

export interface EvalProximoRiego {
  fecha: string;
  litros: number;
  motivo: string;
}

export interface EvalSnapshot {
  fuente?: string;
  crop_code?: string;
  soil_code?: string;
  cc?: number;
  pmp?: number;
  area_m2?: number;
  efficiency?: number;
  stage?: string;
  kc?: number;
  zr_m?: number;
  p?: number;
  humedad_pct?: number;
  rain_mm?: number;
  rain_prob?: number;
  et0_mm_dia?: number;
  etc_mm_dia?: number;
  umbral?: number;
  lamina_neta_mm?: number;
  volumen_bruto_L?: number;
  plan?: EvalPlan | null;
  proximo_riego?: EvalProximoRiego | null;
  [key: string]: unknown;
}

export interface Evaluation {
  id: number;
  plot_id: number;
  evaluated_at: string;
  stage: string | null;
  inputs_snapshot: EvalSnapshot;
  result: EvalResult;
  min_liters: string | null;
  max_liters: string | null;
  confidence: "alta" | "media" | null;
  reason: string;
  next_at: string | null;
  is_critical: boolean;
  plot?: Plot;
}

export type IrrigationStatus = "activo" | "corregido" | "anulado";

export interface Irrigation {
  id: number;
  plot_id: number;
  evaluation_id: number | null;
  supersedes_id: number | null;
  occurred_at: string;
  recommended_liters: string | null;
  applied_liters: string;
  origin: string;
  note: string | null;
  status: IrrigationStatus;
  plot?: Plot;
}

export interface AlertItem {
  tipo: string;
  mensaje: string;
  plot_id: number | null;
}

export interface ValidationCase {
  caso: string;
  esperado: string;
  obtenido: string;
  ok: boolean;
  detalle: string;
}

export interface ValidationReport {
  total: number;
  passed: number;
  cases: ValidationCase[];
}
