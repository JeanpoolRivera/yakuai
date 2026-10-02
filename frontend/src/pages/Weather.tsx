/* Clima por parcela: pronóstico vigente 3 h + actualización demo/OWM. */
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ApiError, friendlyError } from "../api/client";
import { getWeather, listPlots, refreshWeather } from "../api/endpoints";
import type { Forecast, Plot } from "../api/types";
import {
  Badge,
  Banner,
  Button,
  Card,
  Empty,
  Field,
  Loading,
  Icon,
  PageHead,
  SelectInput,
  TextInput,
} from "../components/ui";
import { ageLabel, ageMinutes, fmtDateTime, fmtNum } from "../lib/format";
import { toastError, toastOk } from "../lib/toast";

const FRESH_MIN = 180;

export function Weather(): React.JSX.Element {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [plotId, setPlotId] = useState<number | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loadingPlots, setLoadingPlots] = useState(true);
  const [loadingFc, setLoadingFc] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rainMm, setRainMm] = useState("10");
  const [rainProb, setRainProb] = useState("0.8");
  const [tMax, setTMax] = useState("25");
  const [tMin, setTMin] = useState("12");

  useEffect(() => {
    listPlots()
      .then((p) => {
        setPlots(p);
        if (p.length === 1) setPlotId(p[0].id);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "No se cargaron las parcelas."))
      .finally(() => setLoadingPlots(false));
  }, []);

  async function loadForecast(id: number): Promise<void> {
    setLoadingFc(true);
    setForecast(null);
    try {
      setForecast(await getWeather(id));
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 404)) {
        toastError(friendlyError(err, "No se pudo cargar el pronóstico."));
      }
    } finally {
      setLoadingFc(false);
    }
  }

  useEffect(() => {
    if (plotId !== null) void loadForecast(plotId);
  }, [plotId]);

  async function onRefresh(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (plotId === null) return;
    setRefreshing(true);
    try {
      const fc = await refreshWeather(plotId, {
        rain_mm: Number(rainMm),
        rain_prob: Number(rainProb),
        temp_max: Number(tMax),
        temp_min: Number(tMin),
      });
      setForecast(fc);
      toastOk(fc.origin === "owm" ? "Pronóstico actualizado (OWM en vivo)." : "Pronóstico demo guardado.");
    } catch (err) {
      toastError(friendlyError(err, "No se pudo actualizar el clima."));
    } finally {
      setRefreshing(false);
    }
  }

  const age = ageMinutes(forecast?.fetched_at);
  const fresh = age !== null && age <= FRESH_MIN;

  return (
    <div className="page monitoring-page">
      <PageHead
        eyebrow="Monitoreo de campo"
        title="Clima por parcela"
        desc="Consulta las condiciones previstas y mantén vigente el clima que acompaña tus decisiones de riego."
        crumbs="YakuAI / Clima"
      />

      {loadingPlots ? (
        <Loading text="Cargando parcelas…" />
      ) : error ? (
        <Banner kind="bad">{error}</Banner>
      ) : plots.length === 0 ? (
        <Empty icon="map" title="Sin parcelas" hint="Registra una parcela para consultar su clima." />
      ) : (
        <div className="monitoring-weather-layout">
          <Card label="Pronóstico actual" title="Condiciones previstas" sub="Selecciona una parcela para consultar su último pronóstico.">
            <Field label="Parcela" htmlFor="w-plot">
              <SelectInput id="w-plot" value={plotId ?? ""} onChange={(e) => setPlotId(e.target.value ? Number(e.target.value) : null)}>
                <option value="">Selecciona…</option>
                {plots.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            {plotId === null ? (
              <Empty icon="cloud" title="Elige una parcela" hint="Verás su último pronóstico y su vigencia." />
            ) : loadingFc ? (
              <Loading text="Cargando pronóstico…" />
            ) : !forecast ? (
              <Empty
                icon="cloud"
                title="Sin pronóstico"
                hint="Utiliza el formulario de actualización para guardar el primer pronóstico de esta parcela."
              />
            ) : (
              <>
                <div className="spread">
                  <Badge tone={forecast.origin === "owm" ? "owm" : "demo"}>
                    {forecast.origin === "owm" ? "OWM en vivo" : forecast.origin}
                  </Badge>
                  <Badge tone={fresh ? "vigente" : "vencido"}>
                    {fresh ? `Vigente · ${ageLabel(forecast.fetched_at)}` : `Vencido · ${ageLabel(forecast.fetched_at)}`}
                  </Badge>
                </div>
                {!fresh ? (
                  <Banner kind="warn">
                    Pronóstico vencido (más de 3 h). Actualízalo o la evaluación saldrá incompleta por clima.
                  </Banner>
                ) : null}
                <div className="monitoring-weather-hero">
                  <div className="monitoring-weather-symbol" aria-hidden="true"><Icon name="cloud" size={44} /></div>
                  <p>Lluvia prevista · próximas 6 horas</p>
                  <div className="monitoring-rain-value">{fmtNum(forecast.rain_mm, 1)} <span>mm</span></div>
                  <span className="monitoring-rain-prob">{Math.round(Number(forecast.rain_prob) * 100)}% de probabilidad de lluvia</span>
                </div>
                <dl className="monitoring-weather-details">
                  <div><dt><Icon name="temp" size={17} />Temperatura mínima</dt><dd>{fmtNum(forecast.temp_min, 0)} <span>°C</span></dd></div>
                  <div><dt><Icon name="temp" size={17} />Temperatura máxima</dt><dd>{fmtNum(forecast.temp_max, 0)} <span>°C</span></dd></div>
                </dl>
                <div className="monitoring-forecast-meta"><p><span>Actualizado</span><strong>{fmtDateTime(forecast.fetched_at)}</strong></p><p><span>Período hasta</span><strong>{fmtDateTime(forecast.period_to)}</strong></p></div>
              </>
            )}
          </Card>

          <div className="monitoring-aside">
            <Card label="Actualizar pronóstico" title="Actualizar pronóstico" sub="Ingresa los valores de demostración para la parcela seleccionada.">
              <form className="monitoring-weather-form" onSubmit={(e) => void onRefresh(e)}>
                <p className="monitoring-form-caption"><Icon name="drop" size={17} /> Precipitación</p>
                <div className="form-grid">
                  <Field label="Lluvia (mm)" htmlFor="w-mm">
                    <TextInput id="w-mm" inputMode="decimal" value={rainMm} onChange={(e) => setRainMm(e.target.value)} />
                  </Field>
                  <Field label="Probabilidad (0–1)" hint="Usa el deslizador o escribe el valor" htmlFor="w-prob">
                    <TextInput id="w-prob" inputMode="decimal" value={rainProb} onChange={(e) => setRainProb(e.target.value)} />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={Math.max(0, Math.min(100, Math.round(Number(rainProb) * 100) || 0))}
                      onChange={(e) => setRainProb(String(Number(e.target.value) / 100))}
                      aria-label="Probabilidad de lluvia en porcentaje"
                    />
                  </Field>
                </div>
                <p className="monitoring-form-caption"><Icon name="temp" size={17} /> Temperatura</p>
                <div className="form-grid">
                  <Field label="Máxima (°C)" htmlFor="w-tmax">
                    <TextInput
                      id="w-tmax"
                      type="number"
                      min={-10}
                      max={45}
                      step={0.5}
                      inputMode="decimal"
                      value={tMax}
                      onChange={(e) => setTMax(e.target.value)}
                    />
                  </Field>
                  <Field label="Mínima (°C)" htmlFor="w-tmin">
                    <TextInput
                      id="w-tmin"
                      type="number"
                      min={-10}
                      max={45}
                      step={0.5}
                      inputMode="decimal"
                      value={tMin}
                      onChange={(e) => setTMin(e.target.value)}
                    />
                  </Field>
                </div>
                <Button type="submit" loading={refreshing} disabled={plotId === null} block>
                  Guardar pronóstico
                </Button>
              </form>
            </Card>
          <div className="monitoring-note"><Icon name="clock" size={20} /><div><strong>Vigencia de 3 horas</strong><p>Actualiza el pronóstico antes de evaluar. Si está vencido, la evaluación quedará incompleta.</p></div></div>
          </div>
        </div>
      )}
    </div>
  );
}
