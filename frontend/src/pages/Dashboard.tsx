import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, Check, ChevronLeft, ChevronRight, ClipboardCheck, Droplets, Map, Radio, RefreshCw, Search, TriangleAlert } from "lucide-react";
import { listEvaluations, listFarmers, listIrrigations, listPlots, listSensors } from "../api/endpoints";
import { friendlyError } from "../api/client";
import { fmtNum } from "../lib/format";
import { evaluationDays, RESULT_SERIES, summarize } from "../components/dashboard/overview";
import type { DashboardData, EvaluationDay } from "../components/dashboard/overview";
import "../styles/summary.css";

const EMPTY: DashboardData = {plots:null,farmers:null,sensors:null,evaluations:null,irrigations:null};
const SOURCE_NAMES: Record<keyof DashboardData,string> = {plots:"parcelas",farmers:"agricultores",sensors:"sensores",evaluations:"evaluaciones",irrigations:"riegos"};
const LOADERS = [listPlots,listFarmers,listSensors,listEvaluations,listIrrigations] as const;
const KEYS = ["plots","farmers","sensors","evaluations","irrigations"] as const;
const PAGE_SIZE = 5;
function dateLabel(value: string, withTime = true): string {
  return new Intl.DateTimeFormat("es-PE", {timeZone:"America/Lima",day:"2-digit",month:"short",...(withTime ? {hour:"2-digit",minute:"2-digit"} as const : {})}).format(new Date(value));
}
function Metric({title,value,note,icon,to,accent=false}: {title:string;value:ReactNode;note:string;icon:ReactNode;to:string;accent?:boolean}) {
  return <Link to={to} className={`tech-kpi ${accent ? "tech-kpi-lead" : ""}`}><div className="tech-kpi-label">{title}{icon}</div><strong>{value}</strong><div className="tech-kpi-note"><span>{note}</span><ArrowRight size={15} aria-hidden="true"/></div></Link>;
}
function EmptyPanel({children}: {children:ReactNode}) { return <div className="tech-empty">{children}</div>; }

function EvaluationChart({days}: {days:EvaluationDay[]}) {
  const [selected,setSelected] = useState<string | null>(null);
  const day = days.find(d => d.date === selected) ?? days.at(-1)!;
  const max = Math.max(1,...days.map(d => d.total));
  const ceiling = Math.max(4,Math.ceil(max / 4) * 4);
  const total = days.reduce((sum,d) => sum+d.total,0);
  return <>
    <div className="tech-trend-content"><div className="tech-trend-total"><strong>{fmtNum(total)}</strong><span>evaluaciones realizadas</span><p>Incluye todas las evaluaciones, aunque una parcela se haya evaluado varias veces.</p></div>
      <div className="tech-chart" aria-label="Evaluaciones por día"><div className="tech-chart-scale" aria-hidden="true"><span>{ceiling}</span><span>{ceiling/2}</span><span>0</span></div><div className="tech-chart-bars">{days.map(d => <button key={d.date} className="tech-chart-day" aria-pressed={day.date === d.date} aria-label={`${dateLabel(d.date+"T12:00:00-05:00",false)}: ${d.total} evaluaciones`} onClick={() => setSelected(d.date)}><span className="tech-chart-column">{d.total > 0 ? <span className="tech-chart-stack" style={{height:`${d.total/ceiling*100}%`}}>{RESULT_SERIES.map(s => d[s.key] > 0 && <i key={s.key} className={`tech-series-${s.key}`} style={{flex:d[s.key]}}/>)}</span> : <span className="tech-chart-zero"/>}</span><span className="tech-chart-date">{dateLabel(d.date+"T12:00:00-05:00",false)}</span></button>)}</div></div>
    </div><div className="tech-chart-detail" aria-live="polite"><strong>{dateLabel(day.date+"T12:00:00-05:00",false)}</strong>{RESULT_SERIES.map(s => <span key={s.key}><i className={`tech-series-${s.key}`}/>{s.label}<b>{day[s.key]}</b></span>)}</div>
  </>;
}

