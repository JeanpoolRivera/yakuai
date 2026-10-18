/* Evaluar riego: elige parcela → veredicto claro + plan ejecutable. */
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../app/auth";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Check, Clock, CloudRain, Droplet, LoaderCircle, Search, Sprout } from "lucide-react";
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
import { ageLabel, fmtDateTime, fmtDuracion, fmtHora, fmtNum, planFromSnapshot, resultLabel, toNum } from "../lib/format";

const INCOMPLETE_HELP: Record<string, { text: string; to: string; action: string }> = {
  sin_humedad_valida: { text: "Registra una lectura reciente para poder decidir.", to: "/sensores", action: "Ir a sensores" },
  sin_clima_valido: { text: "Actualiza el pronóstico de la parcela para poder decidir.", to: "/clima", action: "Ir a clima" },
};

function verdictTitle(e: Evaluation): string {
  if (e.is_critical) return "Riego prioritario";
  if (e.result === "riega") return "Toca regar";
  if (e.result === "no") return "No riegues";
  if (e.result === "espera") return "Espera";
  return "Falta dato";
}

function heroResult(e: Evaluation): string {
  if (e.is_critical) return "critica";
  return e.result;
}

export function Evaluate(): React.JSX.Element {
  const { role } = useAuth();
  const isStaff = role === "tecnico" || role === "admin";
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

  useEffect(() => { if (current && !busy) resultTitle.current?.focus(); }, [current, busy]);

  const location = useLocation();
  const requestedPlotId = useMemo(() => {
    const state = location.state as { plotId?: unknown } | null;
    return typeof state?.plotId === "number" ? state.plotId : null;
  }, [location.state]);

  useEffect(() => {
    listPlots()
      .then((p) => {
        setPlots(p);
        if (requestedPlotId !== null && p.some((x) => x.id === requestedPlotId)) setPlotId(requestedPlotId);
        else if (p.length === 1) setPlotId(p[0].id);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "No se pudieron cargar las parcelas."))
      .finally(() => setLoadingPlots(false));
  }, [requestedPlotId]);

  async function loadHistory(id: number): Promise<void> {
    const request = ++historyRequest.current;
    setHistoryError(null);
    setLoadingHist(true);
    try {
      const h = await listEvaluations(id);
      if (request === historyRequest.current) setHistory(h.filter((e) => e.plot_id === id).sort((a, b) => Date.parse(b.evaluated_at) - Date.parse(a.evaluated_at)).slice(0, 10));
    } catch {
      if (request === historyRequest.current) { setHistory([]); setHistoryError("No se pudo cargar el historial."); }
    } finally {
      if (request === historyRequest.current) setLoadingHist(false);
    }
  }

  useEffect(() => {
    if (plotId !== null) { setCurrent(null); void loadHistory(plotId); }
    else { setCurrent(null); setHistory([]); }
    return () => { historyRequest.current += 1; };
  }, [plotId]);

  const plot = useMemo(() => plots.find((p) => p.id === plotId) ?? null, [plots, plotId]);

  async function onEvaluate(): Promise<void> {
    if (plotId === null) return;
    setCurrent(null);
    setBusy(true);
    try {
      try { await refreshWeather(plotId); } catch { /* fallback: backend usa último válido */ }
      const ev = await evaluatePlot(plotId);
      setCurrent(ev);
      await loadHistory(plotId);
      if (ev.result === "riega") toastOk(ev.is_critical ? "Humedad crítica: riega hoy mismo." : "Recomendación lista: toca regar.");
      else if (ev.result === "espera") toastInfo("Viene lluvia: mejor esperar 6 horas.");
      else if (ev.result === "no") toastOk("La tierra está bien. Sin riego por ahora.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 422 && err.data) {
        const ev = err.data as Evaluation;
        setCurrent(ev);
        await loadHistory(plotId);
        toastInfo("Faltan datos para decidir. Revisa qué está pendiente.");
      } else {
        toastError(err instanceof Error ? err.message : "No se pudo evaluar.");
      }
    } finally { setBusy(false); }
  }

  async function onShare(): Promise<void> {
    if (!current) return;
    setSharing(true);
    try {
      const { texto } = await getEvaluationMessage(current.id);
      const win = window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
      if (win === null) toastInfo("El navegador bloqueó la ventana: permite ventanas emergentes para compartir por WhatsApp.");
    } catch (err) { toastError(err instanceof Error ? err.message : "No se pudo generar el mensaje."); }
    finally { setSharing(false); }
  }

  async function onConfirmIrrigation(): Promise<void> {
    if (!current || current.result !== "riega") return;
    setConfirming(true);
    try {
      const recent = await listIrrigations(current.plot_id);
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const alreadyWatered = recent.some((r) => r.plot_id === current.plot_id && r.status === "activo" && new Date(r.occurred_at).getTime() >= dayAgo);
      if (alreadyWatered) { toastInfo("Esta parcela ya tiene un riego registrado en las últimas 24 horas."); return; }
      const plan = planFromSnapshot(current.inputs_snapshot);
      const litros = plan?.litros ?? (current.min_liters && current.max_liters ? Math.round((Number(current.min_liters) + Number(current.max_liters)) / 2) : 0);
      await createIrrigation({
        plot_id: current.plot_id, evaluation_id: current.id,
        occurred_at: new Date().toISOString().slice(0, 19),
        recommended_liters: litros, applied_liters: litros,
        note: "Confirmado con 1 desde Evaluar",
      });
      toastOk("Riego anotado. Mañana verificamos si la tierra se recuperó.");
    } catch (err) { toastError(err instanceof Error ? err.message : "No se pudo anotar el riego."); }
    finally { setConfirming(false); }
  }

  const snap = current?.inputs_snapshot ?? {};
  const hum = typeof snap.humedad_pct === "number" ? snap.humedad_pct : null;
  const umb = typeof snap.umbral === "number" ? snap.umbral * 100 : null;
  const pmp = typeof snap.pmp === "number" ? snap.pmp * 100 : null;
  const plan = planFromSnapshot(snap);
  const rainMm = typeof snap.rain_mm === "number" ? snap.rain_mm : null;
  const rainProb = typeof snap.rain_prob === "number" ? Math.round(snap.rain_prob * 100) : null;

  const matching = plots.filter((p) => `${p.name} ${p.crop?.name ?? ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const tone = current?.is_critical ? "bad" : current?.result === "riega" ? "warn" : current?.result === "no" ? "good" : current?.result === "espera" ? "blue" : "neutral";

  function choose(id: number | null): void {
    if (id === plotId) return;
    historyRequest.current += 1;
    setCurrent(null); setHistory([]); setPlotId(id);
  }

  return <FieldPage title="Evaluar riego" intro="">
    {loadingPlots ? <FieldLoading>Cargando parcelas…</FieldLoading> : error ? <FieldError>{error}</FieldError> : <div className="irrigation-workspace">
      <aside className="irrigation-context" aria-label="Seleccionar parcela">
        <header className="field-panel-heading"><div><h2>Parcelas</h2></div></header>
        <div className="irrigation-search"><label className="field-search"><Search size={16} aria-hidden="true" /><input type="search" aria-label="Buscar parcela" placeholder="Buscar parcela o cultivo" value={query} disabled={busy || confirming} onChange={(e) => { setQuery(e.target.value); setVisible(9); }} /></label></div>
        {!plots.length ? <FieldBlank title="Sin parcelas" icon={<Sprout size={24} />}>Primero debe registrarse una parcela.</FieldBlank> : !matching.length ? <FieldBlank title="No encontramos esa parcela" action={<Action tone="line" onClick={() => setQuery("")}>Limpiar búsqueda</Action>}>Prueba con otro nombre o cultivo.</FieldBlank> : <div className="irrigation-plot-list">{matching.slice(0, visible).map((p) => <button type="button" key={p.id} className="irrigation-plot" aria-pressed={plotId === p.id} aria-label={`Seleccionar ${p.name}`} disabled={busy || confirming} onClick={() => choose(p.id)}>
          <span className="irrigation-plot-icon"><Sprout size={19} aria-hidden="true" /></span><span><strong>{p.name}</strong><small>{p.crop?.name ?? "Sin cultivo"} · {fmtNum(p.area_m2)} m²</small>{isStaff && p.farmer?.name && <small>{p.farmer.name}</small>}</span><span className="choice-mark" aria-hidden="true">{plotId === p.id && <Check size={12} />}</span>
        </button>)}</div>}
        {visible < matching.length && <Action tone="quiet" onClick={() => setVisible((n) => n + 9)}>Mostrar más parcelas</Action>}
        <footer className="irrigation-context-footer">
          <Action disabled={!plot || busy || confirming} onClick={() => void onEvaluate()}>{busy ? <LoaderCircle size={16} className="animate-spin" /> : <Droplet size={16} />}Evaluar riego<ArrowRight size={16} /></Action>
        </footer>
      </aside>
      <div className="irrigation-main">
        {busy ? <div className="field-panel"><FieldLoading>Analizando suelo, cultivo y clima…</FieldLoading></div>
          : !current ? <section className="field-panel evaluation-ready" aria-label="Preparar evaluación">
            <span className="evaluation-ready-icon"><Droplet size={24} strokeWidth={1.5} /></span>
            <h2>{plot ? "¿Necesita agua?" : "Elegir parcela"}</h2>
            <p>{plot ? `Pulsa Evaluar riego para ver si ${plot.name} necesita agua.` : "Selecciona una parcela y pulsa Evaluar para ver si necesita agua."}</p>
          </section>
          : <section aria-live="polite" aria-label="Resultado">
            <article className="eval-hero" data-verdict={heroResult(current)}>
              <header className="eval-hero-head">
                <div className="eval-hero-head-main">
                  <p className="eval-hero-eyebrow">{`${plot?.name ?? `Parcela #${current.plot_id}`}${plot?.crop?.name ? ` · ${plot.crop.name}` : ""}${plot ? ` · ${fmtNum(plot.area_m2)} m²` : ""} · ${ageLabel(current.evaluated_at)}`}</p>
                  <h3 ref={resultTitle} tabIndex={-1} className="eval-hero-title" data-result={heroResult(current)}>{verdictTitle(current)}</h3>
                  {current.result === "riega" && plan?.inicio && <p className="eval-hero-schedule">{plan.inicio && `${fmtHora(plan.inicio)}${plan.fin ? ` – ${fmtHora(plan.fin)}` : ""}`}{plan.jornadas > 1 ? ` · ${plan.jornadas} días` : ""}</p>}
                  {current.result === "no" && current.next_at && <p className="eval-hero-schedule">Vuelve a revisar: {fmtDateTime(current.next_at)}</p>}
                  {current.result === "espera" && current.next_at && <p className="eval-hero-schedule">Revisa de nuevo: {fmtDateTime(current.next_at)}</p>}
                </div>
                <Status tone={tone}>{current.is_critical ? "Prioridad alta" : resultLabel(current.result)}</Status>
              </header>
              <div className="eval-hero-body">
                {current.result === "riega" && <div className="eval-hero-stats">
                  <div className="eval-hero-stat"><span><Droplet />Agua</span><strong>{plan ? fmtNum(plan.litros) : current.min_liters && current.max_liters ? `${fmtNum(current.min_liters)}–${fmtNum(current.max_liters)}` : "—"} <small>L</small></strong></div>
                  <div className="eval-hero-stat"><span><Clock />Duración</span><strong>{plan?.minutos != null ? fmtDuracion(plan.minutos) : "—"} </strong></div>
                  <div className="eval-hero-stat"><span><CloudRain />Lluvia 6 h</span><strong>{rainMm != null ? rainMm : "—"} <small>mm{rainProb != null ? ` · ${rainProb}%` : ""}</small></strong></div>
                </div>}
                {current.result !== "riega" && <div className="eval-hero-stats">
                  <div className="eval-hero-stat"><span><Droplet />Suelo</span><strong>{hum != null ? `${hum.toFixed(0)}%` : "—"}</strong></div>
                  <div className="eval-hero-stat"><span><CloudRain />Lluvia 6 h</span><strong>{rainMm != null ? rainMm : "—"} <small>mm{rainProb != null ? ` · ${rainProb}%` : ""}</small></strong></div>
                  <div className="eval-hero-stat"><span><Clock />Revisión</span><strong className="time">{current.next_at ? fmtHora(current.next_at) : "—"}</strong></div>
                </div>}
                {current.result === "riega" && hum != null && <p className="eval-hero-context"><Droplet />{hum < 15 ? "Tierra muy seca" : hum < 25 ? "Tierra seca" : "Tierra con algo de humedad"}</p>}
                {current.result === "incompleta" && INCOMPLETE_HELP[current.reason] && <p className="eval-hero-context"><Droplet />{INCOMPLETE_HELP[current.reason].text}</p>}
                {current.result === "riega" && <div className="eval-hero-action">
                  <Action disabled={confirming} onClick={() => void onConfirmIrrigation()}>{confirming && <LoaderCircle size={16} className="animate-spin" />}{confirming ? "Registrando…" : "Ya regué"}</Action>
                </div>}
                {current.result === "incompleta" && INCOMPLETE_HELP[current.reason] && <div className="eval-hero-action">
                  {isStaff ? <Link className="field-button solid" to={INCOMPLETE_HELP[current.reason].to} state={{ plotId: current.plot_id }}>{INCOMPLETE_HELP[current.reason].action}<ArrowRight size={15} /></Link> : <p className="eval-hero-msg">Contacta a tu técnico.</p>}
                </div>}
                <div className="eval-hero-links">
                  <button type="button" disabled={sharing} onClick={() => void onShare()}>{sharing ? "Preparando…" : "Compartir"}</button>
                </div>
              </div>
            </article>
            {isStaff && <details className="eval-tech">
              <summary>Ver cálculo técnico</summary>
              <div className="eval-tech-body">
                <dl className="eval-tech-grid">
                  <div><dt>Confianza</dt><dd>{current.confidence ?? "No disponible"}</dd></div>
                  <div><dt>Etapa</dt><dd>{current.stage ?? "—"}</dd></div>
                  <div><dt>ET₀ / ETc</dt><dd>{toNum(snap.et0_mm_dia)?.toFixed(2) ?? "—"} / {toNum(snap.etc_mm_dia)?.toFixed(2) ?? "—"} mm/día</dd></div>
                  <div><dt>Kc / Raíz</dt><dd>{String(snap.kc ?? "—")} / {String(snap.zr_m ?? "—")} m</dd></div>
                  <div><dt>Umbral</dt><dd>{umb != null ? `${umb.toFixed(1)}%` : "—"}</dd></div>
                  <div><dt>Punto marchitez</dt><dd>{pmp != null ? `${pmp.toFixed(1)}%` : "—"}</dd></div>
                  <div><dt>Lámina neta</dt><dd>{typeof snap.lamina_neta_mm === "number" ? `${snap.lamina_neta_mm.toFixed(1)} mm` : "—"}</dd></div>
                  <div><dt>Volumen bruto</dt><dd>{typeof snap.volumen_bruto_L === "number" ? `${fmtNum(snap.volumen_bruto_L)} L` : "—"}</dd></div>
                </dl>
                {plan?.nota && <p className="eval-hero-note">{plan.nota}</p>}
              </div>
              <div className="eval-tech-evidence">
                <div><span>Humedad</span><strong>{hum != null ? `${hum.toFixed(1)}%` : "Sin dato"}</strong></div>
                <div><span>Lluvia</span><strong>{rainMm != null ? `${rainMm} mm` : "Sin datos"}</strong></div>
                <div><span>Próxima revisión</span><strong>{current.next_at ? fmtDateTime(current.next_at) : "—"}</strong></div>
              </div>
            </details>}
            {isStaff && (loadingHist ? <p className="eval-hero-loading">Cargando historial…</p> : historyError ? <p className="eval-hero-error">{historyError}</p> : history.length > 0 && <details className="eval-tech">
              <summary>Historial reciente</summary>
              <ol className="eval-history-list">{history.map((h) => <li key={h.id}>
                <time dateTime={h.evaluated_at}>{fmtDateTime(h.evaluated_at)}</time>
                <Status tone={h.is_critical ? "bad" : h.result === "riega" ? "warn" : h.result === "no" ? "good" : "neutral"}>{h.is_critical ? "Prioritario" : resultLabel(h.result)}</Status>
                <span>{h.min_liters && h.max_liters ? `${fmtNum(h.min_liters)}–${fmtNum(h.max_liters)} L` : "—"}</span>
              </li>)}</ol>
            </details>)}
          </section>}
      </div>
    </div>}
  </FieldPage>;
}
