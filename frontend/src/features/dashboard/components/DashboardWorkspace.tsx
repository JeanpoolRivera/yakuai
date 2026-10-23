import { DASHBOARD_COPY as C } from "@/features/dashboard/copy";
import { useDashboard } from '../hooks/useDashboard';
import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, Check, ChevronLeft, ChevronRight, ClipboardCheck, Droplets, Map, Radio, RefreshCw, Search, TriangleAlert } from 'lucide-react';
import { fmtNum } from '@/lib/format';
import type { ReactNode } from "react";
import { evaluationDays, RESULT_SERIES } from '@/components/dashboard/overview';


export function DashboardWorkspace(): React.JSX.Element {
  const { data, loading, failed, updated, load, now, overview } = useDashboard();
  const [filter, setFilter] = useState<"all" | "field" | "data">("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [period, setPeriod] = useState(7);
  const prioritiesRef = useRef<HTMLElement>(null);

  const matching = useMemo(() => overview.priorities.filter((p) => (filter === "all" || p.category === filter) && `${p.plot.name} ${p.plot.farmer?.name ?? ""} ${p.title}`.toLowerCase().includes(query.trim().toLowerCase())), [overview.priorities, filter, query]);
  const totalPages = Math.max(1, Math.ceil(matching.length / 5));
  const currentPage = Math.min(page, totalPages);
  const rows = matching.slice((currentPage - 1) * 5, currentPage * 5);
  const sensorsTotal = overview.sensors.length;
  const healthy = overview.sensorCounts.ok;
  const health = sensorsTotal ? Math.round((healthy / sensorsTotal) * 100) : null;
  const noData = Object.values(data).every((v) => v === null);
  const today = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "2-digit", month: "short" }).format(now);

  const chartDays = useMemo(() => evaluationDays(data.evaluations ?? [], period, now), [data.evaluations, period, now]);

  function setCategory(value: typeof filter): void { setFilter(value); setPage(1); }

  const Metric = ({ title, value, note, icon, to, accent = false }: { title: string; value: ReactNode; note: string; icon: ReactNode; to: string; accent?: boolean }) => (
    <Link to={to} className={`tech-kpi ${accent ? "tech-kpi-lead" : ""}`}>
      <div className="tech-kpi-label">{title}{icon}</div>
      <strong>{value}</strong>
      <div className="tech-kpi-note"><span>{note}</span><ArrowRight size={15} aria-hidden="true" /></div>
    </Link>
  );

  return (
    <div className="tech-dashboard">
      <header className="tech-page-heading">
        <div><span className="tech-eyebrow">{C.eyebrow}</span><h1>{C.title}</h1><p>{C.desc}</p></div>
        <div className="tech-header-actions">
          <div className="tech-date"><span>Hoy, {today}</span><small>{C.limaTime}</small></div>
          <button className="tech-button tech-button-secondary" onClick={() => void load()} disabled={loading} aria-label={C.update}>
            <RefreshCw size={16} aria-hidden="true" className={loading ? "tech-spin" : ""} />{loading ? C.updating : C.update}
          </button>
        </div>
      </header>

      {failed.length > 0 && (
        <div className="tech-load-error" role="alert">
          <TriangleAlert size={18} aria-hidden="true" />
          <div><strong>{C.loadError}</strong><p>{C.loadErrorDetail}</p><details><summary>{C.loadErrorSources}</summary><ul>{failed.map((e) => <li key={e}>{e}</li>)}</ul></details></div>
          <button className="tech-button tech-button-secondary" disabled={loading} onClick={() => void load()}>{C.retry}</button>
        </div>
      )}

      {noData && loading ? (
        <div className="tech-loading" role="status"><RefreshCw className="tech-spin" size={22} />{C.loading}</div>
      ) : (
        <>
          <section className="tech-kpis" aria-label="Indicadores de supervisión">
            <Metric title={C.kpis.activeParcels} value={data.plots === null ? "—" : overview.active.length} note={overview.farmerCount === null ? C.kpis.farmersNoInfo : C.kpis.farmersActive(overview.farmerCount)} icon={<Map size={18} />} to="/parcelas" accent />
            <Metric title={C.kpis.evaluatedToday} value={data.evaluations === null || data.plots === null ? "—" : <>{overview.evaluatedToday}<small> / {overview.active.length}</small></>} note={C.kpis.evaluatedHint} icon={<ClipboardCheck size={18} />} to="/evaluar" />
            <button className="tech-kpi" onClick={() => { setCategory("all"); setQuery(""); prioritiesRef.current?.focus(); }}>
              <div className="tech-kpi-label">{C.kpis.toReview}<TriangleAlert size={18} /></div>
              <strong>{overview.priorities.length ? overview.affected : "—"}</strong>
              <div className="tech-kpi-note"><span>{C.kpis.toReviewHint}</span><ArrowDown size={15} /></div>
            </button>
            <Metric title={C.kpis.waterToday} value={data.irrigations === null ? "—" : <>{fmtNum(overview.litersToday)}<small> L</small></>} note={data.irrigations === null ? C.kpis.waterNoInfo : C.kpis.waterHint(overview.irrigationCount, overview.irrigationCount)} icon={<Droplets size={18} />} to="/riegos" />
          </section>

          {data.plots !== null && overview.active.length === 0 && (
            <div className="tech-onboarding"><Map size={22} /><div><h2>{data.plots.length ? C.noActiveParcels : C.noParcels}</h2><p>{C.noActiveDesc}</p></div><Link className="tech-button" to="/parcelas">{C.manageParcels}<ArrowRight size={15} /></Link></div>
          )}

          <div className="tech-monitor-grid">
            <section className="tech-panel tech-priorities" tabIndex={-1} ref={prioritiesRef} aria-labelledby="tech-priority-title">
              <header className="tech-panel-heading"><div><h2 id="tech-priority-title">{C.prioritiesTitle}</h2><p>{C.prioritiesDesc}</p></div><span className="tech-count">{overview.priorities.length}</span></header>
              <div className="tech-toolbar">
                <div className="tech-tabs" aria-label="Filtrar prioridades">{([{ value: "all", label: C.filterAll }, { value: "field", label: C.filterField }, { value: "data", label: C.filterData }] as const).map((tab) => <button key={tab.value} aria-pressed={filter === tab.value} onClick={() => setCategory(tab.value)}>{tab.label}</button>)}</div>
                <label className="tech-search"><Search size={15} /><input aria-label="Buscar parcela o agricultor" type="search" placeholder="Parcela o agricultor" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} /></label>
              </div>
              {!overview.priorities.length ? (
                <div className="tech-empty"><Check size={26} /><h3>{query || filter !== "all" ? C.noMatch : C.noPriorities}</h3><p>{query || filter !== "all" ? C.noMatchHint : C.noPrioritiesHint}</p>{(query || filter !== "all") && <button className="tech-text-button" onClick={() => { setCategory("all"); setQuery(""); }}>{C.prioritiesClear}</button>}</div>
              ) : (
                <>
                  <div className="tech-priority-list" role="list">{rows.map((priority) => (
                    <article className="tech-priority-row" role="listitem" key={priority.key}>
                      <span className={`tech-priority-icon tech-tone-${priority.severity}`} aria-hidden="true">{priority.severity === "critical" ? <TriangleAlert size={17} /> : priority.to === "/sensores" ? <Radio size={17} /> : priority.category === "field" ? <Droplets size={17} /> : <ClipboardCheck size={17} />}</span>
                      <div className="tech-priority-content"><h3>{priority.title}</h3><p><strong>{priority.plot.name}</strong><span>·</span>{priority.plot.farmer?.name ?? "Agricultor sin información"}</p><small>{priority.at ? new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(priority.at)) : priority.detail}</small></div>
                      <Link className="tech-row-action" to={priority.to} state={priority.to === "/evaluar" ? { plotId: priority.plot.id } : undefined} aria-label={`${priority.action}: ${priority.plot.name}`}>{priority.action}<ChevronRight size={15} /></Link>
                    </article>
                  ))}</div>
                  <footer className="tech-pagination"><span>{(currentPage - 1) * 5 + 1}–{Math.min(currentPage * 5, matching.length)} de {matching.length}</span><div><button aria-label="Prioridades anteriores" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16} /></button><span>{currentPage} / {totalPages}</span><button aria-label="Prioridades siguientes" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}><ChevronRight size={16} /></button></div></footer>
                </>
              )}
              <p className="tech-priority-note">{C.prioritiesNote}</p>
            </section>

            <aside className="tech-panel tech-sensor-health" aria-labelledby="tech-sensor-title">
              <header className="tech-panel-heading"><div><h2 id="tech-sensor-title">{C.sensorNetworkTitle}</h2><p>{C.sensorNetworkDesc}</p></div><Radio size={19} aria-hidden="true" /></header>
              {data.sensors === null ? (
                <div className="tech-empty"><p>{C.noDataSensors}</p></div>
              ) : (
                <>
                  <div className="tech-health-score"><strong>{health === null ? "—" : health}<span>{health === null ? "" : "%"}</span></strong><span>{sensorsTotal ? C.sensorOperative : C.noDevices}</span></div>
                  <div className="tech-health-bar" aria-hidden="true">{sensorsTotal > 0 && (["ok", "anomalo", "sin_datos"] as const).map((key) => <i key={key} className={`tech-health-${key}`} style={{ flex: overview.sensorCounts[key] }} />)}</div>
                  <dl className="tech-health-list"><div><dt><i className="tech-health-ok" />{C.sensorHealth.operative}</dt><dd>{overview.sensorCounts.ok}</dd></div><div><dt><i className="tech-health-anomalo" />{C.sensorHealth.anomalous}</dt><dd>{overview.sensorCounts.anomalo}</dd></div><div><dt><i className="tech-health-sin_datos" />{C.sensorHealth.noData}</dt><dd>{overview.sensorCounts.sin_datos}</dd></div></dl>
                  <div className="tech-health-footer"><p>{sensorsTotal ? C.sensorFooter(healthy, sensorsTotal) : C.sensorNoDevices}</p><Link to="/sensores">{C.manageSensors}<ArrowRight size={15} /></Link></div>
                  <p className="tech-health-note">{C.sensorHealthNote}</p>
                </>
              )}
            </aside>
          </div>

          <section className="tech-panel tech-trend" aria-labelledby="tech-trend-title">
            <header className="tech-panel-heading"><div><h2 id="tech-trend-title">{C.trendTitle}</h2><p>{C.trendDesc}</p></div><label className="tech-period"><span className="sr-only">Período del gráfico</span><select aria-label="Período del gráfico" value={period} onChange={(e) => setPeriod(Number(e.target.value))}><option value={7}>{C.period7}</option><option value={14}>{C.period14}</option></select></label></header>
            {data.evaluations === null ? <div className="tech-empty"><p>{C.noDataEvaluations}</p></div> : <EvaluationChart days={chartDays} />}
          </section>

          <footer className="tech-dashboard-footer"><span>{updated ? C.footerUpdated(new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(updated)) : C.footerNoData}</span><span>{C.footerNote}</span></footer>
        </>
      )}
    </div>
  );
}

