import { CloudRain, Droplet, Plus, Settings2, Thermometer } from "lucide-react";
import type { Sensor } from "../../api/types";
import { Action, Status } from "../field/FieldUI";
import { ageLabel, fmtDateTime, fmtNum } from "../../lib/format";

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
  return `${fmtNum(n, 1)} ${unit}`;
}

function Reading({ sensor, now, onRead, onDetail }: {sensor: Sensor; now: number; onRead:(id:number)=>void; onDetail:(id:number)=>void}) {
  const m = sensor.latest_measurement;
  const minutes = m ? (now - Date.parse(m.measured_at)) / 60000 : null;
  const staleSoil = sensor.type === "humedad" && minutes !== null && (!Number.isFinite(minutes) || minutes < 0 || minutes > 30);
  const valid = m?.quality === "ok" && !sensorValue(sensor).includes("válid");
  const percent = sensor.type === "humedad" && m?.norm_value !== null && valid ? Number(m?.norm_value) : null;
  return <div className="sensor-observation">
    <div className="sensor-observation-top"><span>Registro #{sensor.id}{sensor.pin ? ` · ${sensor.pin}` : ""}</span><Status tone={!sensor.is_active ? "neutral" : !m ? "neutral" : !valid || staleSoil || sensor.status !== "ok" ? "warn" : "good"}>{!sensor.is_active ? "Inactivo" : !m ? "Sin lectura" : !valid ? "Revisar lectura" : staleSoil ? "Actualizar lectura" : sensor.status === "anomalo" ? "En revisión" : sensor.status === "sin_datos" ? "Sin datos recientes" : "Disponible"}</Status></div>
    <strong className="sensor-reading-value">{sensorValue(sensor)}</strong>
    {percent !== null && Number.isFinite(percent) && <div className="sensor-soil-scale"><div role="meter" aria-label="Humedad del suelo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><i style={{width:`${percent}%`}} /></div><div><span>0 %</span><span>100 %</span></div></div>}
    <p className="sensor-reading-time">{m ? <time dateTime={m.measured_at} title={fmtDateTime(m.measured_at)}>{fmtDateTime(m.measured_at)} · {ageLabel(m.measured_at)}</time> : "Registra una medición para conocer el estado del campo."}</p>
    <div className="sensor-reading-actions"><Action tone="line" onClick={()=>onRead(sensor.id)} aria-label={`Registrar lectura del sensor ${sensor.id}`}><Plus size={14}/>Nueva lectura</Action><Action tone="quiet" onClick={()=>onDetail(sensor.id)} aria-label={`Ver sensor ${sensor.id}`}><Settings2 size={14}/>Detalle</Action></div>
  </div>;
}

export function SensorOverview({ sensors, now, onRead, onDetail, onRegister }: {sensors:Sensor[];now:number;onRead:(id:number)=>void;onDetail:(id:number)=>void;onRegister:(type:string)=>void}) {
  function readings(type:string) {
    const matches=sensors.filter(s=>s.type===type);
    return matches.length ? matches.map(sensor=><Reading key={sensor.id} sensor={sensor} now={now} onRead={onRead} onDetail={onDetail}/>) : <div className="sensor-missing"><p>Sin registrar</p><span>Añade esta medición a la parcela.</span><Action tone="quiet" onClick={()=>onRegister(type)}><Plus size={14}/>Configurar</Action></div>;
  }
  return <section className="sensor-field-view" aria-label="Dispositivos">
    <div className="sensor-ground-grid">
      <article className="sensor-monitor soil">
        <header><span className="sensor-monitor-icon"><Droplet size={21}/></span><div><h2>Humedad del suelo</h2><p>YL-69 · Agua presente en el suelo</p></div></header>
        {readings("humedad")}
        <footer>Para evaluar el riego, utiliza una lectura de los últimos 30 minutos.</footer>
      </article>
      <article className="sensor-monitor rain">
        <header><span className="sensor-monitor-icon"><CloudRain size={21}/></span><div><h2>Lluvia</h2><p>FC-37 · Detección en la parcela</p></div></header>
        {readings("lluvia")}
        <footer>Indica presencia de lluvia; no mide su cantidad ni es un pronóstico.</footer>
      </article>
    </div>
    <article className="sensor-monitor atmosphere">
      <header><span className="sensor-monitor-icon"><Thermometer size={21}/></span><div><h2>Temperatura y humedad del aire</h2><p>DHT11 · Condiciones del ambiente</p></div></header>
      <div className="sensor-air-readings"><section aria-label="Temperatura del aire"><h3>Temperatura</h3>{readings("aire_temp")}</section><section aria-label="Humedad del aire"><h3>Humedad relativa</h3>{readings("aire_hr")}</section></div>
      <footer>Cada medición conserva su fecha. Puedes registrar temperatura y humedad por separado.</footer>
    </article>
  </section>;
}
