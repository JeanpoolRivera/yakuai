/* Alertas calculadas: sensores callados/anómalos, incompletas y humedad crítica. */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bell, Check, Droplet, Info, Radio, TriangleAlert } from "lucide-react";
import { friendlyError } from "../api/client";
import { listAlerts } from "../api/endpoints";
import type { AlertItem, Plot } from "../api/types";
import { PageHead } from "../components/shadcn/page-head";
import { Stat } from "../components/shadcn/Stat";
import { Badge } from "../components/shadcn/badge";
import { Banner, Empty, Loading } from "../components/shadcn/feedback";
import { Button } from "../components/shadcn/button";
import { FilterTabs } from "../components/shadcn/filter-tabs";
import { PaginationControls } from "../components/shadcn/PaginationControls";
import { SearchInput } from "../components/shadcn/search-input";
import { useCollection } from "../hooks/useCollection";
import { colors } from "../lib/theme";

type Tab = "todas" | "criticas" | "sensores";
type AlertWithPlot = AlertItem & { plot?: Plot };

function toneOf(a: AlertItem): "critica" | "sensor" | "incompleta" {
  if (a.tipo.includes("critica")) return "critica";
  if (a.tipo.startsWith("sensor")) return "sensor";
  return "incompleta";
}

function plotLabel(a: AlertWithPlot): string | null {
  if (a.plot?.name) return a.plot.name;
  if (a.plot_id) return `Parcela #${a.plot_id}`;
  return null;
}

/* Explicación en lenguaje claro por tipo de alerta (el mensaje del backend es el detalle). */
const ALERT_HELP: Record<string, { hint: string }> = {
  sensor_sin_datos: { hint: "El sensor no envía lecturas. Revisa su conexión o registra una lectura manual." },
  sensor_anomalo: { hint: "El sensor reporta un valor imposible y está en revisión. Verifica el dispositivo." },
  evaluacion_incompleta: { hint: "La última evaluación quedó incompleta por falta de datos. Complétalos y vuelve a evaluar." },
  humedad_critica: { hint: "La humedad está en nivel crítico. Evalúa la parcela y riega hoy mismo." },
};

