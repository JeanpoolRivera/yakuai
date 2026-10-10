/* Hoy (agricultor): qué parcelas piden agua y últimas recomendaciones. */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { friendlyError } from "../api/client";
import { listEvaluations, listPlots, listSensors } from "../api/endpoints";
import type { Evaluation } from "../api/types";
import { Badge, Banner, Empty, Icon, Loading, SearchInput, SoilMeter, Tabs } from "../components/ui";
import { ageLabel, badgeToneForResult, fmtDateTime, fmtNum, resultLabel } from "../lib/format";

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
  const [sensorsOk, setSensorsOk] = useState(0);
  const [sensorsTotal, setSensorsTotal] = useState(0);
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
      const [plots, evals, sens] = await Promise.all([listPlots(), listEvaluations(), listSensors()]);
      setPlotCount(plots.length);
      setSensorsTotal(sens.length);
      setSensorsOk(sens.filter((s) => s.status === "ok" && s.is_active).length);
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
  const counts: Record<Filter, number> = {
    todas: latest.length,
    riega: latest.filter((e) => e.result === "riega").length,
    no: latest.filter((e) => e.result === "no").length,
    espera: latest.filter((e) => e.result === "espera").length,
    incompleta: latest.filter((e) => e.result === "incompleta").length,
  };

  return (
    <div className="page hoy">
      <header className="hoy-hero" data-state={urgentes > 0 ? "alert" : "calm"}>
        <div className="hoy-hero-main">
          <p className="eyebrow">Tu jornada</p>
          <h1>{urgentes > 0 ? `${urgentes} ${urgentes === 1 ? "parcela pide agua" : "parcelas piden agua"} hoy` : "Nada urgente por ahora"}</h1>
          <p>{urgentes > 0 ? "Riega en la ventana 05:30–07:00 para perder menos agua." : "Consulta las últimas evaluaciones y revisa de nuevo cuando el sistema lo indique."}</p>
          <div className="row">
            <Link className="btn btn-primary btn-lg" to="/evaluar">
              Evaluar riego <Icon name="arrow" size={17} />
            </Link>
            <button
              type="button"
              className="btn btn-sm hoy-ghost"
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
          </div>
        </div>
        <div className="hoy-hero-side">
          <span className="hoy-hero-icon" aria-hidden="true"><Icon name="clock" size={26} /></span>
          <div>
            <span>Ventana de riego</span>
            <strong>05:30 – 07:00</strong>
          </div>
        </div>
      </header>

      <div className="hoy-stats" aria-label="Resumen de tu campo">
        <div className="hoy-stat">
          <span className="hoy-stat-icon" aria-hidden="true"><Icon name="map" size={20} /></span>
          <div><strong>{fmtNum(plotCount)}</strong><span>{plotCount === 1 ? "Parcela registrada" : "Parcelas registradas"}</span></div>
        </div>
        <div className="hoy-stat">
          <span className="hoy-stat-icon" aria-hidden="true"><Icon name="drop" size={20} /></span>
          <div><strong>{fmtNum(urgentes)}</strong><span>{urgentes === 1 ? "Pide agua hoy" : "Piden agua hoy"}</span></div>
        </div>
        <div className="hoy-stat">
          <span className="hoy-stat-icon" aria-hidden="true"><Icon name="sensor" size={20} /></span>
          <div><strong>{fmtNum(sensorsOk)} de {fmtNum(sensorsTotal)}</strong><span>Sensores operativos</span></div>
        </div>
      </div>

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
        <section className="hoy-list" aria-label="Últimas recomendaciones">
          <div className="hoy-toolbar">
            <Tabs<Filter>
              label="Filtrar por estado"
              value={filter}
              onChange={(v) => setFilter(v)}
              options={[
                { value: "todas", label: `Todas (${counts.todas})` },
                { value: "riega", label: `Piden riego (${counts.riega})` },
                { value: "no", label: `No riegan (${counts.no})` },
                { value: "espera", label: `Esperan (${counts.espera})` },
                { value: "incompleta", label: `Incompletas (${counts.incompleta})` },
              ]}
            />
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar parcela…"
              label="Buscar parcela"
            />
            <select
              className="select"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Ordenar"
            >
              <option value="reciente">Más reciente</option>
              <option value="antiguo">Más antiguo</option>
            </select>
            <span className="tiny" aria-live="polite">{filtered.length} de {latest.length}</span>
          </div>

          {filtered.length === 0 ? (
            <Empty
              icon="search"
              title="Sin resultados"
              hint="Prueba con otra búsqueda o filtro."
            />
          ) : (
            <div className="hoy-cards">
              {filtered.map((e) => {
                const snap = e.inputs_snapshot ?? {};
                const hum = typeof snap.humedad_pct === "number" ? snap.humedad_pct : null;
                const umb = typeof snap.umbral === "number" ? snap.umbral * 100 : null;
                const pmp = typeof snap.pmp === "number" ? snap.pmp * 100 : null;
                return (
                  <article className="hoy-card" data-tone={badgeToneForResult(e.result, e.is_critical)} key={e.id}>
                    <div className="hoy-card-head">
                      <div>
                        <strong>{e.plot?.name ?? `Parcela #${e.plot_id}`}</strong>
                        <span className="tiny hoy-card-time"><Icon name="clock" size={14} /> {fmtDateTime(e.evaluated_at)} · {ageLabel(e.evaluated_at)}</span>
                      </div>
                      <Badge tone={badgeToneForResult(e.result, e.is_critical)}>
                        {e.is_critical ? "Crítica" : resultLabel(e.result)}
                      </Badge>
                    </div>
                    {e.result === "riega" && e.min_liters && e.max_liters ? (
                      <p className="hoy-amount num">
                        {fmtNum(e.min_liters)}–{fmtNum(e.max_liters)} <span>L</span>
                      </p>
                    ) : null}
                    <SoilMeter actual={hum} umbral={umb} critico={pmp} />
                    <Link className="btn btn-outline btn-sm btn-block" to="/evaluar" state={{ plotId: e.plot_id }}>
                      Ver qué hacer <Icon name="arrow" size={15} />
                    </Link>
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
