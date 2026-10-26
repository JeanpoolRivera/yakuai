import { useEffect, useState } from "react";
import { listEvaluations, listPlots, listSensors } from "@/api/endpoints";
import type { Evaluation, Plot } from '@/api/types';
import { friendlyError } from "@/api/client";

export function useHoy() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [sensorsOk, setSensorsOk] = useState(0);
  const [sensorsTotal, setSensorsTotal] = useState(0);
  const [latest, setLatest] = useState<Evaluation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load(isRefresh = false): Promise<void> {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [plots, evals, sens] = await Promise.all([listPlots(), listEvaluations(), listSensors()]);
      setPlots(plots);
      setSensorsTotal(sens.length);
      setSensorsOk(sens.filter((s) => s.status === "ok" && s.is_active).length);
      setLatest(latestPerPlot(evals));
    } catch (err) {
      setError(friendlyError(err, "No se pudo cargar tu información."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return { loading, error, plots, plotCount: plots.length, sensorsOk, sensorsTotal, latest, refreshing, load };
}

function latestPerPlot(all: Evaluation[]): Evaluation[] {
  const seen = new Map<number, Evaluation>();
  const sorted = [...all].sort((a, b) => (a.evaluated_at < b.evaluated_at ? 1 : -1));
  for (const e of sorted) {
    if (!seen.has(e.plot_id)) seen.set(e.plot_id, e);
  }
  return [...seen.values()];
}
