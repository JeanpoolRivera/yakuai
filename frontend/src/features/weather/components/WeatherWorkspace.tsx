import { useWeather } from '../hooks/useWeather';

import { Action, FieldBlank, FieldError, FieldLink, FieldLoading, FieldPage, Status } from "@/components/field/FieldUI";
import { ageLabel, fmtDateTime, fmtNum } from "@/lib/format";

import { CloudRain, CloudSun, MapPin, RefreshCw, Clock, ArrowUp, ArrowDown } from "lucide-react";


export function WeatherWorkspace(): React.JSX.Element {
  const { plots, plotId, forecast, loadingPlots, loadingFc, refreshing, error, forecastError, setPlotId, loadForecast, onRefreshLive, fresh } = useWeather();

  const probability = forecast ? Math.max(0, Math.min(100, Math.round(Number(forecast.rain_prob) * 100))) : 0;
  const plot = plots.find((p) => p.id === plotId);

  return (
    <FieldPage title="Clima" intro="Consulta la lluvia prevista y la temperatura de cada parcela." actions={
      <Action tone="line" disabled={plotId === null || loadingFc || refreshing} onClick={() => void onRefreshLive()}><RefreshCw size={16} aria-hidden="true" />{refreshing ? "Actualizando…" : "Actualizar pronóstico"}</Action>
    }>
      {loadingPlots ? <FieldLoading>Cargando parcelas…</FieldLoading> : error ? <FieldError>{error}</FieldError> : !plots.length ? <FieldBlank title="Sin parcelas" icon={<MapPin size={25} />}>Registra una parcela para consultar su clima.</FieldBlank> : (
        <>
          <section className="climate-context" aria-label="Parcela del pronóstico">
            <div className="climate-context-picker"><span className="device-icon"><MapPin size={19} /></span><div><label htmlFor="w-plot">Parcela</label><select id="w-plot" className="field-select" value={plotId ?? ""} disabled={refreshing} onChange={(e) => { const id = Number(e.target.value); if (id !== plotId) { setPlotId(id); } }}>{plots.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div></div>
            <div className="climate-location-meta"><span>{plot?.crop?.name ?? "Cultivo sin especificar"} · {fmtNum(plot?.area_m2)} m²</span><small>{plot?.farmer?.name ?? "Pronóstico por parcela"}</small></div>
            <span className="climate-horizon"><Clock size={15} />Ventana de 6 horas</span>
          </section>
          {loadingFc ? <FieldLoading>Consultando pronóstico…</FieldLoading> : forecastError ? <FieldError retry={() => { if (plotId !== null) void loadForecast(plotId); }}>{forecastError}</FieldError> : !forecast ? (
            <section className="field-panel"><FieldBlank title="El pronóstico está por llegar" icon={<CloudSun size={32} />} action={<Action onClick={() => void onRefreshLive()}>Consultar el clima</Action>}>Actualiza la información de esta parcela antes de evaluar su riego.</FieldBlank></section>
          ) : (
            <>
              {!fresh && <div className="field-notice" role="status">Pronóstico vencido. Actualízalo para utilizarlo en una nueva evaluación.</div>}
              <div className="climate-grid">
                <section className="climate-rain-panel" aria-label="Pronóstico de la parcela">
                  <header><div><p className="field-eyebrow">PRECIPITACIÓN</p><h2>Lluvia prevista</h2></div><CloudRain size={38} strokeWidth={1.25} aria-hidden="true" /></header>
                  <div className="climate-rain-number">{fmtNum(forecast.rain_mm, 1)}<span>mm</span></div>
                  <p className="climate-rain-caption">Acumulación prevista en el período</p>
                  <div className="climate-probability"><div><span>Probabilidad de lluvia</span><strong>{probability}%</strong></div><div className="climate-probability-track" aria-hidden="true"><i style={{ width: `${probability}%` }} /></div></div>
                  <footer><Clock size={14} /><span>{fmtDateTime(forecast.period_from)} — {fmtDateTime(forecast.period_to)}</span></footer>
                </section>
                <section className="field-panel climate-temperature-panel" aria-label="Temperatura prevista">
                  <header className="field-panel-heading"><div><h2>Temperatura</h2><p>Rango previsto para el período.</p></div><CloudSun size={22} /></header>
                  <div className="climate-temperatures"><div><span><ArrowUp size={16} />Máxima</span><strong>{forecast.temp_max === null ? "—" : fmtNum(forecast.temp_max, 0)}<small>°C</small></strong></div><div><span><ArrowDown size={16} />Mínima</span><strong>{forecast.temp_min === null ? "—" : fmtNum(forecast.temp_min, 0)}<small>°C</small></strong></div></div>
                  <div className="climate-temperature-note"><CloudSun size={19} aria-hidden="true" /> <p>La temperatura es parte del cálculo de las necesidades de agua del cultivo.</p></div>
                </section>
              </div>
              <section className="field-panel climate-data" aria-label="Calidad del pronóstico">
                <header className="field-panel-heading"><div><h2>Información del pronóstico</h2><p>Consulta su origen y vigencia antes de evaluar.</p></div><Status tone={fresh ? "good" : "warn"}>{fresh ? "Vigente" : "Vencido"}</Status></header>
                <dl><div><dt>Origen de los datos</dt><dd>Fuente: {forecast.origin === "owm" ? "OpenWeather" : forecast.origin === "demo" ? "Demostración" : forecast.origin === "owm_fallo" ? "Respaldo por fallo de OpenWeather" : forecast.origin}</dd></div><div><dt>Última actualización</dt><dd>{fmtDateTime(forecast.fetched_at)}</dd><small>{ageLabel(forecast.fetched_at)}</small></div><div><dt>Vigencia para evaluar</dt><dd>3 horas desde la consulta</dd><small>{fresh ? "Dentro del plazo de vigencia" : "Se requiere una actualización"}</small></div></dl>
                {forecast.origin !== "owm" && <p className="climate-source-note">Estos datos no proceden de una consulta meteorológica en vivo. Revisa su origen antes de utilizarlos.</p>}
              </section>
              <section className="climate-next"><div><h3>La lluvia es una parte de la decisión.</h3><p>Combínala con la humedad del suelo y las necesidades del cultivo.</p></div><FieldLink to="/evaluar" plotId={plotId ?? undefined}>Evaluar riego</FieldLink></section>
            </>
          )}
        </>
      )}
    </FieldPage>
  );
}
