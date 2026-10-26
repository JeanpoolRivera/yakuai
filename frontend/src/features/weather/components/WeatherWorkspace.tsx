import { CloudRain, MapPin, RefreshCw, Sun, Thermometer, Wind } from "lucide-react";
import { useWeather } from "../hooks/useWeather";
import { PageHeading, Metric, StatusBadge, EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/workspace/WorkspaceKit";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { fmtDateTime, fmtNum } from "@/lib/format";

export function WeatherWorkspace(): React.JSX.Element {
  const weather = useWeather();
  const selected = weather.plots.find((p) => p.id === weather.plotId);
  const rainProb = weather.forecast ? Math.round(Number(weather.forecast.rain_prob) * 100) : null;
  return <div className="space-y-6">
    <PageHeading eyebrow="Monitoreo ambiental" title="Clima" description="Consulta el pronóstico reciente de cada parcela antes de evaluar el riego." action={<Button onClick={() => void weather.onRefreshLive()} disabled={weather.refreshing || weather.plotId === null}><RefreshCw size={16} aria-hidden="true" />{weather.refreshing ? "Actualizando…" : "Actualizar pronóstico"}</Button>} />
    {weather.error ? <ErrorBlock message={weather.error} /> : null}
    {weather.loadingPlots ? <LoadingBlock label="Cargando parcelas…" /> : weather.plots.length === 0 ? <EmptyBlock title="Sin parcelas disponibles" description="Registra una parcela con ubicación para consultar el clima." /> : <>
      <Card className="grid gap-4 rounded-xl p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-5"><div><label htmlFor="weather-plot" className="mb-1.5 block text-sm font-medium text-neutral-800">Parcela</label><select id="weather-plot" value={weather.plotId ?? ""} onChange={(e) => weather.setPlotId(e.target.value ? Number(e.target.value) : null)} className="min-h-12 w-full max-w-xl rounded-md border border-neutral-300 bg-white px-3 text-sm"><option value="" disabled>Selecciona una parcela</option>{weather.plots.map((plot) => <option key={plot.id} value={plot.id}>{plot.name}</option>)}</select>{selected ? <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-neutral-600"><MapPin size={13} aria-hidden="true" />{fmtNum(selected.latitude)}, {fmtNum(selected.longitude)}</p> : null}</div><Button variant="outline" onClick={() => void weather.loadForecast(weather.plotId!)} disabled={weather.loadingFc || weather.plotId === null}><RefreshCw size={15} aria-hidden="true" />Consultar último pronóstico</Button></Card>
      {weather.forecastError ? <ErrorBlock message={weather.forecastError} retry={() => weather.plotId !== null && void weather.loadForecast(weather.plotId)} /> : null}
      {weather.loadingFc ? <LoadingBlock label="Consultando el pronóstico…" /> : weather.forecast ? <>
        <Card className="overflow-hidden rounded-xl">
          <div className="grid gap-5 bg-primary-900 px-5 py-6 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:px-7"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-primary-100">Pronóstico de 6 horas</p><h2 className="mt-2 text-2xl font-semibold">{selected?.name ?? "Parcela"}</h2><p className="mt-1 text-sm text-white/75">Datos obtenidos {fmtDateTime(weather.forecast.fetched_at)}</p></div><div className="flex flex-wrap items-center gap-3"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10"><CloudRain size={28} aria-hidden="true" /></span><div><p className="text-xs text-white/70">Lluvia prevista</p><p className="text-3xl font-semibold tabular-nums">{fmtNum(weather.forecast.rain_mm)} <span className="text-base font-medium">mm</span></p></div></div></div>
          <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5"><Metric label="Probabilidad de lluvia" value={rainProb === null ? "—" : `${rainProb}%`} detail={rainProb !== null && rainProb >= 70 ? "Puede afectar la recomendación de riego." : "No alcanza el umbral para posponer el riego."} icon={<CloudRain size={17} />} tone={rainProb !== null && rainProb >= 70 ? "brand" : "default"} /><Metric label="Temperatura máxima" value={weather.forecast.temp_max === null ? "—" : `${fmtNum(weather.forecast.temp_max)} °C`} detail="En el período consultado" icon={<Sun size={17} />} /><Metric label="Temperatura mínima" value={weather.forecast.temp_min === null ? "—" : `${fmtNum(weather.forecast.temp_min)} °C`} detail="En el período consultado" icon={<Thermometer size={17} />} /></div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200 px-4 py-3 sm:px-5"><span className="text-xs text-neutral-600">Fuente: {weather.forecast.origin === "owm" ? "OpenWeatherMap" : weather.forecast.origin}</span><StatusBadge value={weather.fresh ? "ok" : "inactivo"} label={weather.fresh ? "Vigente" : "Necesita actualizarse"} /></div>
        </Card>
        <Card className="flex items-start gap-3 rounded-xl p-4"><Wind className="mt-0.5 h-5 w-5 shrink-0 text-primary-700" aria-hidden="true" /><p className="text-sm leading-relaxed text-neutral-700">El motor usa la lluvia prevista y su probabilidad junto con la humedad del suelo. Actualiza el pronóstico antes de una nueva evaluación.</p></Card>
      </> : <EmptyBlock title="Aún no hay pronóstico" description="Actualiza el clima para esta parcela. Si la fuente externa no está disponible, el servidor puede devolver su origen alternativo." action={<Button onClick={() => void weather.onRefreshLive()} disabled={weather.refreshing}>{weather.refreshing ? "Actualizando…" : "Actualizar pronóstico"}</Button>} />}
    </>}
  </div>;
}

