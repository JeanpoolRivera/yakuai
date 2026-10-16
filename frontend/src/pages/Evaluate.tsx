/* Evaluar riego: elige parcela → veredicto idempotente + historial + WhatsApp. */
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../app/auth";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Clock, CloudRain, Droplet, LoaderCircle, Search, Sprout } from "lucide-react";
import { ApiError } from "../api/client";
import {
  createIrrigation,
  evaluatePlot,
  getEvaluationMessage,
  listEvaluations,
  listIrrigations,
  listPlots,
  refreshWeather,
} from "../api/endpoints";
import type { Evaluation, Plot } from "../api/types";
import { Action, FieldBlank, FieldError, FieldLoading, FieldPage, Status } from "../components/field/FieldUI";








import { toastError, toastInfo, toastOk } from "../lib/toast";
import { ageLabel, fmtDateTime, fmtNum, reasonLabel, resultLabel, toNum } from "../lib/format";


const INCOMPLETE_HELP: Record<string, { text: string; to: string; action: string }> = {
  sin_humedad_valida: {
    text: "Registra una lectura reciente para poder decidir.",
    to: "/sensores",
    action: "Ir a sensores",
  },
  sin_clima_valido: {
    text: "Actualiza el pronóstico de la parcela para poder decidir.",
    to: "/clima",
    action: "Ir a clima",
  },
};

function verdictTitle(e: Evaluation): string {
  if (e.result === "riega") return e.is_critical ? "Riego prioritario" : "Es momento de regar";
  if (e.result === "no") return "No es necesario regar";
  if (e.result === "espera") return "Espera antes de regar";
  return "Revisar datos";
}

