import { useCallback, useEffect, useState } from "react";
import { getWeather, listPlots, refreshWeather } from "@/api/endpoints";
import { useLocation } from "react-router-dom";
import type { Forecast, Plot } from "@/api/types";
import { ApiError, friendlyError } from "@/api/client";
import { toastError, toastOk } from "@/lib/toast";
import { useAsync } from "@/hooks/useAsync";

const FRESH_MIN = 180;
const EMPTY_PLOTS: Plot[] = [];
type ForecastSnapshot = { plotId: number; forecast: Forecast | null; error: string | null };

export function useWeather() {
  const location = useLocation();
  const requestedPlotId = (location.state as { plotId?: number } | null)?.plotId ?? null;
  const [plotId, setPlotId] = useState<number | null>(requestedPlotId);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const plotsState = useAsync<Plot[]>(async () => {
    try {
      const plots = await listPlots();
      setPlotId((current) => current !== null && plots.some((plot) => plot.id === current)
        ? current
        : plots.some((plot) => plot.id === requestedPlotId) ? requestedPlotId : plots[0]?.id ?? null);
      return plots;
    } catch (err) {
      throw new Error(friendlyError(err, "No se cargaron las parcelas."));
    }
  }, { refreshKey: requestedPlotId });

  const forecastState = useAsync<ForecastSnapshot>(async () => {
    if (plotId === null) return { plotId: -1, forecast: null, error: null };
    try {
      const forecast = await getWeather(plotId);
      setNow(Date.now());
      return { plotId, forecast, error: null };
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return { plotId, forecast: null, error: null };
      return { plotId, forecast: null, error: friendlyError(err, "No se pudo cargar el pronóstico.") };
    }
  }, { immediate: plotId !== null, refreshKey: plotId });

  const executeForecast = forecastState.execute;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const loadForecast = useCallback(async (id: number): Promise<void> => {
    if (id !== plotId) {
      setPlotId(id);
      return;
    }
    await executeForecast();
  }, [plotId, executeForecast]);

  async function onRefreshLive(): Promise<void> {
    if (plotId === null) return;
    setRefreshing(true);
    try {
      const forecast = await refreshWeather(plotId);
      forecastState.setData({ plotId, forecast, error: null });
      setNow(Date.now());
      toastOk(forecast.origin === "owm" ? "Pronóstico actualizado (OWM en vivo)." : `Pronóstico guardado (${forecast.origin}).`);
    } catch (err) {
      toastError(friendlyError(err, "No se pudo actualizar el clima."));
    } finally {
      setRefreshing(false);
    }
  }

  const matchesPlot = forecastState.data?.plotId === plotId;
  const forecast = matchesPlot ? forecastState.data.forecast : null;
  const forecastError = matchesPlot ? forecastState.data.error : null;
  const loadingFc = plotId !== null && (forecastState.loading || !matchesPlot);
  const age = forecast ? (now - Date.parse(forecast.fetched_at)) / 60000 : null;
  const fresh = age !== null && age >= 0 && age <= FRESH_MIN;

  return {
    plots: plotsState.data ?? EMPTY_PLOTS,
    plotId,
    forecast,
    loadingPlots: plotsState.loading,
    loadingFc,
    refreshing,
    error: plotsState.error,
    forecastError,
    setPlotId,
    loadForecast,
    onRefreshLive,
    fresh,
    age,
    now,
  };
}
