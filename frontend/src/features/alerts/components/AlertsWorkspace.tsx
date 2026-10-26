import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Bell, Droplets, Radio, Search } from "lucide-react";
import { useAlerts } from "../hooks/useAlerts";
import { alertSeverityRank, alertTypeLabel, toneOf, ALERT_HELP } from "../utils";
import { ALERTS_COPY as C } from "../copy";
import { PageHeading, Metric, StatusBadge, EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/workspace/WorkspaceKit";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { SearchInput } from "@/components/shadcn/search-input";
import type { AlertItem } from "@/api/types";

type Filter = "todas" | "criticas" | "sensores";
export function AlertsWorkspace(): React.JSX.Element {
  const { alerts, loading, error, load, criticas, sensores } = useAlerts();
  const [filter, setFilter] = useState<Filter>("todas");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => (alerts as Array<AlertItem & { plot?: { id: number; name: string } }>).filter((alert) => {
    if (filter === "criticas" && !alert.tipo.includes("critica")) return false;
    if (filter === "sensores" && !alert.tipo.startsWith("sensor")) return false;
    const search = query.trim().toLocaleLowerCase("es");
    return !search || `${alert.mensaje} ${alert.plot?.name ?? ""} ${alert.plot_id ?? ""}`.toLocaleLowerCase("es").includes(search);
  }).sort((a, b) => alertSeverityRank(a) - alertSeverityRank(b)), [alerts, filter, query]);

  const filterButton = (value: Filter, label: string, count?: number): React.JSX.Element => <button type="button" key={value} onClick={() => setFilter(value)} aria-pressed={filter === value} className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 ${filter === value ? "border-primary-600 bg-primary-50 text-primary-800" : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"}`}>{label}<span className="rounded-full bg-white/80 px-1.5 py-0.5 text-xs tabular-nums">{count}</span></button>;

  return <div className="space-y-6">
    <PageHeading eyebrow={C.eyebrow} title={C.title} description={C.description} action={<Button variant="outline" onClick={() => void load()} disabled={loading}><Bell size={16} aria-hidden="true" />Actualizar alertas</Button>} />
    {error ? <ErrorBlock message={error} retry={() => void load()} /> : null}
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-3" aria-label="Resumen de alertas"><Metric label="Avisos detectados" value={alerts.length} detail="En las parcelas accesibles" icon={<Bell size={17} />} tone={alerts.length ? "warning" : "default"} /><Metric label="Humedad crítica" value={criticas.length} detail="Requieren revisión prioritaria" icon={<AlertTriangle size={17} />} tone={criticas.length ? "danger" : "default"} /><Metric label="Avisos de sensores" value={sensores.length} detail="Sin datos o con anomalías" icon={<Radio size={17} />} /></section>
    <Card className="space-y-4 rounded-xl p-4 sm:p-5">
      <div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-50 text-primary-700"><Search size={17} aria-hidden="true" /></span><div><h2 className="font-semibold text-neutral-900">Bandeja de alertas</h2><p className="mt-1 text-sm text-neutral-600">Prioriza incidencias y abre la parcela relacionada.</p></div></div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar alertas">{filterButton("todas", "Todas", alerts.length)}{filterButton("criticas", "Críticas", criticas.length)}{filterButton("sensores", "Sensores", sensores.length)}</div><SearchInput value={query} onChange={setQuery} placeholder={C.search} label={C.searchLabel} className="w-full lg:max-w-sm" /></div>
    </Card>
    {loading ? <LoadingBlock label={C.loading} /> : filtered.length ? <section className="space-y-3" aria-label="Alertas activas"><p className="text-xs text-neutral-500">{filtered.length} {filtered.length === 1 ? "aviso" : "avisos"} · ordenados por prioridad</p><div className="grid gap-3 xl:grid-cols-2">{filtered.map((alert) => <AlertCard key={`${alert.tipo}-${alert.plot_id}-${alert.mensaje}`} alert={alert} />)}</div></section> : <EmptyBlock title={query ? C.noMatch : filter === "todas" ? C.noAlerts : C.noTab} description={query ? C.emptyHint.search : filter === "todas" ? C.emptyHint.none : C.emptyHint.tab} action={query || filter !== "todas" ? <Button variant="outline" onClick={() => { setQuery(""); setFilter("todas"); }}>Ver todas las alertas</Button> : undefined} />}
  </div>;
}

function AlertCard({ alert }: { alert: AlertItem & { plot?: { id: number; name: string } } }): React.JSX.Element {
  const tone = toneOf(alert);
  const help = ALERT_HELP[alert.tipo]?.hint;
  const icon = tone === "critica" ? <Droplets size={18} /> : tone === "sensor" ? <Radio size={18} /> : <AlertTriangle size={18} />;
  const styles = tone === "critica" ? "border-danger-200 bg-danger-50/40" : tone === "sensor" ? "border-warning-200 bg-warning-50/40" : "border-info-100 bg-info-50/40";
  const label = alertTypeLabel(alert.tipo);
  return <Card className={`flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5 ${styles}`}><div className="flex min-w-0 gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-neutral-800" aria-hidden="true">{icon}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-neutral-900">{label}</h3><StatusBadge value={tone === "critica" ? "critica" : tone === "sensor" ? "anomalo" : "incompleta"} label={tone === "critica" ? "Prioridad alta" : tone === "sensor" ? "Revisar dispositivo" : "Datos pendientes"} /></div><p className="mt-2 text-sm leading-relaxed text-neutral-800">{alert.mensaje}</p>{help ? <p className="mt-1 text-xs leading-relaxed text-neutral-600">{help}</p> : null}<p className="mt-2 text-xs font-medium text-neutral-600">{alert.plot?.name ?? (alert.plot_id ? `Parcela #${alert.plot_id}` : "Sin parcela asociada")}</p></div></div>{alert.plot_id ? <Button asChild variant="outline" size="sm" className="w-full shrink-0 sm:w-auto"><Link to="/evaluar" state={{ plotId: alert.plot_id }}>Revisar parcela</Link></Button> : null}</Card>;
}


