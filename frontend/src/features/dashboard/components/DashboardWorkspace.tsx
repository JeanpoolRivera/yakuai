import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Activity, AlertTriangle, ArrowRight, Droplets, MapPinned, RefreshCw, Waves } from "lucide-react";
import { useDashboard } from "../hooks/useDashboard";
import { DASHBOARD_COPY as C } from "../copy";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { PageHeading, Metric, StatusBadge, ErrorBlock, EmptyBlock, LoadingBlock } from "@/components/workspace/WorkspaceKit";
import { fmtNum, fmtDateTime } from "@/lib/format";

const SERIES = [
  { key: "riega", label: "Regar", tone: "bg-warning-500" },
  { key: "no", label: "No regar", tone: "bg-success-600" },
  { key: "espera", label: "Esperar", tone: "bg-info-600" },
  { key: "incompleta", label: "Incompleta", tone: "bg-neutral-500" },
] as const;

export function DashboardWorkspace(): React.JSX.Element {
  const { data, loading, failed, updated, load, overview, chart } = useDashboard();
  const active = overview.active;
  const ready = data.plots !== null;
  const days = useMemo(() => chart, [chart]);

  return <div className="space-y-6">
    <PageHeading eyebrow="Supervisión de campo" title="Resumen" description="Estado de las parcelas, sensores y actividad de riego." action={<Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw size={16} aria-hidden="true" />{loading ? "Actualizando…" : "Actualizar"}</Button>} />
    {failed.length > 0 ? <div className="rounded-lg border border-warning-100 bg-warning-50 p-3 text-sm text-warning-800" role="status"><strong>Algunos datos no están disponibles.</strong><span className="ml-1">{failed.join(" · ")}</span></div> : null}
    {loading && !updated ? <LoadingBlock label="Cargando el estado del campo…" /> : !ready ? <ErrorBlock message="No se pudo obtener la supervisión del campo." retry={() => void load()} /> : <>
      <section aria-label="Indicadores del campo" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Parcelas activas" value={overview.active.length} detail={overview.farmerCount === null ? "Agricultores sin datos" : `${overview.farmerCount} agricultores activos`} icon={<MapPinned size={18} />} tone="brand" />
        <Metric label="Evaluadas hoy" value={overview.evaluatedToday} detail={`${active.length} parcelas activas`} icon={<Activity size={18} />} />
        <Metric label="Parcelas por revisar" value={overview.affected} detail={overview.priorities.length ? "Prioridades detectadas" : "Sin prioridades actuales"} icon={<AlertTriangle size={18} />} tone={overview.affected ? "warning" : "default"} />
        <Metric label="Agua aplicada hoy" value={`${fmtNum(overview.litersToday)} L`} detail={`${overview.irrigationCount} riegos vigentes`} icon={<Droplets size={18} />} />
      </section>

      <section aria-labelledby="priorities-title" className="space-y-3">
        <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Atención</p><h2 id="priorities-title" className="mt-1 text-lg font-semibold text-neutral-900">Prioridades de hoy</h2><p className="mt-1 text-sm text-neutral-600">Situaciones ordenadas por urgencia para decidir qué revisar primero.</p></div><span className="hidden text-xs text-neutral-500 sm:block">{overview.priorities.length} pendientes</span></div>
        {overview.priorities.length ? <div className="grid gap-3 lg:grid-cols-2">{overview.priorities.slice(0, 6).map((item) => <Card key={item.key} className="flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-start gap-3"><span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg ${item.severity === "critical" ? "bg-danger-50 text-danger-700" : item.severity === "warning" ? "bg-warning-50 text-warning-700" : "bg-neutral-100 text-neutral-600"}`} aria-hidden="true">{item.category === "field" ? <Droplets size={18} /> : <AlertTriangle size={18} />}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-neutral-900">{item.plot.name}</h3><StatusBadge value={item.severity === "critical" ? "critica" : item.severity === "warning" ? "espera" : "incompleta"} label={item.severity === "critical" ? "Prioridad alta" : item.severity === "warning" ? "Revisar" : "Pendiente"} /></div><p className="mt-1 text-sm font-medium text-neutral-800">{item.title}</p><p className="mt-1 text-sm leading-relaxed text-neutral-600">{item.detail}</p></div></div><Button asChild variant="outline" size="sm" className="w-full shrink-0 sm:w-auto"><Link to={item.to}>{item.action}<ArrowRight size={15} aria-hidden="true" /></Link></Button>
        </Card>)}</div> : <EmptyBlock title="Sin prioridades identificadas" description="Las parcelas activas no tienen incidencias pendientes con los datos disponibles." action={<Button asChild variant="outline"><Link to="/parcelas">Ver parcelas</Link></Button>} />}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,.8fr)]">
        <Card className="rounded-xl p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Tendencia</p><h2 className="mt-1 text-base font-semibold text-neutral-900">Evaluaciones · últimos 7 días</h2></div><div className="flex flex-wrap gap-x-3 gap-y-1">{SERIES.map((s) => <span key={s.key} className="inline-flex items-center gap-1.5 text-xs text-neutral-600"><span className={`h-2 w-2 rounded-full ${s.tone}`} aria-hidden="true" />{s.label}</span>)}</div></div>
          <div className="mt-5 grid grid-cols-7 gap-2" role="img" aria-label="Evaluaciones de los últimos siete días, agrupadas por resultado">{days.map((day) => { const max = Math.max(1, ...SERIES.map((s) => day[s.key])); return <div key={day.date} className="grid min-w-0 grid-rows-[9rem_auto] gap-2 text-center"><div className="flex h-full flex-col-reverse overflow-hidden rounded-md bg-neutral-50"><div className="flex flex-col-reverse">{SERIES.map((s) => day[s.key] ? <div key={s.key} className={s.tone} style={{ height: `${Math.max(4, day[s.key] / max * 72)}px` }} /> : null)}</div></div><span className="truncate text-[10px] text-neutral-600">{new Date(`${day.date}T12:00:00`).toLocaleDateString("es-PE", { weekday: "short" })}</span></div>; })}</div>
          <p className="mt-3 text-xs text-neutral-500">Cada barra representa la cantidad de evaluaciones por resultado.</p>
        </Card>
        <Card className="rounded-xl p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Dispositivos</p><h2 className="mt-1 text-base font-semibold text-neutral-900">Red de sensores</h2></div><Waves size={19} className="text-primary-700" aria-hidden="true" /></div>
          {overview.sensors.length ? <div className="mt-5 space-y-4"><div className="flex items-end justify-between"><strong className="text-3xl tabular-nums text-neutral-900">{overview.sensorCounts.ok}<span className="text-base font-medium text-neutral-500">/{overview.sensors.length}</span></strong><span className="text-xs text-neutral-600">operativos</span></div><div className="h-2 overflow-hidden rounded-full bg-neutral-100" role="img" aria-label={`${overview.sensorCounts.ok} de ${overview.sensors.length} sensores operativos`}><div className="h-full rounded-full bg-success-600" style={{ width: `${overview.sensorCounts.ok / overview.sensors.length * 100}%` }} /></div><div className="grid grid-cols-3 gap-2 text-xs"><span><strong className="text-success-700">{overview.sensorCounts.ok}</strong> operativos</span><span><strong className="text-warning-700">{overview.sensorCounts.anomalo}</strong> en revisión</span><span><strong className="text-neutral-700">{overview.sensorCounts.sin_datos}</strong> sin datos</span></div></div> : <div className="mt-5 rounded-lg bg-neutral-50 p-4 text-sm text-neutral-600">No hay sensores activos registrados.</div>}
          <Button asChild variant="outline" className="mt-5 w-full"><Link to="/sensores">Gestionar sensores<ArrowRight size={15} aria-hidden="true" /></Link></Button>
        </Card>
      </section>
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200 pt-4 text-xs text-neutral-500"><span>{updated ? `Datos consultados ${fmtDateTime(updated.toISOString())}` : C.footerNoData}</span><span>Las cifras de agua consideran riegos vigentes.</span></footer>
    </>}
  </div>;
}