export function Dashboard(): React.JSX.Element {
  const [data,setData] = useState<DashboardData>(EMPTY);
  const [loading,setLoading] = useState(true);
  const [failed,setFailed] = useState<string[]>([]);
  const [updated,setUpdated] = useState<Date | null>(null);
  const [filter,setFilter] = useState<"all"|"field"|"data">("all");
  const [query,setQuery] = useState("");
  const [page,setPage] = useState(1);
  const [period,setPeriod] = useState(7);
  const request = useRef(0);
  const prioritiesRef = useRef<HTMLElement>(null);

  async function load(): Promise<void> {
    const id=++request.current;
    setLoading(true);
    const results=await Promise.allSettled(LOADERS.map(loader => loader()));
    if(id!==request.current)return;
    const errors:string[]=[];
    const patch:Partial<DashboardData>={};
    results.forEach((result,i) => {
      if(result.status === "fulfilled") Object.assign(patch,{[KEYS[i]]:result.value});
      else errors.push(`${SOURCE_NAMES[KEYS[i]]}: ${friendlyError(result.reason,"No disponible")}`);
    });
    setData(previous => ({...previous,...patch}));
    setFailed(errors);setUpdated(new Date());setLoading(false);
  }
  useEffect(() => { void load();return () => {request.current++;}; },[]);
  const now=useMemo(() => updated ?? new Date(),[updated]);
  const overview=useMemo(() => summarize(data,now),[data,now]);
  const chart=useMemo(() => evaluationDays(data.evaluations ?? [],period,now),[data.evaluations,period,now]);
  const prioritiesReady=data.plots!==null && data.evaluations!==null && data.sensors!==null && data.irrigations!==null;
  const matching=overview.priorities.filter(p => (filter==="all" || p.category===filter) && `${p.plot.name} ${p.plot.farmer?.name ?? ""} ${p.title}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const totalPages=Math.max(1,Math.ceil(matching.length/PAGE_SIZE));
  const currentPage=Math.min(page,totalPages);
  const rows=matching.slice((currentPage-1)*PAGE_SIZE,currentPage*PAGE_SIZE);
  const sensorsTotal=overview.sensors.length;
  const healthy=overview.sensorCounts.ok;
  const health=sensorsTotal ? Math.round(healthy/sensorsTotal*100) : null;
  const noData=Object.values(data).every(value => value===null);
  const today=dateLabel(now.toISOString(),false);
  function setCategory(value:typeof filter):void {setFilter(value);setPage(1);}

  return <div className="tech-dashboard">
    <header className="tech-page-heading"><div><span className="tech-eyebrow">PANEL TÉCNICO</span><h1>Resumen</h1><p>Supervisión de parcelas, datos y actividad de riego.</p></div><div className="tech-header-actions"><div className="tech-date"><span>Hoy, {today}</span><small>Hora de Lima</small></div><button className="tech-button tech-button-secondary" onClick={() => void load()} disabled={loading} aria-label="Actualizar resumen"><RefreshCw size={16} aria-hidden="true" className={loading ? "tech-spin" : ""}/>{loading ? "Actualizando…" : "Actualizar"}</button></div></header>
    {failed.length>0 && <div className="tech-load-error" role="alert"><TriangleAlert size={18} aria-hidden="true"/><div><strong>No se pudo actualizar toda la información.</strong><p>Los datos disponibles siguen visibles; los indicadores pueden estar incompletos o corresponder a la carga anterior.</p><details><summary>Ver fuentes afectadas</summary><ul>{failed.map(error => <li key={error}>{error}</li>)}</ul></details></div><button className="tech-button tech-button-secondary" disabled={loading} onClick={() => void load()}>Reintentar</button></div>}
    {noData && loading ? <div className="tech-loading" role="status"><RefreshCw className="tech-spin" size={22}/>Cargando la supervisión del campo…</div> : <>
      <section className="tech-kpis" aria-label="Indicadores de supervisión">
        <Metric title="Parcelas activas" value={data.plots===null ? "—" : overview.active.length} note={overview.farmerCount===null ? "Agricultores: sin información" : `${overview.farmerCount} agricultores activos en el sistema`} icon={<Map size={18}/>} to="/parcelas" accent/>
        <Metric title="Parcelas evaluadas hoy" value={data.evaluations===null || data.plots===null ? "—" : <>{overview.evaluatedToday}<small> / {overview.active.length}</small></>} note="Cada parcela se cuenta una sola vez" icon={<ClipboardCheck size={18}/>} to="/evaluar"/>
        <button className="tech-kpi" onClick={() => {setCategory('all');setQuery('');prioritiesRef.current?.focus();}}><div className="tech-kpi-label">Parcelas por revisar<TriangleAlert size={18}/></div><strong>{prioritiesReady ? overview.affected : "—"}</strong><div className="tech-kpi-note"><span>Incidencias y evaluaciones pendientes</span><ArrowDown size={15}/></div></button>
        <Metric title="Agua registrada hoy" value={data.irrigations===null ? "—" : <>{fmtNum(overview.litersToday)}<small> L</small></>} note={data.irrigations===null ? "Sin información de riegos" : `${overview.irrigationCount} riegos activos · Registro manual`} icon={<Droplets size={18}/>} to="/riegos"/>
      </section>

      {data.plots!==null && overview.active.length===0 && <div className="tech-onboarding"><Map size={22}/><div><h2>{data.plots.length ? "No hay parcelas activas" : "Empieza por registrar las parcelas"}</h2><p>El seguimiento técnico aparecerá cuando existan parcelas activas y datos de campo.</p></div><Link className="tech-button" to="/parcelas">Gestionar parcelas<ArrowRight size={15}/></Link></div>}

      <div className="tech-monitor-grid">
        <section className="tech-panel tech-priorities" tabIndex={-1} ref={prioritiesRef} aria-labelledby="tech-priority-title">
          <header className="tech-panel-heading"><div><h2 id="tech-priority-title">Prioridades de supervisión</h2><p>Situaciones que requieren una revisión técnica.</p></div><span className="tech-count">{prioritiesReady ? overview.priorities.length : "—"}</span></header>
          <div className="tech-toolbar"><div className="tech-tabs" aria-label="Filtrar prioridades">{([{value:"all",label:"Todas"},{value:"field",label:"Riego"},{value:"data",label:"Datos"}] as const).map(tab => <button key={tab.value} aria-pressed={filter===tab.value} onClick={() => setCategory(tab.value)}>{tab.label}</button>)}</div><label className="tech-search"><Search size={15}/><input aria-label="Buscar parcela o agricultor" type="search" placeholder="Parcela o agricultor" value={query} onChange={e => {setQuery(e.target.value);setPage(1);}}/></label></div>
          {!prioritiesReady ? <EmptyPanel><TriangleAlert size={24}/><h3>Información incompleta</h3><p>Se necesitan parcelas, sensores, evaluaciones y riegos para ordenar las prioridades.</p></EmptyPanel> : !matching.length ? <EmptyPanel><Check size={26}/><h3>{query || filter!=="all" ? "No hay coincidencias" : "Sin prioridades identificadas"}</h3><p>{query || filter!=="all" ? "Prueba otra búsqueda o consulta todas las categorías." : "No se encontraron incidencias con los datos cargados."}</p>{(query || filter!=="all") && <button className="tech-text-button" onClick={() => {setCategory('all');setQuery('');}}>Limpiar filtros</button>}</EmptyPanel> : <>
            <div className="tech-priority-list" role="list">{rows.map(priority => <article className="tech-priority-row" role="listitem" key={priority.key}><span className={`tech-priority-icon tech-tone-${priority.severity}`} aria-hidden="true">{priority.severity==='critical' ? <TriangleAlert size={17}/> : priority.to==='/sensores' ? <Radio size={17}/> : priority.category==='field' ? <Droplets size={17}/> : <ClipboardCheck size={17}/>}</span><div className="tech-priority-content"><h3>{priority.title}</h3><p><strong>{priority.plot.name}</strong><span>·</span>{priority.plot.farmer?.name ?? 'Agricultor sin información'}</p><small>{priority.at ? dateLabel(priority.at) : priority.detail}</small></div><Link className="tech-row-action" to={priority.to} state={priority.to==='/evaluar' ? {plotId:priority.plot.id} : undefined} aria-label={`${priority.action}: ${priority.plot.name}`}>{priority.action}<ChevronRight size={15}/></Link></article>)}</div>
            <footer className="tech-pagination"><span>{(currentPage-1)*PAGE_SIZE+1}–{Math.min(currentPage*PAGE_SIZE,matching.length)} de {matching.length}</span><div><button aria-label="Prioridades anteriores" disabled={currentPage===1} onClick={() => setPage(currentPage-1)}><ChevronLeft size={16}/></button><span>{currentPage} / {totalPages}</span><button aria-label="Prioridades siguientes" disabled={currentPage===totalPages} onClick={() => setPage(currentPage+1)}><ChevronRight size={16}/></button></div></footer>
          </>}
          <p className="tech-priority-note">Basado en la última evaluación de cada parcela activa y en el estado registrado de sus sensores.</p>
        </section>

        <aside className="tech-panel tech-sensor-health" aria-labelledby="tech-sensor-title"><header className="tech-panel-heading"><div><h2 id="tech-sensor-title">Red de sensores</h2><p>Dispositivos activos del sistema</p></div><Radio size={19} aria-hidden="true"/></header>{data.sensors===null ? <EmptyPanel><p>No se pudo consultar el estado de los sensores.</p></EmptyPanel> : <>
          <div className="tech-health-score"><strong>{health===null ? "—" : health}<span>{health===null ? "" : "%"}</span></strong><span>{sensorsTotal ? 'con estado operativo' : 'Sin dispositivos activos'}</span></div>
          <div className="tech-health-bar" aria-hidden="true">{sensorsTotal>0 && (['ok','anomalo','sin_datos'] as const).map(key => <i key={key} className={`tech-health-${key}`} style={{flex:overview.sensorCounts[key]}}/>)}</div>
          <dl className="tech-health-list"><div><dt><i className="tech-health-ok"/>Operativos</dt><dd>{overview.sensorCounts.ok}</dd></div><div><dt><i className="tech-health-anomalo"/>Anómalos</dt><dd>{overview.sensorCounts.anomalo}</dd></div><div><dt><i className="tech-health-sin_datos"/>Sin datos</dt><dd>{overview.sensorCounts.sin_datos}</dd></div></dl>
          <div className="tech-health-footer"><p>{sensorsTotal ? `${healthy} de ${sensorsTotal} dispositivos activos reportan estado operativo.` : "Registra dispositivos para monitorear las condiciones del campo."}</p><Link to="/sensores">Gestionar sensores<ArrowRight size={15}/></Link></div><p className="tech-health-note">El estado operativo no garantiza una lectura vigente para evaluar el riego.</p>
        </>}</aside>
      </div>

      <section className="tech-panel tech-trend" aria-labelledby="tech-trend-title"><header className="tech-panel-heading"><div><h2 id="tech-trend-title">Actividad de evaluación</h2><p>Resultados del motor de riego en el período.</p></div><label className="tech-period"><span className="sr-only">Período del gráfico</span><select aria-label="Período del gráfico" value={period} onChange={e => setPeriod(Number(e.target.value))}><option value={7}>Últimos 7 días</option><option value={14}>Últimos 14 días</option></select></label></header>{data.evaluations===null ? <EmptyPanel><p>No se pudo cargar el historial de evaluaciones.</p></EmptyPanel> : <EvaluationChart days={chart}/>}</section>
      <footer className="tech-dashboard-footer"><span>{updated ? `Consulta: ${dateLabel(updated.toISOString())} · America/Lima` : 'Sin datos disponibles'}</span><span>Los riegos corregidos o anulados no se suman al volumen registrado.</span></footer>
    </>}
  </div>;
}
