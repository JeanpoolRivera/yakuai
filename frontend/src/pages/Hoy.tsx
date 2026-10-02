/* Hoy (agricultor): qué parcelas piden agua y últimas recomendaciones. */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { friendlyError } from "../api/client";
import { listEvaluations, listPlots } from "../api/endpoints";
import type { Evaluation } from "../api/types";
import { Badge, Banner, Empty, Icon, Loading, SoilMeter } from "../components/ui";
import { badgeToneForResult, fmtDateTime, fmtNum, resultLabel } from "../lib/format";

type Filter = "todas" | "riega" | "no" | "espera" | "incompleta";
type Sort = "reciente" | "antiguo";

function latestPerPlot(all: Evaluation[]): Evaluation[] {
  const seen = new Map<number, Evaluation>();
  const sorted = [...all].sort((a, b) => (a.evaluated_at < b.evaluated_at ? 1 : -1));
  for (const e of sorted) {
    if (!seen.has(e.plot_id)) seen.set(e.plot_id, e);
  }
  return [...seen.values()];
}

export function Hoy(): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plotCount, setPlotCount] = useState(0);
  const [latest, setLatest] = useState<Evaluation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("todas");
  const [sort, setSort] = useState<Sort>("reciente");

  async function load(isRefresh = false): Promise<void> {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [plots, evals] = await Promise.all([listPlots(), listEvaluations()]);
      setPlotCount(plots.length);
      setLatest(latestPerPlot(evals));
    } catch (err) {
      setError(friendlyError(err, "No se pudo cargar tu información."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    let out = [...latest];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter((e) => (e.plot?.name ?? "").toLowerCase().includes(q));
    }

    if (filter !== "todas") {
      out = out.filter((e) => e.result === filter);
    }

    out.sort((a, b) => {
      const diff = a.evaluated_at < b.evaluated_at ? 1 : -1;
      return sort === "reciente" ? diff : -diff;
    });

    return out;
  }, [latest, search, filter, sort]);

  if (loading) return <Loading text="Cargando tu campo…" />;
  if (error)
    return (
      <div className="stack">
        <Banner kind="bad">
          {error}{" "}
          <button className="link" onClick={() => void load()}>
            Reintentar
          </button>
        </Banner>
      </div>
    );

  if (plotCount === 0)
    return (
      <Empty
        icon="sprout"
        title="Aún no tienes parcelas"
        hint="Tu técnico registra tu parcela y tus sensores. Vuelve pronto."
      />
    );

  const urgentes = latest.filter((e) => e.result === "riega").length;

  return (
    <div className="page monitoring-page farmer-today">
      <header className="monitoring-section-head">
        <div>
          <p className="eyebrow">Tu jornada</p>
          <h1>Hoy en tu campo</h1>
          <p>Consulta las recomendaciones más recientes y decide tu próximo riego.</p>
        </div>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => void load(true)}
          disabled={refreshing}
        >
          {refreshing ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Actualizando…
            </>
          ) : (
            <>
              <Icon name="refresh" size={15} />
              Actualizar
            </>
          )}
        </button>
      </header>

      <section className="monitoring-workspace" aria-labelledby="hoy-title">
        <div className="monitoring-directory">
          <p className="eyebrow">Recomendación de hoy</p>
          <h2 id="hoy-title">{urgentes > 0 ? `${urgentes} ${urgentes === 1 ? "parcela pide agua" : "parcelas piden agua"} hoy` : "Nada urgente por ahora"}</h2>
          <p>{urgentes > 0 ? "Riega en la ventana 05:30–07:00 para perder menos agua." : "Consulta las últimas evaluaciones y revisa de nuevo cuando el sistema lo indique."}</p>
          <div className="ops-actions"><Link className="btn btn-primary" to="/evaluar">Evaluar riego <Icon name="arrow" size={16} /></Link></div>
        </div>
        <aside className="monitoring-aside"><Icon name="map" size={24} /><span>Tu campo</span><strong>{fmtNum(plotCount)}</strong><p>{plotCount === 1 ? "Parcela registrada" : "Parcelas registradas"}</p></aside>
      </section>

      {latest.length === 0 ? (
        <Empty
          icon="gauge"
          title="Sin evaluaciones todavía"
          hint="Pulsa «Evaluar riego», elige tu parcela y obtén la recomendación."
          action={
            <Link className="btn btn-secondary btn-sm" to="/evaluar">
              Ir a evaluar
            </Link>
          }
        />
      ) : (
        <section className="stack" aria-label="Últimas recomendaciones">
          <div className="ops-section-head">
            <div>
              <h2 className="section-title">Tus parcelas, de un vistazo</h2>
              <p className="muted small">Última recomendación disponible para cada parcela.</p>
            </div>
            <span className="tiny">{filtered.length} de {latest.length}</span>
          </div>

          <div className="ops-toolbar">
            <div className="searchbox">
              <span className="search-icon" aria-hidden="true">
                <Icon name="search" size={16} />
              </span>
              <input
                className="input"
                type="search"
                placeholder="Buscar parcela…"
                aria-label="Buscar parcela"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="select"
              value={filter}
              onChange={(e) => setFilter(e.target.value as Filter)}
              aria-label="Filtrar por estado"
            >
              <option value="todas">Todas</option>
              <option value="riega">Piden riego</option>
              <option value="no">No riegan</option>
              <option value="espera">Esperan</option>
              <option value="incompleta">Incompletas</option>
            </select>
            <select
              className="select"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Ordenar"
            >
              <option value="reciente">Más reciente</option>
              <option value="antiguo">Más antiguo</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <Empty
              icon="search"
              title="Sin resultados"
              hint="Prueba con otra búsqueda o filtro."
            />
          ) : (
            <div className="ops-recommendations">
              {filtered.map((e) => {
                const snap = e.inputs_snapshot ?? {};
                const hum = typeof snap.humedad_pct === "number" ? snap.humedad_pct : null;
                const umb = typeof snap.umbral === "number" ? snap.umbral * 100 : null;
                const pmp = typeof snap.pmp === "number" ? snap.pmp * 100 : null;
                return (
                  <article className="ops-recommendation" key={e.id}>
                    <div className="rowcard-body stack-sm">
                      <div className="spread">
                        <strong>{e.plot?.name ?? `Parcela #${e.plot_id}`}</strong>
                        <Badge tone={badgeToneForResult(e.result, e.is_critical)}>
                          {e.is_critical ? "Crítica" : resultLabel(e.result)}
                        </Badge>
                      </div>
                      {e.result === "riega" && e.min_liters && e.max_liters ? (
                        <p className="ops-water-amount">
                          {fmtNum(e.min_liters)}–{fmtNum(e.max_liters)} L
                        </p>
                      ) : null}
                      <SoilMeter actual={hum} umbral={umb} critico={pmp} />
                      <p className="tiny ops-card-time"><Icon name="clock" size={14} /> {fmtDateTime(e.evaluated_at)}</p>
                      <Link className="link small" to="/evaluar">
                        Ver detalle <Icon name="arrow" size={14} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
