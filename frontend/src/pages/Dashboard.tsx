/* Resumen del día (técnico/admin): KPIs, alertas y últimas evaluaciones. */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Check,
  Clock,
  Droplet,
  Gauge,
  LoaderCircle,
  Map as MapIcon,
  MapPin,
  Radio,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { friendlyError } from "../api/client";
import { listAlerts, listEvaluations, listPlots, listSensors, getMetricsSummary } from "../api/endpoints";
import type { AlertItem, Evaluation } from "../api/types";
import { PageHead } from "../components/shadcn/page-head";
import { Stat } from "../components/shadcn/Stat";
import { DataTable } from "../components/shadcn/data-table";
import { Badge, badgeVariantForTone } from "../components/shadcn/badge";
import { Banner, Empty, Skeletons } from "../components/shadcn/feedback";
import { Button } from "../components/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/shadcn/card";
import { ageLabel, badgeToneForResult, fmtDateTime, fmtNum, resultLabel, todayLong } from "../lib/format";
import { colors } from "../lib/theme";

export function Dashboard(): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plots, setPlots] = useState(0);
  const [sensorsOk, setSensorsOk] = useState(0);
  const [sensorsTotal, setSensorsTotal] = useState(0);
  const [piden, setPiden] = useState(0);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [recent, setRecent] = useState<Evaluation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  async function load(isRefresh = false): Promise<void> {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [p, s, a, e, m] = await Promise.all([
        listPlots(),
        listSensors(),
        listAlerts(),
        listEvaluations(),
        getMetricsSummary(),
      ]);
      setPlots(p.length);
      setSensorsTotal(s.length);
      setSensorsOk(s.filter((x) => x.status === "ok" && x.is_active).length);
      setPiden(m.evaluations_riega);
      setAlerts(a);
      setRecent(e);
      setUpdatedAt(new Date().toISOString());
    } catch (err) {
      setError(friendlyError(err, "No se pudo cargar el resumen."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const criticas = alerts.filter(
    (a) => a.tipo.includes("critica") || a.tipo === "humedad_critica",
  ).length;

  const prioritarias = [...alerts]
    .sort((a, b) => Number(b.tipo.includes("critica")) - Number(a.tipo.includes("critica")))
    .slice(0, 8);

  const today = todayLong();

  return (
    <div>
      <PageHead
        eyebrow="Vista general"
        title="El pulso de tu campo"
        desc="Tus parcelas, las decisiones de riego y lo que necesita atención."
        actions={
          <Button variant="outline" size="sm" onClick={() => void load(true)} disabled={refreshing}>
            {refreshing ? (
              <>
                <LoaderCircle className="h-[15px] w-[15px] animate-spin" aria-hidden="true" />
                Actualizando…
              </>
            ) : (
              <>
                <RefreshCw className="h-[15px] w-[15px]" aria-hidden="true" />
                Actualizar
              </>
            )}
          </Button>
        }
      />
      {error ? (
        <Banner kind="bad">
          {error}{" "}
          <Button variant="link" size="sm" onClick={() => void load()}>
            Reintentar
          </Button>
        </Banner>
      ) : loading ? (
        <Skeletons n={4} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              value={fmtNum(plots)}
              label="Parcelas en seguimiento"
              icon={<MapIcon className="h-[18px] w-[18px]" aria-hidden="true" />}
              sub="Unidades de cultivo registradas"
              to="/parcelas"
            />
            <Stat
              value={fmtNum(piden)}
              label="Necesitan riego"
              icon={<Droplet className="h-[18px] w-[18px]" aria-hidden="true" />}
              tone={piden > 0 ? "warn" : "ok"}
              sub="Según su última evaluación"
              to="/evaluar"
            />
            <Stat
              value={sensorsTotal ? `${sensorsOk}/${sensorsTotal}` : "0"}
              label="Sensores operativos"
              icon={<Radio className="h-[18px] w-[18px]" aria-hidden="true" />}
              tone={sensorsOk < sensorsTotal ? "warn" : "ok"}
              sub="Dispositivos activos con datos"
              to="/sensores"
            />
            <Stat
              value={fmtNum(alerts.length)}
              label="Alertas por revisar"
              icon={<Bell className="h-[18px] w-[18px]" aria-hidden="true" />}
              tone={criticas ? "bad" : alerts.length ? "warn" : "ok"}
              sub={criticas ? `${criticas} de prioridad crítica` : "Señales del campo"}
              to="/alertas"
            />
          </div>

          <section aria-labelledby="daily-brief-title" className="summary-brief mt-4 flex flex-wrap items-center gap-4 rounded-lg border border-primary-200 bg-primary-50 p-4 sm:p-5">
            <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-700 text-white">
              {piden > 0 ? <Droplet className="h-6 w-6" /> : <Check className="h-6 w-6" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-2xs font-semibold uppercase tracking-wider text-primary-700">Tu siguiente decisión</p>
              <h2 id="daily-brief-title" className="mt-1 text-xl font-semibold tracking-tight text-neutral-800">
                {piden > 0 ? `${piden} ${piden === 1 ? "parcela necesita" : "parcelas necesitan"} agua.` : "Sin riego urgente por ahora."}
              </h2>
              <p className="mt-1 text-sm text-neutral-600">Revisa los datos de cada parcela antes de planificar la aplicación de agua.</p>
            </div>
            <div className="flex items-center gap-2.5 rounded-md bg-white px-3 py-2.5 text-sm">
              <Clock className="h-5 w-5 text-primary-700" aria-hidden="true" />
              <div>
                <span className="block text-xs text-neutral-500">Ventana recomendada</span>
                <strong className="font-semibold tabular-nums text-neutral-800">05:30 — 07:00</strong>
              </div>
            </div>
          </section>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle>Últimas evaluaciones</CardTitle>
                  <CardDescription>Decisiones registradas por parcela.</CardDescription>
                </div>
                <Link
                  to="/evaluar"
                  className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15"
                >
                  Ver evaluaciones <ArrowRight className="h-[15px] w-[15px]" aria-hidden="true" />
                </Link>
              </CardHeader>
              <CardContent>
                {recent.length === 0 ? (
                  <Empty
                    icon={<Gauge className="h-5 w-5" aria-hidden="true" />}
                    title="Tu primera decisión empieza aquí"
                    hint="Evalúa una parcela para consultar sus recomendaciones."
                    action={
                      <Button variant="outline" asChild>
                        <Link to="/evaluar">Evaluar una parcela</Link>
                      </Button>
                    }
                  />
                ) : (
                  <DataTable
                    label="Últimas evaluaciones"
                    rows={recent}
                    rowKey={(e) => e.id}
                    columns={[
                      {
                        key: "plot",
                        label: "Parcela",
                        render: (e) => <span className="font-medium">{e.plot?.name ?? `Parcela #${e.plot_id}`}</span>,
                      },
                      {
                        key: "date",
                        label: "Evaluada",
                        render: (e) => <span className="text-neutral-500">{fmtDateTime(e.evaluated_at)}</span>,
                      },
                      {
                        key: "result",
                        label: "Decisión",
                        render: (e) => (
                          <Badge variant={badgeVariantForTone(badgeToneForResult(e.result, e.is_critical))}>
                            {e.is_critical ? "Crítica" : resultLabel(e.result)}
                          </Badge>
                        ),
                      },
                    ]}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle>Requieren atención</CardTitle>
                  <CardDescription>
                    {alerts.length ? `${alerts.length} señales para revisar${criticas ? " · críticas primero" : ""}` : "Seguimiento del campo"}
                  </CardDescription>
                </div>
                <Link
                  to="/alertas"
                  aria-label="Ver todas las alertas"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15"
                >
                  <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
                </Link>
              </CardHeader>
              <CardContent className="grid gap-3">
                {alerts.length === 0 ? (
                  <Empty
                    icon={<Check className="h-5 w-5" aria-hidden="true" />}
                    title="Todo al día"
                    hint="No hay alertas pendientes en tus parcelas."
                  />
                ) : (
                  <ul className="grid gap-2">
                    {prioritarias.map((alert, i) => {
                      const critical = alert.tipo.includes("critica");
                      return (
                        <li
                          key={`${alert.tipo}-${alert.plot_id}-${i}`}
                          className={
                            critical
                              ? "flex gap-3 rounded-md border border-l-4 border-danger-100 bg-danger-50 p-3"
                              : "flex gap-3 rounded-md border border-l-4 border-neutral-200 bg-white p-3"
                          }
                          style={{ borderLeftColor: critical ? colors.danger[500] : colors.warning[500] }}
                        >
                          <span aria-hidden="true" className={critical ? "text-danger-600" : "text-warning-600"}>
                            {alert.tipo.startsWith("sensor") ? (
                              <Radio className="h-[17px] w-[17px]" />
                            ) : (
                              <TriangleAlert className="h-[17px] w-[17px]" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm text-neutral-800">{alert.mensaje}</p>
                            <span className="mt-0.5 block text-xs text-neutral-500">
                              {alert.plot_id ? `Parcela #${alert.plot_id}` : "Aviso general"}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {alerts.length > 0 ? (
                  <Button variant="outline" asChild className="w-full">
                    <Link to="/alertas">
                      Revisar alertas <ArrowRight className="h-[15px] w-[15px]" aria-hidden="true" />
                    </Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-[15px] w-[15px]" aria-hidden="true" />
              Chupaca, Junín
            </span>
            <span>{today}</span>
            <span>Actualizado {ageLabel(updatedAt)}</span>
          </div>
        </>
      )}
    </div>
  );
}