import { useEffect, useRef, useState } from "react";
import { getWeather, listPlots, refreshWeather } from "@/api/endpoints";
import { useLocation } from "react-router-dom";
import type { Forecast, Plot } from "@/api/types";
import { ApiError, friendlyError } from "@/api/client";
import { toastError, toastOk } from "@/lib/toast";

const FRESH_MIN = 180;

export function useWeather() {
  const location = useLocation();
  const requestedPlotId = (location.state as { plotId?: number } | null)?.plotId ?? null;
  
  

  const [plots, setPlots] = useState<Plot[]>([]);
  const [plotId, setPlotId] = useState<number | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loadingPlots, setLoadingPlots] = useState(true);
  const [loadingFc, setLoadingFc] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const weatherRequest = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    listPlots()
      .then((p) => {
        setPlots(p);
        if (p.length > 0) setPlotId(p.some((plot) => plot.id === requestedPlotId) ? requestedPlotId : p[0].id);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "No se cargaron las parcelas."))
      .finally(() => setLoadingPlots(false));
  }, [requestedPlotId]);

  async function loadForecast(id: number): Promise<void> {
    const request = ++weatherRequest.current;
    setForecastError(null);
    setLoadingFc(true);
    setForecast(null);
    try {
      const fc = await getWeather(id);
      if (request !== weatherRequest.current) return;
      setForecast(fc);
      setNow(Date.now());
    } catch (err) {
      if (request !== weatherRequest.current) return;
      if (!(err instanceof ApiError && err.status === 404)) {
        setForecastError(friendlyError(err, "No se pudo cargar el pronóstico."));
      }
    } finally {
      if (request === weatherRequest.current) setLoadingFc(false);
    }
  }

  useEffect(() => {
    if (plotId !== null) void loadForecast(plotId);
    return () => { weatherRequest.current += 1; };
  }, [plotId]);

  async function onRefreshLive(): Promise<void> {
    if (plotId === null) return;
    setRefreshing(true);
    try {
      const fc = await refreshWeather(plotId);
      setForecast(fc);
      setNow(Date.now());
      toastOk(fc.origin === "owm" ? "Pronóstico actualizado (OWM en vivo)." : `Pronóstico guardado (${fc.origin}).`);
    } catch (err) {
      toastError(friendlyError(err, "No se pudo actualizar el clima."));
    } finally {
      setRefreshing(false);
    }
  }

  const age = forecast ? (now - Date.parse(forecast.fetched_at)) / 60000 : null;
  const fresh = age !== null && age >= 0 && age <= FRESH_MIN;

  return {
    plots, plotId, forecast, loadingPlots, loadingFc, refreshing, error, forecastError,
    setPlotId, loadForecast, onRefreshLive, fresh, age, now,
  };
}
