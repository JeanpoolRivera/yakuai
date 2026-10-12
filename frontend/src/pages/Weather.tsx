/* Clima por parcela: pronóstico vigente 3 h + actualización demo/OWM. */
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Clock, Cloud, Droplet, LoaderCircle, Map as MapIcon, Thermometer } from "lucide-react";
import { ApiError, friendlyError } from "../api/client";
import { getWeather, listPlots, refreshWeather } from "../api/endpoints";
import type { Forecast, Plot } from "../api/types";
import { PageHead } from "../components/shadcn/page-head";
import { Badge } from "../components/shadcn/badge";
import { Banner, Empty, Loading } from "../components/shadcn/feedback";
import { Button } from "../components/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/shadcn/card";
import { Input } from "../components/shadcn/input";
import { FormField } from "../components/forms/FormField";
import { ageLabel, ageMinutes, fmtDateTime, fmtNum } from "../lib/format";
import { toastError, toastOk } from "../lib/toast";

const SELECT_CLS =
  "h-12 w-full rounded-sm border border-neutral-400 bg-white px-3 text-sm text-neutral-800 transition-all hover:border-primary-600 focus-visible:border-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15 disabled:cursor-not-allowed disabled:opacity-50";

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
      const fc = await getWeather(id);
      setForecast(fc);
      setRainMm(String(fc.rain_mm));
      setRainProb(String(fc.rain_prob));
      if (fc.temp_max !== null) setTMax(String(fc.temp_max));
      if (fc.temp_min !== null) setTMin(String(fc.temp_min));
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
    const rain = Number(rainMm);
    const prob = Number(rainProb);
    const max = Number(tMax);
    const min = Number(tMin);
    if (!Number.isFinite(rain) || rain < 0) {
      toastError("La lluvia debe ser un número mayor o igual a 0.");
      return;
    }
    if (!Number.isFinite(prob) || prob < 0 || prob > 1) {
      toastError("La probabilidad debe estar entre 0 y 1.");
      return;
    }
    if (!Number.isFinite(max) || !Number.isFinite(min)) {
      toastError("Escribe temperaturas válidas.");
      return;
    }
    if (min > max) {
      toastError("La mínima no puede superar a la máxima.");
      return;
    }
    setRefreshing(true);
    try {
      const fc = await refreshWeather(plotId, {
        rain_mm: rain,
        rain_prob: prob,
        temp_max: max,
        temp_min: min,
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
    <div>
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
        <Empty icon={<MapIcon className="h-5 w-5" aria-hidden="true" />} title="Sin parcelas" hint="Registra una parcela para consultar su clima." />
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <Card aria-label="Pronóstico actual">
            <CardHeader>
              <CardTitle>Condiciones previstas</CardTitle>
              <CardDescription>Selecciona una parcela para consultar su último pronóstico.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <FormField label="Parcela" htmlFor="w-plot">
                <select id="w-plot" className={SELECT_CLS} value={plotId ?? ""} onChange={(e) => setPlotId(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">Selecciona…</option>
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </FormField>
              {plotId === null ? (
                <Empty
                  icon={<Cloud className="h-5 w-5" aria-hidden="true" />}
                  title="Elige una parcela"
                  hint="Verás su último pronóstico y su vigencia."
                />
              ) : loadingFc ? (
                <Loading text="Cargando pronóstico…" />
              ) : !forecast ? (
                <Empty
                  icon={<Cloud className="h-5 w-5" aria-hidden="true" />}
                  title="Sin pronóstico"
                  hint="Utiliza el formulario de actualización para guardar el primer pronóstico de esta parcela."
                />
              ) : (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant={forecast.origin === "owm" ? "info" : "secondary"}>
                      {forecast.origin === "owm" ? "OWM en vivo" : forecast.origin}
                    </Badge>
                    <Badge variant={fresh ? "success" : "warning"}>
                      {fresh ? `Vigente · ${ageLabel(forecast.fetched_at)}` : `Vencido · ${ageLabel(forecast.fetched_at)}`}
                    </Badge>
                  </div>
                  {!fresh ? (
                    <Banner kind="warn">
                      Pronóstico vencido (más de 3 h). Actualízalo o la evaluación saldrá incompleta por clima.
                    </Banner>
                  ) : null}
                  <div className="flex items-center gap-4 rounded-lg bg-primary-50 p-4">
                    <span aria-hidden="true" className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary-700 text-white">
                      <Cloud className="h-9 w-9" />
                    </span>
                    <div>
                      <p className="text-sm text-neutral-600">Lluvia prevista · próximas 6 horas</p>
                      <p className="text-3xl font-semibold tabular-nums text-neutral-800">
                        {fmtNum(forecast.rain_mm, 1)} <span className="text-base font-medium text-neutral-500">mm</span>
                      </p>
                      <span className="text-sm text-neutral-600">{Math.round(Number(forecast.rain_prob) * 100)}% de probabilidad de lluvia</span>
                    </div>
                  </div>
                  <dl className="grid gap-2 sm:grid-cols-2">
                    <div className="flex items-center gap-2 rounded-md border border-neutral-200 p-3">
                      <Thermometer className="h-[17px] w-[17px] shrink-0 text-primary-700" aria-hidden="true" />
                      <div>
                        <dt className="text-xs text-neutral-500">Temperatura mínima</dt>
                        <dd className="font-semibold tabular-nums text-neutral-800">{fmtNum(forecast.temp_min, 0)} <span className="text-xs font-medium text-neutral-500">°C</span></dd>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-neutral-200 p-3">
                      <Thermometer className="h-[17px] w-[17px] shrink-0 text-primary-700" aria-hidden="true" />
                      <div>
                        <dt className="text-xs text-neutral-500">Temperatura máxima</dt>
                        <dd className="font-semibold tabular-nums text-neutral-800">{fmtNum(forecast.temp_max, 0)} <span className="text-xs font-medium text-neutral-500">°C</span></dd>
                      </div>
                    </div>
                  </dl>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <p><span className="text-neutral-500">Actualizado </span><strong className="font-semibold">{fmtDateTime(forecast.fetched_at)}</strong></p>
                    <p><span className="text-neutral-500">Período hasta </span><strong className="font-semibold">{fmtDateTime(forecast.period_to)}</strong></p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid content-start gap-3">
            <Card aria-label="Actualizar pronóstico">
              <CardHeader>
                <CardTitle>Actualizar pronóstico</CardTitle>
                <CardDescription>Ingresa los valores de demostración para la parcela seleccionada.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => void onRefresh(e)} className="grid gap-4">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-neutral-800">
                    <Droplet className="h-[17px] w-[17px] text-primary-700" aria-hidden="true" /> Precipitación
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Lluvia (mm)" htmlFor="w-mm">
                      <Input id="w-mm" inputMode="decimal" value={rainMm} onChange={(e) => setRainMm(e.target.value)} />
                    </FormField>
                    <FormField label="Probabilidad (0–1)" hint="Usa el deslizador o escribe el valor" htmlFor="w-prob">
                      <Input id="w-prob" inputMode="decimal" value={rainProb} onChange={(e) => setRainProb(e.target.value)} />
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={Math.max(0, Math.min(100, Math.round(Number(rainProb) * 100) || 0))}
                        onChange={(e) => setRainProb(String(Number(e.target.value) / 100))}
                        aria-label="Probabilidad de lluvia en porcentaje"
                        className="mt-1 h-2 w-full accent-primary-700"
                      />
                    </FormField>
                  </div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-neutral-800">
                    <Thermometer className="h-[17px] w-[17px] text-primary-700" aria-hidden="true" /> Temperatura
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Máxima (°C)" htmlFor="w-tmax">
                      <Input
                        id="w-tmax"
                        type="number"
                        min={-10}
                        max={45}
                        step={0.5}
                        inputMode="decimal"
                        value={tMax}
                        onChange={(e) => setTMax(e.target.value)}
                      />
                    </FormField>
                    <FormField label="Mínima (°C)" htmlFor="w-tmin">
                      <Input
                        id="w-tmin"
                        type="number"
                        min={-10}
                        max={45}
                        step={0.5}
                        inputMode="decimal"
                        value={tMin}
                        onChange={(e) => setTMin(e.target.value)}
                      />
                    </FormField>
                  </div>
                  <Button type="submit" disabled={refreshing || plotId === null} className="w-full">
                    {refreshing ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Guardar pronóstico
                      </>
                    ) : (
                      <>Guardar pronóstico</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
            <div className="flex items-start gap-3 rounded-lg border border-info-100 bg-info-50 p-4">
              <Clock className="h-5 w-5 shrink-0 text-info-600" aria-hidden="true" />
              <div className="text-sm">
                <strong className="font-semibold text-neutral-800">Vigencia de 3 horas</strong>
                <p className="mt-0.5 text-neutral-600">Actualiza el pronóstico antes de evaluar. Si está vencido, la evaluación quedará incompleta.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}