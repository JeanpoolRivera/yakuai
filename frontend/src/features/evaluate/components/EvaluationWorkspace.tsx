import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Cable, CheckCircle2, CircleStop, Clock3, Droplets, Leaf, LoaderCircle, MessageCircle, RefreshCw, TriangleAlert, CloudRain, Thermometer } from "lucide-react";
import type { RefObject } from "react";
import type { UsePlotsResult } from "../hooks/usePlots";
import type { UseHistoryResult } from "../hooks/useHistory";
import type { UseEvaluationResult } from "../hooks/useEvaluation";
import type { UseIrrigationConfirmResult } from "../hooks/useIrrigationConfirm";
import type { useArduinoPump } from "../hooks/useArduinoPump";
import type { DemoEvaluation } from "@/api/types";
import { evaluateDemoPlot } from "@/api/endpoints";
import { planFromSnapshot, humidityFromSnapshot, rainFromSnapshot, litersRange } from "../utils";
import { reasonShort, verdictTitle, FARMER_CONTACT_COPY } from "../copy";
import { PageHeading, Metric, StatusBadge, EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/workspace/WorkspaceKit";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { GuardedInput } from "@/components/forms/GuardedInput";
import { fmtDateTime, fmtNum } from "@/lib/format";

export interface EvaluationWorkspaceProps {
  plots: UsePlotsResult;
  history: UseHistoryResult;
  evaluation: UseEvaluationResult;
  irrigation: UseIrrigationConfirmResult;
  pump: ReturnType<typeof useArduinoPump>;
  isStaff: boolean;
  titleRef: RefObject<HTMLHeadingElement | null>;
  onSelect: (id: number) => void;
  onEvaluate: () => void;
}

export function EvaluationWorkspace({ plots, history, evaluation, irrigation, pump, isStaff, titleRef, onSelect, onEvaluate }: EvaluationWorkspaceProps): React.JSX.Element {
  const [appliedLiters, setAppliedLiters] = useState("");
  const [demoHumidity, setDemoHumidity] = useState(0);
  const [demoRain, setDemoRain] = useState(0);
  const [demoRainProbability, setDemoRainProbability] = useState(0);
  const [demoResult, setDemoResult] = useState<DemoEvaluation | null>(null);
  const [demoBusy, setDemoBusy] = useState(false);
  const [demoError, setDemoError] = useState("");
  const current = evaluation.current;
  const humidity = humidityFromSnapshot(current?.inputs_snapshot);
  const rain = rainFromSnapshot(current?.inputs_snapshot);
  const plan = planFromSnapshot(current?.inputs_snapshot);
  const range = current ? litersRange(current.min_liters, current.max_liters) : null;

  async function record(): Promise<void> {
    const success = await irrigation.confirm(Number(appliedLiters));
    if (success) setAppliedLiters("");
  }

  async function runDemo(): Promise<void> {
    if (plots.plotId === null) return;
    setDemoBusy(true);
    setDemoError("");
    try {
      const result = await evaluateDemoPlot(plots.plotId, {
        humedad_pct: demoHumidity,
        rain_mm: demoRain,
        rain_prob: demoRainProbability / 100,
      });
      setDemoResult(result);
    } catch (cause) {
      setDemoError(cause instanceof Error ? cause.message : "No se pudo calcular el escenario de demostración.");
    } finally {
      setDemoBusy(false);
    }
  }

  useEffect(() => {
    if (pump.runLiters !== null && pump.runLiters > 0) setAppliedLiters(pump.runLiters.toFixed(2));
  }, [pump.runLiters]);

  useEffect(() => {
    setDemoResult(null);
    setDemoError("");
  }, [plots.plotId]);

  return <div className="space-y-6">
    <PageHeading eyebrow="Decisión de riego" title="Evaluar riego" description="Elige una parcela para revisar humedad, cultivo, suelo y clima." />
    {plots.error ? <ErrorBlock message={plots.error} retry={plots.reload} /> : null}
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,.8fr)]">
      <Card className="rounded-xl p-4 sm:p-5">
        <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-50 text-primary-700"><Leaf size={17} aria-hidden="true" /></span><div><h2 className="font-semibold text-neutral-900">Elige una parcela</h2><p className="text-xs text-neutral-600">La recomendación es para una parcela a la vez.</p></div></div>
        {plots.loading ? <div className="mt-4"><LoadingBlock label="Cargando parcelas…" /></div> : plots.plots.length === 0 ? <div className="mt-4"><EmptyBlock title="Sin parcelas disponibles" description="Pide a tu técnico que registre una parcela para comenzar." /></div> : <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div><label htmlFor="evaluate-plot" className="mb-1.5 block text-sm font-medium text-neutral-800">Selecciona una parcela</label><select id="evaluate-plot" value={plots.plotId ?? ""} onChange={(event) => onSelect(Number(event.target.value))} className="min-h-12 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"><option value="" disabled>Elige una parcela</option>{plots.plots.map((plot) => <option key={plot.id} value={plot.id}>{plot.name}{plot.crop?.name ? ` · ${plot.crop.name}` : ""}</option>)}</select></div>
          <Button onClick={onEvaluate} disabled={plots.plotId === null || evaluation.busy || plots.loading} className="w-full sm:w-auto">{evaluation.busy ? <><LoaderCircle size={16} className="animate-spin" aria-hidden="true" />Evaluando…</> : <><RefreshCw size={16} aria-hidden="true" />Evaluar ahora</>}</Button>
        </div>}
        {plots.plot ? <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-neutral-50 p-3 text-sm sm:grid-cols-4"><div><dt className="text-xs text-neutral-500">Cultivo</dt><dd className="mt-0.5 font-medium text-neutral-800">{plots.plot.crop?.name ?? "—"}</dd></div><div><dt className="text-xs text-neutral-500">Suelo</dt><dd className="mt-0.5 font-medium text-neutral-800">{plots.plot.soil_texture_code.replaceAll("_", " ")}</dd></div><div><dt className="text-xs text-neutral-500">Área</dt><dd className="mt-0.5 font-medium text-neutral-800">{fmtNum(plots.plot.area_m2)} m²</dd></div><div><dt className="text-xs text-neutral-500">Riego</dt><dd className="mt-0.5 font-medium capitalize text-neutral-800">{plots.plot.irrigation_system}</dd></div></dl> : null}
      </Card>
      <Card className="rounded-xl border-info-100 bg-info-50/50 p-4 sm:p-5"><div className="flex items-start gap-3"><Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-info-700" aria-hidden="true" /><div><h2 className="font-semibold text-neutral-900">¿Faltan datos?</h2><p className="mt-1 text-sm leading-relaxed text-neutral-700">La evaluación necesita humedad reciente y pronóstico vigente.</p>{isStaff ? <Button asChild variant="link" className="mt-1 h-auto min-h-10 px-0"><Link to="/sensores">Ver sensores</Link></Button> : <p className="mt-1 text-sm text-neutral-700">Contacta a tu técnico.</p>}</div></div></Card>
    </section>

    {evaluation.error ? <ErrorBlock message={evaluation.error} /> : null}
    {isStaff && plots.plotId !== null ? <details className="group rounded-xl border border-dashed border-primary-300 bg-primary-50/40">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 sm:px-5 [&::-webkit-details-marker]:hidden"><span><span className="block text-sm font-semibold text-neutral-900">Simular para la presentación</span><span className="mt-0.5 block text-xs text-neutral-600">Valores de prueba · no afecta la evaluación ni la bomba</span></span><span className="text-xs font-medium text-primary-700 group-open:hidden">Abrir</span><span className="hidden text-xs font-medium text-primary-700 group-open:inline">Cerrar</span></summary>
      <div className="border-t border-primary-200 p-4 sm:p-5" aria-labelledby="demo-mode-title">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="demo-mode-title" className="font-semibold text-neutral-900">Escenario de demostración</h2><p className="mt-1 max-w-2xl text-sm text-neutral-600">Usa valores ficticios aunque el Arduino esté desconectado. No guarda datos ni enciende la bomba.</p></div><span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-800">Demostración</span></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium text-neutral-800">Humedad simulada: {demoHumidity}%<input type="range" min="0" max="100" step="1" value={demoHumidity} onChange={(event) => { setDemoHumidity(Number(event.target.value)); setDemoResult(null); }} className="accent-primary-700" aria-label="Humedad simulada del suelo" /><span className="text-xs font-normal text-neutral-500">Índice relativo: 0% seco · 100% húmedo</span></label>
        <label className="grid gap-1 text-sm font-medium text-neutral-800">Lluvia prevista<input type="number" min="0" max="200" step="0.1" value={demoRain} onChange={(event) => { setDemoRain(Number(event.target.value)); setDemoResult(null); }} className="min-h-10 rounded-md border border-neutral-300 bg-white px-3" /><span className="text-xs font-normal text-neutral-500">Milímetros para el escenario</span></label>
        <label className="grid gap-1 text-sm font-medium text-neutral-800">Probabilidad de lluvia: {demoRainProbability}%<input type="range" min="0" max="100" step="1" value={demoRainProbability} onChange={(event) => { setDemoRainProbability(Number(event.target.value)); setDemoResult(null); }} className="accent-primary-700" aria-label="Probabilidad de lluvia simulada" /><span className="text-xs font-normal text-neutral-500">Se combina con la humedad según las reglas actuales</span></label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2"><Button onClick={() => void runDemo()} disabled={demoBusy || !Number.isFinite(demoRain) || demoRain < 0 || demoRain > 200}>{demoBusy ? <><LoaderCircle size={16} className="animate-spin" aria-hidden="true" />Calculando…</> : "Evaluar escenario"}</Button><Button variant="outline" onClick={() => { setDemoHumidity(0); setDemoRain(0); setDemoRainProbability(0); setDemoResult(null); setDemoError(""); }}>Suelo seco</Button><Button variant="outline" onClick={() => { setDemoHumidity(100); setDemoRain(0); setDemoRainProbability(0); setDemoResult(null); setDemoError(""); }}>Suelo húmedo</Button></div>
      {demoError ? <p role="alert" className="mt-3 rounded-lg border border-danger-100 bg-danger-50 px-3 py-2 text-sm text-danger-700">{demoError}</p> : null}
      {demoResult ? <div role="status" className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Resultado simulado · no se guardó</p>
        <h3 className="mt-1 text-lg font-semibold text-neutral-900">{demoResult.result === "riega" ? demoResult.is_critical ? "Riego recomendado · prioridad alta" : "Riego recomendado" : demoResult.result === "no" ? "No hace falta regar" : demoResult.result === "espera" ? "Espera: la lluvia prevista puede cubrir el riego" : "No se pudo decidir con este escenario"}</h3>
        <p className="mt-1 text-sm text-neutral-600">{demoResult.result === "riega" && demoResult.min_liters !== null && demoResult.max_liters !== null ? `Rango estimado para esta parcela: ${fmtNum(demoResult.min_liters)}–${fmtNum(demoResult.max_liters)} L.` : demoResult.result === "no" ? "La humedad simulada supera el umbral del cultivo." : demoResult.result === "espera" ? "La humedad está bajo el umbral y la lluvia simulada sería suficiente." : "Revisa la parcela y los datos requeridos."}</p>
        {demoResult.snapshot.humedad_umbral_pct !== undefined ? <p className="mt-2 text-xs text-neutral-500">Humedad simulada {demoResult.snapshot.humedad_pct ?? demoHumidity}% · umbral relativo del cultivo {demoResult.snapshot.humedad_umbral_pct}% · lluvia {demoResult.snapshot.rain_mm ?? demoRain} mm ({Math.round(Number(demoResult.snapshot.rain_prob ?? demoRainProbability / 100) * 100)}%).</p> : null}
      </div> : null}
      </div>
    </details> : null}
    {current ? <section aria-labelledby="evaluation-result" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Resultado</p><h2 ref={titleRef} id="evaluation-result" tabIndex={-1} className="mt-1 text-xl font-semibold text-neutral-900 focus:outline-none">{verdictTitle(current)}</h2><p className="mt-1 text-sm text-neutral-600">Parcela: {current.plot?.name ?? plots.plot?.name ?? `#${current.plot_id}`} · Evaluada {fmtDateTime(current.evaluated_at)}</p></div><div className="flex flex-wrap gap-2"><StatusBadge value={current.result} />{current.confidence ? <StatusBadge value={current.confidence === "alta" ? "ok" : "demo"} label={`Confianza ${current.confidence}`} /> : null}</div></div>
      <Card className={`overflow-hidden rounded-xl ${current.result === "riega" ? current.is_critical ? "border-danger-200 bg-danger-50/40" : "border-warning-200 bg-warning-50/40" : "border-neutral-200 bg-white"}`}>
        <div className="flex items-start gap-3 border-b border-neutral-200/80 p-4 sm:p-5"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${current.result === "riega" ? "bg-warning-100 text-warning-800" : current.result === "no" ? "bg-success-100 text-success-800" : current.result === "espera" ? "bg-info-100 text-info-800" : "bg-neutral-100 text-neutral-700"}`} aria-hidden="true">{current.result === "incompleta" ? <TriangleAlert size={20} /> : current.result === "riega" ? <Droplets size={20} /> : current.result === "no" ? <CheckCircle2 size={20} /> : <CloudRain size={20} />}</span><div className="min-w-0"><p className="font-semibold text-neutral-900">{current.result === "riega" ? current.is_critical ? "Prioridad alta" : "Riego recomendado" : current.result === "no" ? "Humedad suficiente" : current.result === "espera" ? "Lluvia prevista suficiente" : "Faltan datos para decidir"}</p><p className="mt-1 text-sm leading-relaxed text-neutral-700">{current.result === "incompleta" ? reasonShort(current.reason) : current.result === "riega" ? "El sistema recomienda aplicar agua dentro del rango indicado." : current.result === "no" ? "No hace falta regar ahora. Vuelve a revisar cuando corresponda." : "Espera antes de regar y revisa la parcela en unas horas."}</p></div></div>
        {current.result === "riega" && range ? <div className="space-y-4 p-4 sm:p-5">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">Volumen recomendado para la parcela</p><p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-neutral-900">{range}</p>{plan ? <p className="mt-2 text-sm text-neutral-700">Inicio sugerido: <strong>{fmtDateTime(plan.inicio)}</strong>{plan.minutos !== null ? ` · ${plan.minutos} minutos` : ""}</p> : null}{plan?.nota ? <p className="mt-1 text-xs text-neutral-600">{plan.nota}</p> : null}</div>
          {isStaff ? <section className="rounded-xl border border-primary-200 bg-white p-4" aria-labelledby="mockup-irrigation-title">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 id="mockup-irrigation-title" className="font-semibold text-neutral-900">Riego de la maqueta</h3><p className="mt-1 text-sm text-neutral-600">Activa la bomba hasta 5 segundos. El volumen recomendado corresponde a la parcela y no se ejecuta con esta prueba.</p></div><StatusBadge value={pump.connected ? pump.pumpOn ? "riega" : pump.fresh ? "ok" : "sin_datos" : "inactivo"} label={pump.connected ? pump.pumpOn ? "Bomba encendida" : pump.fresh ? "Arduino conectado" : "Esperando lectura" : pump.connecting ? "Conectando" : "Arduino desconectado"} /></div>
            {pump.reading ? <p className={`mt-3 rounded-lg px-3 py-2 text-sm font-medium ${pump.waterAvailable ? "bg-success-50 text-success-800" : "bg-danger-50 text-danger-800"}`}>{pump.fresh ? pump.waterAvailable ? "Hay agua suficiente · bomba habilitada" : "No hay suficiente agua · bomba bloqueada" : "Lectura del flotador vencida · bomba bloqueada"}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">{!pump.connected ? <Button variant="outline" onClick={() => void pump.connect()} disabled={pump.connecting}><Cable size={16} aria-hidden="true" />{pump.connecting ? "Conectando…" : "Conectar Arduino"}</Button> : null}{pump.pumpOn ? <Button variant="destructive" onClick={() => void pump.stop()} disabled={pump.busy}><CircleStop size={16} aria-hidden="true" />{pump.busy ? "Deteniendo…" : "Detener bomba"}</Button> : <Button onClick={() => void pump.start()} disabled={!pump.connected || !pump.fresh || !pump.waterAvailable || pump.busy || pump.runLiters !== null}><Droplets size={16} aria-hidden="true" />{pump.busy ? "Activando…" : pump.runLiters !== null ? "Activación completada" : "Regar maqueta · hasta 5 s"}</Button>}</div>
            {pump.error ? <p role="alert" className="mt-3 rounded-lg border border-danger-100 bg-danger-50 px-3 py-2 text-sm text-danger-700">{pump.error}</p> : null}
            {pump.runLiters !== null ? <p role="status" className="mt-3 text-sm text-neutral-700">Volumen aproximado medido por el YF-S401: <strong>{fmtNum(pump.runLiters)} L</strong>. Verifica el caudalímetro antes de registrar este valor.</p> : null}
          </section> : null}
          <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm"><p className="font-medium text-neutral-800">¿Ya aplicaste el riego?</p>{irrigation.recorded ? <p className="mt-2 text-success-700">Riego registrado correctamente.</p> : <div className="mt-2 flex flex-col gap-2 sm:flex-row"><div className="min-w-0 flex-1"><label className="sr-only" htmlFor="applied-liters">Litros aplicados</label><GuardedInput id="applied-liters" guardMode="decimal" maxDecimals={2} required value={appliedLiters} onValueChange={(value) => { setAppliedLiters(value); irrigation.clearValidationError(); }} aria-invalid={Boolean(irrigation.validationError)} aria-describedby={irrigation.validationError ? "applied-liters-error" : undefined} placeholder="Litros aplicados" className="min-h-11 w-full rounded-md border border-neutral-300 px-3 text-sm sm:w-40" />{irrigation.validationError ? <span id="applied-liters-error" className="validation-message" role="alert">{irrigation.validationError}</span> : null}</div><Button size="sm" disabled={!appliedLiters || irrigation.confirming} onClick={() => void record()}>{irrigation.confirming ? "Guardando…" : "Registrar riego"}</Button></div>}</div>
        </div> : null}
        {current.result === "incompleta" ? <div className="p-4 sm:p-5">{isStaff ? current.reason === "sin_clima_valido" ? <Button asChild variant="outline"><Link to="/clima">Actualizar clima</Link></Button> : <Button asChild variant="outline"><Link to="/sensores">Revisar sensores</Link></Button> : <p className="text-sm text-neutral-700">{FARMER_CONTACT_COPY}</p>}</div> : null}
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Humedad del suelo" value={humidity.actual === null ? "—" : `${fmtNum(humidity.actual)}%`} detail={humidity.threshold === null ? "Umbral de riego no disponible" : `Umbral relativo estimado: ${fmtNum(humidity.threshold)}%`} icon={<Droplets size={17} />} /><Metric label="Temperatura de tierra" value={current.inputs_snapshot.temperatura_suelo_c == null ? "—" : `${fmtNum(current.inputs_snapshot.temperatura_suelo_c)} °C`} detail={current.inputs_snapshot.temperatura_suelo_estado === "vigente" ? "DS18B20 · dato informativo" : "DS18B20 · sin lectura en 30 min"} icon={<Thermometer size={17} />} /><Metric label="Lluvia prevista" value={rain.mm === null ? "—" : `${fmtNum(rain.mm)} mm`} detail={rain.probability === null ? "Probabilidad no disponible" : `${rain.probability}% de probabilidad`} icon={<CloudRain size={17} />} /><Metric label="Motivo" value={reasonShort(current.reason)} detail={current.next_at ? `Próxima revisión: ${fmtDateTime(current.next_at)}` : "Consulta los datos usados para esta recomendación."} icon={<AlertCircle size={17} />} /></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void evaluation.share()} disabled={evaluation.sharing}><MessageCircle size={16} aria-hidden="true" />{evaluation.sharing ? "Preparando…" : "Compartir por WhatsApp"}</Button><Button variant="ghost" onClick={evaluation.reset}>Nueva evaluación</Button></div>
    </section> : plots.plotId === null ? <EmptyBlock title="Elige una parcela" description="Selecciona una parcela para ver su estado y solicitar una recomendación." /> : null}

    <section aria-labelledby="history-title" className="space-y-3"><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Registro</p><h2 id="history-title" className="mt-1 text-lg font-semibold text-neutral-900">Evaluaciones recientes</h2><p className="mt-1 text-sm text-neutral-600">Historial de la parcela seleccionada.</p></div><Button variant="ghost" size="sm" onClick={history.reload} disabled={history.loading}>{history.loading ? "Actualizando…" : "Actualizar"}</Button></div>{history.error ? <p role="alert" className="text-sm text-danger-700">{history.error}</p> : history.loading ? <LoadingBlock label="Cargando historial…" /> : history.history.length ? <Card className="overflow-hidden rounded-xl"><div className="divide-y divide-neutral-200">{history.history.slice(0, 8).map((item) => <div key={item.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4"><div className="min-w-0"><p className="text-sm font-medium text-neutral-900">{fmtDateTime(item.evaluated_at)}</p><p className="mt-0.5 text-xs text-neutral-600">{reasonShort(item.reason)}</p></div><div className="flex items-center gap-3"><StatusBadge value={item.result} />{item.min_liters && item.max_liters ? <span className="text-sm tabular-nums text-neutral-700">{fmtNum(item.min_liters)}–{fmtNum(item.max_liters)} L</span> : null}</div></div>)}</div></Card> : <EmptyBlock title="Todavía no hay evaluaciones" description="Cuando evalúes esta parcela, sus resultados aparecerán aquí." />}</section>
  </div>;
}