export function Evaluate(): React.JSX.Element {
  const { role } = useAuth();
  const isStaff = role === "tecnico" || role === "admin";
  const [view, setView] = useState<"evaluation" | "history">("evaluation");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(9);
  const resultTitle = useRef<HTMLHeadingElement>(null);
  const historyRequest = useRef(0);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [plotId, setPlotId] = useState<number | null>(null);
  const [history, setHistory] = useState<Evaluation[]>([]);
  const [current, setCurrent] = useState<Evaluation | null>(null);
  const [loadingPlots, setLoadingPlots] = useState(true);
  const [loadingHist, setLoadingHist] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (current && !busy && view === "evaluation") resultTitle.current?.focus(); }, [current, busy, view]);

  const location = useLocation();
  const requestedPlotId = useMemo(() => {
    const state = location.state as { plotId?: unknown } | null;
    return typeof state?.plotId === "number" ? state.plotId : null;
  }, [location.state]);

  useEffect(() => {
    listPlots()
      .then((p) => {
        setPlots(p);
        if (requestedPlotId !== null && p.some((x) => x.id === requestedPlotId)) {
          setPlotId(requestedPlotId);
        } else if (p.length === 1) {
          setPlotId(p[0].id);
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "No se pudieron cargar las parcelas.");
      })
      .finally(() => setLoadingPlots(false));
  }, [requestedPlotId]);

  async function loadHistory(id: number): Promise<void> {
    const request = ++historyRequest.current;
    setHistoryError(null);
    setLoadingHist(true);
    try {
      // El backend ignora plot_id para agricultor: filtramos en cliente.
      const h = await listEvaluations(id);
      if (request === historyRequest.current) setHistory(h.filter((e) => e.plot_id === id).sort((a, b) => Date.parse(b.evaluated_at) - Date.parse(a.evaluated_at)).slice(0, 20));
    } catch {
      if (request === historyRequest.current) { setHistory([]); setHistoryError("No se pudo cargar el historial."); }
    } finally {
      if (request === historyRequest.current) setLoadingHist(false);
    }
  }

  useEffect(() => {
    if (plotId !== null) {
      setCurrent(null);
      void loadHistory(plotId);
    } else { setCurrent(null); setHistory([]); }
    return () => { historyRequest.current += 1; };
  }, [plotId]);

  const plot = useMemo(() => plots.find((p) => p.id === plotId) ?? null, [plots, plotId]);

  async function onEvaluate(): Promise<void> {
    if (plotId === null) return;
    setCurrent(null);
    setBusy(true);
    try {
      // 1 clic = actualiza clima OWM y evalúa con dato fresco.
      try {
        await refreshWeather(plotId);
      } catch {
        // Si el refresh falla, se evalúa igual (el backend usa el último válido).
      }
      const ev = await evaluatePlot(plotId);
      setCurrent(ev);
      await loadHistory(plotId);
      if (ev.result === "riega") toastOk(ev.is_critical ? "Humedad crítica: riega hoy mismo." : "Recomendación lista: toca regar.");
      else if (ev.result === "espera") toastInfo("Viene lluvia: mejor esperar 6 horas.");
      else if (ev.result === "no") toastOk("La tierra está bien. Sin riego por ahora.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 422 && err.data) {
        const ev = err.data as Evaluation; // incompleta: el backend devuelve la evaluación creada
        setCurrent(ev);
        await loadHistory(plotId);
        toastInfo("Faltan datos para decidir. Revisa qué está pendiente.");
      } else {
        toastError(err instanceof Error ? err.message : "No se pudo evaluar.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function onShare(): Promise<void> {
    if (!current) return;
    setSharing(true);
    try {
      const { texto } = await getEvaluationMessage(current.id);
      const win = window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
      if (win === null) {
        toastInfo("El navegador bloqueó la ventana: permite ventanas emergentes para compartir por WhatsApp.");
      }
    } catch (err) {
      toastError(err instanceof Error ? err.message : "No se pudo generar el mensaje.");
    } finally {
      setSharing(false);
    }
  }

  async function onConfirmIrrigation(): Promise<void> {
    if (!current || current.result !== "riega") return;
    setConfirming(true);
    try {
      // El backend ignora plot_id para agricultor: filtramos en cliente.
      const recent = await listIrrigations(current.plot_id);
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const alreadyWatered = recent.some(
        (r) => r.plot_id === current.plot_id && r.status === "activo" && new Date(r.occurred_at).getTime() >= dayAgo,
      );
      if (alreadyWatered) {
        toastInfo("Esta parcela ya tiene un riego registrado en las últimas 24 horas. Revisa el historial antes de regar de nuevo.");
        return;
      }
      const avg =
        current.min_liters && current.max_liters
          ? Math.round((Number(current.min_liters) + Number(current.max_liters)) / 2)
          : 0;
      await createIrrigation({
        plot_id: current.plot_id,
        evaluation_id: current.id,
        occurred_at: new Date().toISOString().slice(0, 19),
        recommended_liters: avg,
        applied_liters: avg,
        note: "Confirmado con 1 desde Evaluar",
      });
      toastOk("Riego anotado. Mañana verificamos si la tierra se recuperó.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "No se pudo anotar el riego.");
    } finally {
      setConfirming(false);
    }
  }

  const snap = current?.inputs_snapshot ?? {};
  // Backend: humedad_pct en porcentaje; umbral/pmp en fracción. SoilMeter espera porcentaje.
  const hum = typeof snap.humedad_pct === "number" ? snap.humedad_pct : null;
  const umb = typeof snap.umbral === "number" ? snap.umbral * 100 : null;
  const pmp = typeof snap.pmp === "number" ? snap.pmp * 100 : null;

  const matching = plots.filter((p) => `${p.name} ${p.crop?.name ?? ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const tone = current?.is_critical ? "bad" : current?.result === "riega" ? "warn" : current?.result === "no" ? "good" : current?.result === "espera" ? "blue" : "neutral";

  function choose(id: number | null): void {
    if (id === plotId) return;
    historyRequest.current += 1;
    setCurrent(null); setHistory([]); setPlotId(id); setView("evaluation");
  }

  return <FieldPage title="Evaluar riego" intro="Una decisión de riego, con los datos de tu parcela." actions={
    <Action tone="line" disabled={plotId === null || busy} onClick={() => setView(view === "history" ? "evaluation" : "history")}><Clock size={16} />{view === "history" ? "Volver a evaluación" : "Historial de la parcela"}</Action>
  }>
    {loadingPlots ? <FieldLoading>Cargando parcelas…</FieldLoading> : error ? <FieldError>{error}</FieldError> : <div className="irrigation-workspace">
      <aside className="irrigation-context" aria-label="Seleccionar parcela">
        <header className="field-panel-heading"><span className="field-step">01</span><div><h2>Selecciona la parcela</h2><p>El punto de partida de tu evaluación.</p></div></header>
        <div className="irrigation-search"><label className="field-search"><Search size={16} aria-hidden="true" /><input type="search" aria-label="Buscar parcela" placeholder="Buscar parcela o cultivo" value={query} disabled={busy || confirming} onChange={(e) => { setQuery(e.target.value); setVisible(9); }} /></label></div>
        {!plots.length ? <FieldBlank title="Sin parcelas" icon={<Sprout size={24} />}>Primero debe registrarse una parcela.</FieldBlank> : !matching.length ? <FieldBlank title="No encontramos esa parcela" action={<Action tone="line" onClick={() => setQuery("")}>Limpiar búsqueda</Action>}>Prueba con otro nombre o cultivo.</FieldBlank> : <div className="irrigation-plot-list">{matching.slice(0,visible).map((p) => <button type="button" key={p.id} className="irrigation-plot" aria-pressed={plotId === p.id} aria-label={`Seleccionar ${p.name}`} disabled={busy || confirming} onClick={() => choose(p.id)}>
          <span className="irrigation-plot-icon"><Sprout size={19} aria-hidden="true" /></span><span><strong>{p.name}</strong><small>{p.crop?.name ?? "Sin cultivo"} · {fmtNum(p.area_m2)} m²</small>{isStaff && p.farmer?.name && <small>{p.farmer.name}</small>}</span><span className="choice-mark" aria-hidden="true">{plotId === p.id && <Check size={12} />}</span>
        </button>)}</div>}
        {visible < matching.length && <Action tone="quiet" onClick={() => setVisible((n) => n + 9)}>Mostrar más parcelas</Action>}
        <footer className="irrigation-context-footer">{plot ? <dl><div><dt>Sistema de riego</dt><dd>{({goteo:"Goteo",aspersion:"Aspersión",gravedad:"Gravedad"})[plot.irrigation_system]}</dd></div><div><dt>Fecha de siembra</dt><dd>{plot.sowing_date}</dd></div></dl> : <p>Selecciona una parcela para continuar.</p>}<Action disabled={!plot || busy || confirming} onClick={() => { setView("evaluation"); void onEvaluate(); }}>{busy ? <LoaderCircle size={16} className="animate-spin" /> : <Droplet size={16} />}Evaluar riego<ArrowRight size={16} /></Action></footer>
      </aside>
      <div className="irrigation-main">
      {view === "history" ? <section className="field-panel" aria-label="Evaluaciones anteriores">
        <header className="field-panel-heading"><div><h2>Evaluaciones anteriores</h2><p>{plot?.name} · Últimos 20 resultados</p></div></header>
        {loadingHist ? <FieldLoading>Cargando historial…</FieldLoading> : historyError ? <FieldError retry={() => { if (plotId !== null) void loadHistory(plotId); }}>{historyError}</FieldError> : !history.length ? <FieldBlank title="Sin historial" icon={<Clock size={24} />}>Esta parcela aún no tiene evaluaciones.</FieldBlank> : <ol className="eval-history">{history.map((h) => <li key={h.id}><time dateTime={h.evaluated_at}>{fmtDateTime(h.evaluated_at)}</time><div><Status tone={h.is_critical ? "bad" : h.result === "riega" ? "warn" : h.result === "no" ? "good" : "neutral"}>{h.is_critical ? "Riego prioritario" : resultLabel(h.result)}</Status><p>{reasonLabel(h.reason)}</p></div><span>{h.min_liters && h.max_liters ? `${fmtNum(h.min_liters)}–${fmtNum(h.max_liters)} L` : "—"}</span></li>)}</ol>}
      </section> : busy ? <div className="field-panel"><FieldLoading>Analizando suelo, cultivo y clima…</FieldLoading></div> : !current ? <section className="evaluation-ready" aria-label="Preparar evaluación">
        <header className="field-panel-heading"><span className="field-step">02</span><div><h2>Recomendación de riego</h2><p>La información necesaria para decidir.</p></div></header>
        <div className="evaluation-ready-body"><span className="evaluation-emblem"><Droplet size={32} strokeWidth={1.4} /></span><p className="field-eyebrow">{plot ? plot.name : "TU PRÓXIMA DECISIÓN"}</p><h2>{plot ? "Todo empieza con los datos." : "¿Necesita agua tu parcela?"}</h2><p>Al evaluar, conocerás si conviene regar, esperar o mantener la humedad actual, y cuánta agua aplicar cuando corresponda.</p></div>
        <div className="evaluation-inputs"><div><Droplet size={19} /><strong>Suelo</strong><span>Humedad reciente</span></div><div><Sprout size={19} /><strong>Cultivo</strong><span>Etapa y necesidades</span></div><div><CloudRain size={19} /><strong>Clima</strong><span>Previsión de lluvia</span></div></div>
        <p className="evaluation-ready-note">Si falta información, te indicaremos qué dato necesita revisión.</p>
      </section> : <section aria-live="polite" aria-label="Resultado">      <article className="eval-report">
        <header className="eval-report-top"><div><p className="field-eyebrow">Informe de riego</p><h2 ref={resultTitle} tabIndex={-1}>{plot?.name ?? `Parcela #${current.plot_id}`}</h2><p>Evaluada {ageLabel(current.evaluated_at)}</p></div><Status tone={tone}>{current.is_critical ? "Prioridad alta" : resultLabel(current.result)}</Status></header>
        <div className="eval-verdict"><div className="eval-decision" data-result={current.result}>
          <h3>{verdictTitle(current)}</h3><p>{reasonLabel(current.reason)}</p>
          {current.result === "riega" && current.min_liters && current.max_liters && <><div className="eval-volume">{fmtNum(current.min_liters)}–{fmtNum(current.max_liters)} <small>L</small></div><p>Volumen recomendado para esta parcela</p></>}
          {current.result === "incompleta" && INCOMPLETE_HELP[current.reason] && <><p>{INCOMPLETE_HELP[current.reason].text}</p>{isStaff ? <Link className="field-button line mt-4" to={INCOMPLETE_HELP[current.reason].to} state={{plotId:current.plot_id}}>{INCOMPLETE_HELP[current.reason].action}<ArrowRight size={15} /></Link> : <p>Contacta a tu técnico para actualizar los datos de esta parcela.</p>}</>}
        </div><dl className="eval-evidence">
          <div className="evidence-line"><Droplet size={21} /><div><dt>Humedad del suelo</dt><dd>{hum === null ? "Sin lectura válida" : `${hum.toFixed(1)}%`}</dd>{umb !== null && <span className="field-footnote">Umbral de riego: {umb.toFixed(1)}%</span>}</div></div>
          <div className="evidence-line"><CloudRain size={21} /><div><dt>Lluvia prevista · 6 horas</dt><dd>{typeof snap.rain_mm === "number" ? `${snap.rain_mm} mm` : "Sin datos"}</dd>{typeof snap.rain_prob === "number" && <span className="field-footnote">{Math.round(snap.rain_prob * 100)}% de probabilidad</span>}</div></div>
          <div className="evidence-line"><Clock size={21} /><div><dt>Próxima revisión</dt><dd>{current.next_at ? fmtDateTime(current.next_at) : "No programada"}</dd></div></div>
        </dl></div>
        <footer className="eval-report-actions"><Action tone="quiet" disabled={confirming} onClick={() => choose(null)}><ArrowLeft size={15} />Cambiar parcela</Action><div className="field-actions"><Action tone="line" disabled={sharing} onClick={() => void onShare()}>{sharing ? "Preparando…" : "Compartir por WhatsApp"}</Action>{current.result === "riega" && <Action disabled={confirming} onClick={() => void onConfirmIrrigation()}>{confirming && <LoaderCircle size={16} className="animate-spin" />}{confirming ? "Registrando…" : "Ya regué"}</Action>}</div></footer>
      </article>
      <details className="field-disclosure"><summary>Consultar el cálculo y los datos utilizados</summary><dl className="field-facts">
        <div><dt>Evaluada</dt><dd>{fmtDateTime(current.evaluated_at)}</dd></div><div><dt>Confianza</dt><dd>{current.confidence ?? "No disponible"}</dd></div><div><dt>ET₀ / ETc</dt><dd>{toNum(snap.et0_mm_dia)?.toFixed(2) ?? "—"} / {toNum(snap.etc_mm_dia)?.toFixed(2) ?? "—"} mm/día</dd></div>
        <div><dt>Punto de marchitez</dt><dd>{pmp !== null ? `${pmp.toFixed(1)}%` : "—"}</dd></div><div><dt>Lámina neta</dt><dd>{typeof snap.lamina_neta_mm === "number" ? `${snap.lamina_neta_mm.toFixed(1)} mm` : "—"}</dd></div><div><dt>Volumen bruto</dt><dd>{typeof snap.volumen_bruto_L === "number" ? `${fmtNum(snap.volumen_bruto_L)} L` : "—"}</dd></div>
        <div><dt>Suelo / etapa</dt><dd>{String(snap.soil_code ?? "—")} / {current.stage ?? "—"}</dd></div><div><dt>Kc / profundidad de raíz</dt><dd>{String(snap.kc ?? "—")} / {String(snap.zr_m ?? "—")} m</dd></div>
      </dl></details>
      <p className="field-footnote">Las evaluaciones de una misma hora conservan el mismo resultado.</p>
    </section>}</div></div>}
  </FieldPage>;
}
