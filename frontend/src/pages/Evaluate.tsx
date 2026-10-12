/* Evaluar riego: elige parcela → veredicto idempotente + historial + WhatsApp. */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, ChevronDown, Clock, Gauge, LoaderCircle, Map as MapIcon } from "lucide-react";
import { ApiError } from "../api/client";
import {
  createIrrigation,
  evaluatePlot,
  getEvaluationMessage,
  listEvaluations,
  listIrrigations,
  listPlots,
} from "../api/endpoints";
import type { Evaluation, Plot } from "../api/types";
import { PageHead } from "../components/shadcn/page-head";
import { Badge, badgeVariantForTone } from "../components/shadcn/badge";
import { Banner, Empty, Loading } from "../components/shadcn/feedback";
import { Button } from "../components/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/shadcn/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/shadcn/table";
import { SoilMeter } from "../components/shadcn/soil-meter";
import { VerdictCard, type VerdictTone } from "../components/shadcn/verdict-card";
import { FormField } from "../components/forms/FormField";
import { toastError, toastInfo, toastOk } from "../lib/toast";
import { ageLabel, badgeToneForResult, fmtDateTime, fmtNum, reasonLabel, resultLabel, toNum } from "../lib/format";

const SELECT_CLS =
  "h-12 w-full rounded-sm border border-neutral-400 bg-white px-3 text-sm text-neutral-800 transition-all hover:border-primary-600 focus-visible:border-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15 disabled:cursor-not-allowed disabled:opacity-50";

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

  const traceability = current ? (
              <details open className="rounded-lg border border-neutral-200 bg-white text-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-3 font-medium text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15 [&::-webkit-details-marker]:hidden">
                  Cómo se calculó · Datos usados
                  <ChevronDown className="h-3.5 w-3.5 text-neutral-500" aria-hidden="true" />
                </summary>
                <div className="grid gap-2 border-t border-neutral-200 p-3">
                  <dl className="trace-ledger grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
                    <dt className="text-neutral-500">ET₀ / ETc</dt>
                    <dd className="font-medium tabular-nums text-neutral-800">
                      {toNum(snap.et0_mm_dia)?.toFixed(2) ?? "—"} / {toNum(snap.etc_mm_dia)?.toFixed(2) ?? "—"} mm/día
                    </dd>
                    <dt className="text-neutral-500">Umbral / Lámina neta</dt>
                    <dd className="font-medium tabular-nums text-neutral-800">
                      {typeof snap.umbral === "number" ? `${(snap.umbral * 100).toFixed(2)}%` : "—"} /{" "}
                      {typeof snap.lamina_neta_mm === "number" ? `${snap.lamina_neta_mm.toFixed(1)} mm` : "—"}
                    </dd>
                    <dt className="text-neutral-500">Volumen bruto</dt>
                    <dd className="font-medium tabular-nums text-neutral-800">
                      {typeof snap.volumen_bruto_L === "number" ? `${fmtNum(snap.volumen_bruto_L)} L` : "—"}
                    </dd>
                    <dt className="text-neutral-500">Lluvia prevista 6 h</dt>
                    <dd className="font-medium tabular-nums text-neutral-800">
                      {typeof snap.rain_mm === "number" ? `${snap.rain_mm} mm` : "—"} (
                      {typeof snap.rain_prob === "number" ? `${Math.round(snap.rain_prob * 100)}%` : "—"})
                    </dd>
                    <dt className="text-neutral-500">Suelo / Kc / Zr</dt>
                    <dd className="font-medium text-neutral-800">
                      {String(snap.soil_code ?? "—")} · Kc {String(snap.kc ?? "—")} · Zr {String(snap.zr_m ?? "—")} m
                    </dd>
                    <dt className="text-neutral-500">Etapa</dt>
                    <dd className="font-medium text-neutral-800">{current.stage ? `Etapa ${current.stage}` : "—"}</dd>
                    <dt className="text-neutral-500">Revisar</dt>
                    <dd className="font-medium text-neutral-800">{current.next_at ? fmtDateTime(current.next_at) : "Sin próxima revisión"}</dd>
                  </dl>
                </div>
              </details>
  ) : null;

  return (
    <div>
      <PageHead
        eyebrow="Planificación del riego"
        title="Evaluar riego"
        desc="Del estado del suelo a una recomendación clara. Selecciona una parcela para comenzar."
        crumbs="YakuAI / Evaluar"
      />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <Card aria-label="Seleccionar parcela" className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Selecciona una parcela</CardTitle>
            <CardDescription>La recomendación utiliza sus datos de suelo, cultivo y clima.</CardDescription>
          </CardHeader>
          <CardContent className="evaluation-selector grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto] xl:items-end">
            {loadingPlots ? (
              <Loading text="Cargando parcelas…" />
            ) : error ? (
              <Banner kind="bad">{error}</Banner>
            ) : plots.length === 0 ? (
              <Empty
                icon={<MapIcon className="h-5 w-5" aria-hidden="true" />}
                title="Sin parcelas"
                hint="Tu técnico debe registrar tu parcela primero."
              />
            ) : (
              <>
                <FormField label="Parcela" required htmlFor="ev-plot">
                  <select
                    id="ev-plot"
                    className={SELECT_CLS}
                    value={plotId ?? ""}
                    onChange={(e) => setPlotId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Selecciona…</option>
                    {plots.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.farmer?.name ?? ""} · {p.crop?.name ?? ""}
                      </option>
                    ))}
                  </select>
                </FormField>
                {plot ? (
                  <dl className="grid grid-cols-2 gap-2 rounded-md bg-neutral-100 p-3 text-sm">
                    <div><dt className="text-xs text-neutral-500">Cultivo</dt><dd className="font-medium text-neutral-800">{plot.crop?.name ?? "—"}</dd></div>
                    <div><dt className="text-xs text-neutral-500">Superficie</dt><dd className="font-medium tabular-nums text-neutral-800">{fmtNum(plot.area_m2)} m²</dd></div>
                    <div><dt className="text-xs text-neutral-500">Siembra</dt><dd className="font-medium text-neutral-800">{plot.sowing_date}</dd></div>
                    <div><dt className="text-xs text-neutral-500">Sistema de riego</dt><dd className="font-medium text-neutral-800">{plot.irrigation_system}</dd></div>
                  </dl>
                ) : null}
                <p className="flex items-start gap-2 text-sm text-neutral-600 xl:sr-only">
                  <Gauge className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary-700" aria-hidden="true" />
                  Evalúa las condiciones actuales para saber si es momento de regar.
                </p>
                <Button size="lg" className="w-full" disabled={plotId === null || busy} onClick={() => void onEvaluate()}>
                  {busy ? (
                    <>
                      <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                      Evaluar riego
                    </>
                  ) : (
                    <>Evaluar riego</>
                  )}
                </Button>
                <p className="text-xs text-neutral-500 xl:col-span-3">Si ya evaluaste esta parcela en esta misma hora, se mostrará el mismo resultado.</p>
              </>
            )}
          </CardContent>
        </Card>

        <section aria-live="polite" aria-label="Resultado" className="min-w-0">
          {!current ? (
            <Empty
              icon={<Gauge className="h-5 w-5" aria-hidden="true" />}
              title="Tu recomendación aparecerá aquí"
              hint="Selecciona una parcela y pulsa Evaluar riego para consultar el resultado y los datos que lo respaldan."
            />
          ) : (
            <VerdictCard
              tone={current.result as VerdictTone}
              kicker={`${plot?.name ?? `Parcela #${current.plot_id}`} · ${fmtDateTime(current.evaluated_at)} · ${ageLabel(current.evaluated_at)}`}
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
                <>
                  <Button variant="outline" size="sm" disabled={sharing} onClick={() => void onShare()}>
                    {sharing ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Compartir por WhatsApp
                      </>
                    ) : (
                      <>Compartir por WhatsApp</>
                    )}
                  </Button>
                  {current.result === "riega" ? (
                    <Button size="sm" disabled={confirming} onClick={() => void onConfirmIrrigation()}>
                      {confirming ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                          Ya regué
                        </>
                      ) : (
                        <>Ya regué</>
                      )}
                    </Button>
                  ) : null}
                  {current.is_critical ? <Badge variant="destructive">Prioridad</Badge> : null}
                  <Badge variant={badgeVariantForTone(badgeToneForResult(current.result, current.is_critical))}>
                    {resultLabel(current.result)}
                  </Badge>
                </>
              }
            >
              <p className="text-sm text-neutral-700">{reasonLabel(current.reason)}</p>
              {current.result === "incompleta" && INCOMPLETE_HELP[current.reason] ? (
                <p className="text-sm text-neutral-700">
                  {INCOMPLETE_HELP[current.reason].text}{" "}
                  <Link
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15"
                    to={INCOMPLETE_HELP[current.reason].to}
                  >
                    {INCOMPLETE_HELP[current.reason].action} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </p>
              ) : null}
              <SoilMeter actual={hum} umbral={umb} critico={pmp} />

            </VerdictCard>
          )}
        </section>
        {current ? <section aria-label="Datos de la evaluación" className="evaluation-trace min-w-0">{traceability}</section> : null}
      </div>

      <Card className="mt-4" aria-label="Evaluaciones anteriores">
        <CardHeader>
          <CardTitle>Historial de evaluaciones</CardTitle>
          <CardDescription>Consulta los resultados anteriores de la parcela seleccionada (últimas 20).</CardDescription>
        </CardHeader>
        <CardContent>
          {plotId === null ? (
            <p className="text-sm text-neutral-500">Elige una parcela para ver su historial.</p>
          ) : loadingHist ? (
            <Loading text="Cargando historial…" />
          ) : history.length === 0 ? (
            <Empty
              icon={<Clock className="h-5 w-5" aria-hidden="true" />}
              title="Sin historial"
              hint="Esta parcela aún no tiene evaluaciones."
            />
          ) : (
            <div className="relative w-full overflow-x-auto rounded-md border border-neutral-200" role="region" aria-label="Historial de evaluaciones" tabIndex={0}>
              <Table>
                <caption className="sr-only">Historial de evaluaciones de la parcela</caption>
                <TableHeader>
                  <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                    <TableHead>Fecha</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead className="text-right tabular-nums">Cantidad</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell>{fmtDateTime(h.evaluated_at)}</TableCell>
                      <TableCell>
                        <Badge variant={badgeVariantForTone(badgeToneForResult(h.result, h.is_critical))}>
                          {h.is_critical ? "Crítica" : resultLabel(h.result)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {h.min_liters && h.max_liters ? `${fmtNum(h.min_liters)}–${fmtNum(h.max_liters)} L` : "—"}
                      </TableCell>
                      <TableCell className="text-neutral-500">{reasonLabel(h.reason)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}