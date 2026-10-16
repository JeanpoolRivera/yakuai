import type { Evaluation, Farmer, Irrigation, Plot, Sensor } from "../../api/types";

export type DashboardData = {
  plots: Plot[] | null;
  farmers: Farmer[] | null;
  sensors: Sensor[] | null;
  evaluations: Evaluation[] | null;
  irrigations: Irrigation[] | null;
};
export type Priority = {
  key: string; plot: Plot; category: "field" | "data"; severity: "critical" | "warning" | "neutral";
  title: string; detail: string; at: string | null; to: string; action: string; rank: number;
};
export type EvaluationDay = { date: string; riega: number; no: number; espera: number; incompleta: number; total: number };
export const RESULT_SERIES = [
  { key: "riega", label: "Regar" }, { key: "no", label: "No regar" },
  { key: "espera", label: "Esperar" }, { key: "incompleta", label: "Incompleta" },
] as const;

export function limaDay(value: string | Date): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function evaluationDays(evaluations: Evaluation[], days: number, now: Date): EvaluationDay[] {
  const anchor = new Date(`${limaDay(now)}T12:00:00-05:00`);
  const bins = Array.from({length: days}, (_, i): EvaluationDay => ({
    date: limaDay(new Date(anchor.getTime() - (days - 1 - i) * 86400000)),
    riega: 0, no: 0, espera: 0, incompleta: 0, total: 0,
  }));
  const byDate = new Map(bins.map(d => [d.date, d]));
  for (const e of evaluations) {
    if (Date.parse(e.evaluated_at) > now.getTime()) continue;
    const day = byDate.get(limaDay(e.evaluated_at));
    if (day) { day[e.result]++; day.total++; }
  }
  return bins;
}

export function summarize(data: DashboardData, now: Date) {
  const active = (data.plots ?? []).filter(p => p.status === "activa");
  const activeIds = new Set(active.map(p => p.id));
  const latest = new Map<number, Evaluation>();
  for (const e of data.evaluations ?? []) {
    if (!Number.isFinite(Date.parse(e.evaluated_at)) || Date.parse(e.evaluated_at) > now.getTime()) continue;
    if (!latest.has(e.plot_id) || Date.parse(e.evaluated_at) > Date.parse(latest.get(e.plot_id)!.evaluated_at)) latest.set(e.plot_id, e);
  }
  const completed = new Set((data.irrigations ?? []).filter(i => i.status === "activo").map(i => i.evaluation_id));
  const sensors = (data.sensors ?? []).filter(s => s.is_active);
  const sensorCounts = { ok: 0, anomalo: 0, sin_datos: 0 };
  sensors.forEach(s => { sensorCounts[s.status]++; });
  const brokenByPlot = new Map<number, Sensor[]>();
  for (const s of sensors.filter(s => s.status !== "ok")) brokenByPlot.set(s.plot_id, [...(brokenByPlot.get(s.plot_id) ?? []), s]);
  const priorities: Priority[] = [];
  for (const plot of active) {
    const ev = latest.get(plot.id);
    const broken = brokenByPlot.get(plot.id) ?? [];
    if (broken.length) priorities.push({
      key: `sensor-${plot.id}`, plot, category: "data", severity: "warning", rank: 2,
      title: `${broken.length} ${broken.length === 1 ? "sensor requiere revisión" : "sensores requieren revisión"}`,
      detail: broken.map(s => `#${s.id}: ${s.status === "anomalo" ? "anómalo" : "sin datos"}`).join(" · "),
      at: null, to: "/sensores", action: "Ver sensores",
    });
    if (!ev) {
      if (data.evaluations !== null) priorities.push({key:`new-${plot.id}`,plot,category:"data",severity:"neutral",rank:5,title:"Sin evaluación registrada",detail:"Falta una primera evaluación de la parcela.",at:null,to:"/evaluar",action:"Evaluar"});
      continue;
    }
    // A recorded irrigation or an overdue recommendation is never shown as current critical soil.
    const overdue = ev.next_at !== null && Date.parse(ev.next_at) <= now.getTime();
    if (overdue || now.getTime() - Date.parse(ev.evaluated_at) >= 86400000) {
      priorities.push({key:`old-${plot.id}`,plot,category:"data",severity:"neutral",rank:4,title:"Actualizar evaluación",detail:"La última recomendación necesita una nueva revisión.",at:ev.evaluated_at,to:"/evaluar",action:"Reevaluar"});
    } else if (ev.result === "incompleta") {
      const climate = ev.reason === "sin_clima_valido";
      if (!(ev.reason === "sin_humedad_valida" && broken.length)) priorities.push({key:`missing-${plot.id}`,plot,category:"data",severity:"warning",rank:1,title:climate ? "Pronóstico pendiente de actualizar" : "Evaluación incompleta",detail:climate ? "Sin clima vigente para calcular el riego." : ev.reason === "sin_humedad_valida" ? "Sin lectura de humedad válida de los últimos 30 minutos." : "Revisar los datos utilizados por el motor.",at:ev.evaluated_at,to:climate ? "/clima" : ev.reason === "sin_humedad_valida" ? "/sensores" : "/evaluar",action:climate ? "Ver clima" : ev.reason === "sin_humedad_valida" ? "Ver sensores" : "Evaluar"});
    } else if (ev.result === "riega" && data.irrigations !== null && !completed.has(ev.id)) {
      priorities.push({key:`water-${plot.id}`,plot,category:"field",severity:ev.is_critical ? "critical" : "warning",rank:ev.is_critical ? 0 : 3,title:ev.is_critical ? "Última evaluación crítica" : "Riego recomendado sin registro",detail:"Sin un riego activo vinculado a esta evaluación.",at:ev.evaluated_at,to:"/evaluar",action:"Revisar"});
    }
  }
  priorities.sort((a,b) => a.rank - b.rank || a.plot.name.localeCompare(b.plot.name));
  const today = limaDay(now);
  const evaluatedToday = new Set((data.evaluations ?? []).filter(e => activeIds.has(e.plot_id) && limaDay(e.evaluated_at) === today && Date.parse(e.evaluated_at) <= now.getTime()).map(e => e.plot_id)).size;
  const irrigationToday = (data.irrigations ?? []).filter(i => i.status === "activo" && limaDay(i.occurred_at) === today && Date.parse(i.occurred_at) <= now.getTime());
  return {active, priorities, sensorCounts, sensors, evaluatedToday,
    affected: new Set(priorities.map(p => p.plot.id)).size,
    irrigationCount: irrigationToday.length,
    litersToday: irrigationToday.reduce((sum,i) => sum + (Number(i.applied_liters) || 0),0),
    farmerCount: data.farmers?.filter(f => f.is_active).length ?? null,
  };
}
