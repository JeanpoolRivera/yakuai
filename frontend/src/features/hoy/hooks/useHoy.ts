import { useCallback, useState } from "react";
import { listEvaluations, listPlots, listSensors } from "@/api/endpoints";
import type { Evaluation, Plot } from "@/api/types";
import { friendlyError } from "@/api/client";
import { useAsync } from "@/hooks/useAsync";

type HoyData = { plots: Plot[]; sensorsOk: number; sensorsTotal: number; latest: Evaluation[] };
const EMPTY_HOY: HoyData = { plots: [], sensorsOk: 0, sensorsTotal: 0, latest: [] };

export function useHoy() {
  const [refreshing, setRefreshing] = useState(false);
  const { data, loading, error, execute, refresh } = useAsync<HoyData>(async () => {
    try {
      const [plots, evaluations, sensors] = await Promise.all([listPlots(), listEvaluations(), listSensors()]);
      return {
        plots,
        sensorsTotal: sensors.length,
        sensorsOk: sensors.filter((sensor) => sensor.status === "ok" && sensor.is_active).length,
        latest: latestPerPlot(evaluations),
      };
    } catch (err) {
      throw new Error(friendlyError(err, "No se pudo cargar tu información."));
    }
  });

  const load = useCallback(async (isRefresh = false): Promise<void> => {
    if (!isRefresh) {
      await execute();
      return;
    }
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [execute, refresh]);

  const value = data ?? EMPTY_HOY;
  return { loading, error, ...value, plotCount: value.plots.length, refreshing, load };
}

function latestPerPlot(all: Evaluation[]): Evaluation[] {
  const seen = new Map<number, Evaluation>();
  const sorted = [...all].sort((a, b) => (a.evaluated_at < b.evaluated_at ? 1 : -1));
  for (const evaluation of sorted) {
    if (!seen.has(evaluation.plot_id)) seen.set(evaluation.plot_id, evaluation);
  }
  return [...seen.values()];
}