export function Alerts(): React.JSX.Element {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("todas");

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      setAlerts(await listAlerts());
    } catch (err) {
      setError(friendlyError(err, "No se pudieron cargar las alertas."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const criticas = alerts.filter((a) => a.tipo.includes("critica"));
  const sensores = alerts.filter((a) => a.tipo.startsWith("sensor"));

  const coll = useCollection(alerts, {
    perPage: 10,
    search: (a, q) => {
      const withPlot = a as AlertWithPlot;
      return `${a.mensaje} ${a.plot_id ?? ""} ${withPlot.plot?.name ?? ""}`.toLowerCase().includes(q);
    },
    filter: tab === "todas" ? undefined : tab === "criticas" ? (a) => a.tipo.includes("critica") : (a) => a.tipo.startsWith("sensor"),
  });
  const shown = coll.items;

  return (
    <div>
      <PageHead
        eyebrow="Vigilancia"
        title="Alertas"
        desc="Supervisa las condiciones que necesitan atención en tus parcelas y sensores."
        crumbs="YakuAI / Alertas"
      />

      {loading ? (
        <Loading text="Cargando alertas…" />
      ) : error ? (
        <Banner kind="bad">
          {error}{" "}
          <Button variant="link" size="sm" onClick={() => void load()}>
            Reintentar
          </Button>
        </Banner>
      ) : (
        <section aria-label="Lista de alertas" className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              value={String(alerts.length)}
              label="Avisos detectados"
              icon={<Bell className="h-[18px] w-[18px]" aria-hidden="true" />}
              sub="Estado actual del campo"
            />
            <Stat
              value={String(criticas.length)}
              label="Humedad crítica"
              icon={<Droplet className="h-[18px] w-[18px]" aria-hidden="true" />}
              tone={criticas.length ? "bad" : "ok"}
              sub="Parcelas que requieren atención"
            />
            <Stat
              value={String(sensores.length)}
              label="Avisos de sensores"
              icon={<Radio className="h-[18px] w-[18px]" aria-hidden="true" />}
              tone={sensores.length ? "warn" : "ok"}
              sub="Disponibilidad y calidad de los datos"
            />
          </div>

          <div className="grid gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-neutral-800">Bandeja de alertas</h2>
              <p className="mt-1 text-sm text-neutral-600">Filtra por prioridad o encuentra una parcela.</p>
            </div>
            {criticas.length > 0 ? (
              <Banner kind="warn">
                {criticas.length} {criticas.length === 1 ? "alerta crítica" : "alertas críticas"}: revisa esas parcelas hoy.
              </Banner>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <FilterTabs<Tab>
                label="Filtrar alertas"
                value={tab}
                onChange={(v) => {
                  setTab(v);
                  coll.setPage(1);
                }}
                options={[
                  { value: "todas", label: `Todas (${alerts.length})` },
                  { value: "criticas", label: `Críticas (${criticas.length})` },
                  { value: "sensores", label: `Sensores (${sensores.length})` },
                ]}
              />
              <SearchInput
                value={coll.query}
                onChange={coll.setQuery}
                placeholder="Buscar por mensaje o parcela…"
                label="Buscar alertas"
                className="min-w-[200px] flex-1"
              />
            </div>
            <span className="text-xs text-neutral-500" aria-live="polite">
              {coll.total} {coll.total === 1 ? "alerta" : "alertas"}
            </span>
            {shown.length === 0 ? (
              <Empty
                icon={<Check className="h-5 w-5" aria-hidden="true" />}
                title={coll.query ? "Sin coincidencias" : tab === "todas" ? "Sin alertas pendientes" : "Nada en esta vista"}
                hint={coll.query ? "Prueba con otro mensaje o parcela." : tab === "todas" ? "No hay avisos activos sobre las parcelas o los sensores." : "Cambia de pestaña para ver otras alertas."}
              />
            ) : (
              <>
                <div className="alert-grid grid gap-4">
                  {shown.map((a, i) => {
                    const label = plotLabel(a as AlertWithPlot);
                    const critical = a.tipo.includes("critica");
                    const tone = toneOf(a);
                    return (
                      <article
                        key={`${a.tipo}-${a.plot_id}-${i}`}
                        className="alert-tile flex gap-3 rounded-lg border border-l-4 border-neutral-200 bg-white p-4 shadow-card"
                        style={{ borderLeftColor: critical ? colors.danger[500] : tone === "sensor" ? colors.warning[500] : colors.neutral[400] }}
                      >
                        <span
                          aria-hidden="true"
                          className={
                            critical
                              ? "text-danger-600"
                              : tone === "sensor"
                                ? "text-warning-600"
                                : "text-info-600"
                          }
                        >
                          {a.tipo.startsWith("sensor") ? (
                            <Radio className="h-5 w-5" />
                          ) : critical ? (
                            <TriangleAlert className="h-5 w-5" />
                          ) : (
                            <Info className="h-5 w-5" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-neutral-800">{a.mensaje}</p>
                          {ALERT_HELP[a.tipo] ? <p className="mt-1 text-xs text-neutral-500">{ALERT_HELP[a.tipo].hint}</p> : null}
                          {label ? <p className="mt-1 text-xs text-neutral-500">{label}</p> : null}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <Badge variant={critical ? "destructive" : tone === "sensor" ? "warning" : "secondary"}>
                            {a.tipo.replace(/_/g, " ")}
                          </Badge>
                          {a.plot_id !== null ? (
                            <Link
                              to="/evaluar"
                              state={{ plotId: a.plot_id }}
                              className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15"
                            >
                              Ir a parcela <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </Link>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
                {coll.total > 10 ? (
                  <PaginationControls
                    page={coll.page}
                    pages={coll.pages}
                    onPageChange={coll.setPage}
                    count={`${coll.total} en total`}
                  />
                ) : null}
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}