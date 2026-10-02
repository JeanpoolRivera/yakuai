/* Evaluar riego: elige parcela → veredicto idempotente + historial + WhatsApp. */
import { useEffect, useMemo, useState } from "react";
import { ApiError } from "../api/client";
import {
  createIrrigation,
  evaluatePlot,
  getEvaluationMessage,
  listEvaluations,
  listPlots,
} from "../api/endpoints";
import type { Evaluation, Plot } from "../api/types";
import {
  Badge,
  Banner,
  Button,
  Card,
  Empty,
  Field,
  Icon,
  Loading,
  PageHead,
  SelectInput,
  SoilMeter,
  VerdictCard,
} from "../components/ui";
import { toastError, toastInfo, toastOk } from "../lib/toast";
import { badgeToneForResult, fmtDateTime, fmtNum, resultLabel, toNum } from "../lib/format";

const REASON_LABEL: Record<string, string> = {
  humedad_suficiente: "La tierra aún tiene agua suficiente.",
  bajo_umbral: "La humedad bajó del umbral del cultivo.",
  humedad_critica: "Humedad crítica: riega hoy mismo.",
  lluvia_prevista_suficiente: "Viene lluvia suficiente en 6 h. Mejor espera.",
  sin_humedad_valida: "Sin lectura de humedad válida (últimos 30 min).",
  sin_clima_valido: "Sin pronóstico vigente (últimas 3 h).",
};

function verdictTitle(e: Evaluation): string {
  if (e.result === "riega") return e.is_critical ? "Riega hoy mismo" : "Toca regar";
  if (e.result === "no") return "La tierra está bien";
  if (e.result === "espera") return "Mejor espera";
  return "Revisar datos";
}

