import { useCallback, useEffect, useMemo, useState } from "react";
import { listPlots } from "@/api/endpoints";
import type { Plot } from "@/api/types";

export interface UsePlotsResult {
  plots: Plot[];
  plot: Plot | null;
  plotId: number | null;
  setPlotId: (id: number | null) => void;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function usePlots(requestedPlotId: number | null): UsePlotsResult {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [plotId, setPlotId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    listPlots()
      .then((list) => {
        if (!alive) return;
        setPlots(list);
        setPlotId((previous) => {
          if (requestedPlotId !== null && list.some((item) => item.id === requestedPlotId)) {
            return requestedPlotId;
          }
          if (list.length === 1) return list[0].id;
          return previous;
        });
      })
      .catch((err: unknown) => {
        if (alive) setError(err instanceof Error ? err.message : "No se pudieron cargar las parcelas.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [requestedPlotId, version]);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setVersion((value) => value + 1);
  }, []);

  const plot = useMemo(() => plots.find((item) => item.id === plotId) ?? null, [plots, plotId]);

  return { plots, plot, plotId, setPlotId, loading, error, reload };
}
