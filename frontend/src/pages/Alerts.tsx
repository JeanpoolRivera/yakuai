/* Alertas calculadas: sensores callados/anómalos, incompletas y humedad crítica. */
import { useEffect, useState } from "react";
import { friendlyError } from "../api/client";
import { listAlerts } from "../api/endpoints";
import type { AlertItem, Plot } from "../api/types";
import { Badge, Banner, Empty, Icon, Loading, PageHead, Pager, SearchInput, Stat, Tabs } from "../components/ui";
import { useCollection } from "../hooks/useCollection";

type Tab = "todas" | "criticas" | "sensores";
type AlertWithPlot = AlertItem & { plot?: Plot };

function toneOf(a: AlertItem): string {
  if (a.tipo.includes("critica")) return "critica";
  if (a.tipo.startsWith("sensor")) return "vencido";
  return "incompleta";
}

function plotLabel(a: AlertWithPlot): string | null {
  if (a.plot?.name) return a.plot.name;
  if (a.plot_id) return `Parcela #${a.plot_id}`;
  return null;
}

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
    <div className="page ops-page">
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
          <button className="link" onClick={() => void load()}>
            Reintentar
          </button>
        </Banner>
      ) : (
        <section className="stack" aria-label="Lista de alertas">
          <div className="stats">
            <Stat value={String(alerts.length)} label="Avisos detectados" icon="bell" sub="Estado actual del campo" />
            <Stat value={String(criticas.length)} label="Humedad crítica" icon="drop" tone={criticas.length ? "bad" : "ok"} sub="Parcelas que requieren atención" />
            <Stat value={String(sensores.length)} label="Avisos de sensores" icon="sensor" tone={sensores.length ? "warn" : "ok"} sub="Disponibilidad y calidad de los datos" />
          </div>
          <div className="ops-register stack">
          <div className="ops-section-head"><div><h2 className="section-title">Bandeja de alertas</h2><p className="small muted">Filtra por prioridad o encuentra una parcela.</p></div></div>
          {criticas.length > 0 ? (
            <Banner kind="warn">
              {criticas.length} {criticas.length === 1 ? "alerta crítica" : "alertas críticas"}: revisa esas parcelas hoy.
            </Banner>
          ) : null}
          <div className="toolbar">
            <Tabs<Tab>
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
            />
          </div>
          <span className="tiny" aria-live="polite">
            {coll.total} {coll.total === 1 ? "alerta" : "alertas"}
          </span>
          {shown.length === 0 ? (
            <Empty
              icon="check"
              title={coll.query ? "Sin coincidencias" : tab === "todas" ? "Sin alertas pendientes" : "Nada en esta vista"}
              hint={coll.query ? "Prueba con otro mensaje o parcela." : tab === "todas" ? "No hay avisos activos sobre las parcelas o los sensores." : "Cambia de pestaña para ver otras alertas."}
            />
          ) : (
            <>
              <div className="ops-alert-list">
                {shown.map((a, i) => {
                  const label = plotLabel(a as AlertWithPlot);
                  return (
                    <article className={`ops-alert-item ${a.tipo.includes("critica") ? "ops-alert-critical" : ""}`} key={`${a.tipo}-${a.plot_id}-${i}`}>
                      <span className="ops-alert-icon"><Icon name={a.tipo.startsWith("sensor") ? "sensor" : a.tipo.includes("critica") ? "alert" : "info"} size={20} /></span>
                      <div className="rowcard-body">
                        <p className="ops-alert-message">{a.mensaje}</p>
                        {label ? <p className="tiny">{label}</p> : null}
                      </div>
                      <div className="rowcard-actions">
                        <Badge tone={toneOf(a)}>{a.tipo.replace(/_/g, " ")}</Badge>
                      </div>
                    </article>
                  );
                })}
              </div>
              {coll.total > 10 ? (
                <Pager page={coll.page} pages={coll.pages} onPage={coll.setPage} count={`${coll.total} en total`} />
              ) : null}
            </>
          )}
          </div>
        </section>
      )}
    </div>
  );
}