export function Evaluate(): React.JSX.Element {
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

  useEffect(() => {
    listPlots()
      .then((p) => {
        setPlots(p);
        if (p.length === 1) setPlotId(p[0].id);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "No se pudieron cargar las parcelas.");
      })
      .finally(() => setLoadingPlots(false));
  }, []);

  async function loadHistory(id: number): Promise<void> {
    setLoadingHist(true);
    try {
      // El backend ignora plot_id para agricultor: filtramos en cliente.
      const h = await listEvaluations(id);
      setHistory(h.filter((e) => e.plot_id === id).slice(0, 20));
    } catch {
      setHistory([]);
    } finally {
      setLoadingHist(false);
    }
  }

  useEffect(() => {
    if (plotId !== null) {
      setCurrent(null);
      void loadHistory(plotId);
    }
  }, [plotId]);

  const plot = useMemo(() => plots.find((p) => p.id === plotId) ?? null, [plots, plotId]);

  async function onEvaluate(): Promise<void> {
    if (plotId === null) return;
    setBusy(true);
    try {
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
  const hum = typeof snap.humedad_pct === "number" ? snap.humedad_pct : null;
  const umb = typeof snap.umbral === "number" ? snap.umbral * 100 : null;
  const pmp = typeof snap.pmp === "number" ? snap.pmp * 100 : null;

  return (
    <div className="page ops-page">
      <PageHead
        eyebrow="Planificación del riego"
        title="Evaluar riego"
        desc="Del estado del suelo a una recomendación clara. Selecciona una parcela para comenzar."
        crumbs="YakuAI / Evaluar"
      />

      <div className="ops-evaluation-grid">
        <Card title="Selecciona una parcela" sub="La recomendación utiliza sus datos de suelo, cultivo y clima." label="Seleccionar parcela">
          {loadingPlots ? (
            <Loading text="Cargando parcelas…" />
          ) : error ? (
            <Banner kind="bad">{error}</Banner>
          ) : plots.length === 0 ? (
            <Empty icon="map" title="Sin parcelas" hint="Tu técnico debe registrar tu parcela primero." />
          ) : (
            <>
              <Field label="Parcela" required htmlFor="ev-plot">
                <SelectInput
                  id="ev-plot"
                  value={plotId ?? ""}
                  onChange={(e) => setPlotId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Selecciona…</option>
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.farmer?.name ?? ""} · {p.crop?.name ?? ""}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              {plot ? (
                <dl className="ops-plot-facts">
                  <div><dt>Cultivo</dt><dd>{plot.crop?.name ?? "—"}</dd></div>
                  <div><dt>Superficie</dt><dd>{fmtNum(plot.area_m2)} m²</dd></div>
                  <div><dt>Siembra</dt><dd>{plot.sowing_date}</dd></div>
                  <div><dt>Sistema de riego</dt><dd>{plot.irrigation_system}</dd></div>
                </dl>
              ) : null}
              <div className="ops-step-note"><Icon name="gauge" size={18} /><p>Evalúa las condiciones actuales para saber si es momento de regar.</p></div>
              <Button variant="action" size="lg" block loading={busy} disabled={plotId === null} onClick={() => void onEvaluate()}>
                Evaluar riego
              </Button>
              <p className="tiny">Si ya evaluaste esta parcela en esta misma hora, se mostrará el mismo resultado.</p>
            </>
          )}
        </Card>

        <section className="stack ops-result" aria-live="polite" aria-label="Resultado">
          {!current ? (
            <Empty icon="gauge" title="Tu recomendación aparecerá aquí" hint="Selecciona una parcela y pulsa Evaluar riego para consultar el resultado y los datos que lo respaldan." />
          ) : (
            <VerdictCard
              tone={current.result}
              kicker={`${plot?.name ?? `Parcela #${current.plot_id}`} · ${fmtDateTime(current.evaluated_at)}`}
              title={verdictTitle(current)}
              amount={
                current.result === "riega" && current.min_liters && current.max_liters
                  ? `${fmtNum(current.min_liters)}–${fmtNum(current.max_liters)} L`
                  : undefined
              }
              chips={[
                "Horario 05:30–07:00",
                `Confianza ${current.confidence ?? "—"}`,
                hum !== null ? `Humedad ${hum.toFixed(1)}%` : "Humedad —",
              ]}
              action={
                <div className="row">
                  <Button variant="outline" size="sm" loading={sharing} onClick={() => void onShare()}>
                    Compartir por WhatsApp
                  </Button>
                  {current.result === "riega" ? (
                    <Button variant="action" size="sm" loading={confirming} onClick={() => void onConfirmIrrigation()}>
                      Ya regué
                    </Button>
                  ) : null}
                  {current.is_critical ? <Badge tone="critica">Prioridad</Badge> : null}
                  <Badge tone={badgeToneForResult(current.result, current.is_critical)}>
                    {resultLabel(current.result)}
                  </Badge>
                </div>
              }
            >
              <p className="small">{REASON_LABEL[current.reason] ?? current.reason}</p>
              <SoilMeter actual={hum} umbral={umb} critico={pmp} />
              <details className="disclosure small">
                <summary>
                  Ver datos usados (trazabilidad) <Icon name="chevron" size={14} />
                </summary>
                <div className="disclosure-body">
                  <dl className="kv">
                    <dt className="kv-dt">ET₀ / ETc</dt>
                    <dd className="kv-dd">
                      {toNum(snap.et0_mm_dia)?.toFixed(2) ?? "—"} / {toNum(snap.etc_mm_dia)?.toFixed(2) ?? "—"} mm/día
                    </dd>
                    <dt className="kv-dt">Umbral / Lámina neta</dt>
                    <dd className="kv-dd">
                      {typeof snap.umbral === "number" ? `${(snap.umbral * 100).toFixed(2)}%` : "—"} /{" "}
                      {typeof snap.lamina_neta_mm === "number" ? `${snap.lamina_neta_mm.toFixed(1)} mm` : "—"}
                    </dd>
                    <dt className="kv-dt">Volumen bruto</dt>
                    <dd className="kv-dd">
                      {typeof snap.volumen_bruto_L === "number" ? `${fmtNum(snap.volumen_bruto_L)} L` : "—"}
                    </dd>
                    <dt className="kv-dt">Lluvia prevista 6 h</dt>
                    <dd className="kv-dd">
                      {typeof snap.rain_mm === "number" ? `${snap.rain_mm} mm` : "—"} (
                      {typeof snap.rain_prob === "number" ? `${Math.round(snap.rain_prob * 100)}%` : "—"})
                    </dd>
                    <dt className="kv-dt">Suelo / Kc / Zr</dt>
                    <dd className="kv-dd">
                      {String(snap.soil_code ?? "—")} · Kc {String(snap.kc ?? "—")} · Zr {String(snap.zr_m ?? "—")} m
                    </dd>
                    <dt className="kv-dt">Etapa</dt>
                    <dd className="kv-dd">{current.stage ? `Etapa ${current.stage}` : "—"}</dd>
                    <dt className="kv-dt">Revisar</dt>
                    <dd className="kv-dd">{current.next_at ? fmtDateTime(current.next_at) : "Sin próxima revisión"}</dd>
                  </dl>
                </div>
              </details>
            </VerdictCard>
          )}
        </section>
      </div>

      <Card title="Historial de evaluaciones" sub="Consulta los resultados anteriores de la parcela seleccionada." label="Evaluaciones anteriores">
        {plotId === null ? (
          <p className="muted small">Elige una parcela para ver su historial.</p>
        ) : loadingHist ? (
          <Loading text="Cargando historial…" />
        ) : history.length === 0 ? (
          <Empty icon="clock" title="Sin historial" hint="Esta parcela aún no tiene evaluaciones." />
        ) : (
          <div className="table-wrap responsive-table" tabIndex={0} role="region" aria-label="Historial de evaluaciones">
            <table className="tbl" role="table">
              <caption className="sr-only">Historial de evaluaciones de la parcela</caption>
              <thead role="rowgroup">
                <tr role="row">
                  <th scope="col" role="columnheader">Fecha</th>
                  <th scope="col" role="columnheader">Resultado</th>
                  <th scope="col" role="columnheader">Cantidad</th>
                  <th scope="col" role="columnheader">Motivo</th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {history.map((h) => (
                  <tr role="row" key={h.id}>
                    <td role="cell" data-label="Fecha">{fmtDateTime(h.evaluated_at)}</td>
                    <td role="cell" data-label="Resultado">
                      <Badge tone={badgeToneForResult(h.result, h.is_critical)}>
                        {h.is_critical ? "Crítica" : resultLabel(h.result)}
                      </Badge>
                    </td>
                    <td role="cell" data-label="Cantidad" className="num">
                      {h.min_liters && h.max_liters
                        ? `${fmtNum(h.min_liters)}–${fmtNum(h.max_liters)} L`
                        : "—"}
                    </td>
                    <td role="cell" data-label="Motivo" className="muted">{REASON_LABEL[h.reason] ?? h.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