function EvaluationChart({ days }: { days: any[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const day = days.find((d) => d.date === selected) ?? days.at(-1)!;
  const max = Math.max(1, ...days.map((d) => d.total));
  const ceiling = Math.max(4, Math.ceil(max / 4) * 4);
  const total = days.reduce((sum, d) => sum + d.total, 0);
  const dateLabel = (value: string, withTime = true) => new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "2-digit", month: "short", ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}) }).format(new Date(value));

  return (
    <>
      <div className="tech-trend-content">
        <div className="tech-trend-total"><strong>{fmtNum(total)}</strong><span>evaluaciones realizadas</span><p>Incluye todas las evaluaciones, aunque una parcela se haya evaluado varias veces.</p></div>
        <div className="tech-chart" aria-label="Evaluaciones por día">
          <div className="tech-chart-scale" aria-hidden="true"><span>{ceiling}</span><span>{ceiling / 2}</span><span>0</span></div>
          <div className="tech-chart-bars">{days.map((d) => (
            <button key={d.date} className="tech-chart-day" aria-pressed={day.date === d.date} aria-label={`${dateLabel(d.date + "T12:00:00-05:00", false)}: ${d.total} evaluaciones`} onClick={() => setSelected(d.date)}>
              <span className="tech-chart-column">{d.total > 0 ? <span className="tech-chart-stack" style={{ height: `${(d.total / ceiling) * 100}%` }}>{RESULT_SERIES.map((s) => d[s.key] > 0 && <i key={s.key} className={`tech-series-${s.key}`} style={{ flex: d[s.key] }} />)}</span> : <span className="tech-chart-zero" />}</span>
              <span className="tech-chart-date">{dateLabel(d.date + "T12:00:00-05:00", false)}</span>
            </button>
          ))}</div>
        </div>
      </div>
      <div className="tech-chart-detail" aria-live="polite"><strong>{dateLabel(day.date + "T12:00:00-05:00", false)}</strong>{RESULT_SERIES.map((s) => <span key={s.key}><i className={`tech-series-${s.key}`} />{s.label}<b>{day[s.key]}</b></span>)}</div>
    </>
  );
}
