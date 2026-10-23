import { useCallback, useEffect, useRef, useState } from "react";
import { friendlyError } from "@/api/client";
import { listIrrigations, listPlots } from "@/api/endpoints";
import type { Irrigation, Plot } from "@/api/types";

export interface UseIrrigationsResult {
  items: Irrigation[];
  plots: Plot[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useIrrigations(): UseIrrigationsResult {
  const [items, setItems] = useState<Irrigation[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);

  const load = useCallback(async () => {
    const sequence = ++request.current;
    setLoading(true);
    setError(null);
    try {
      const [nextItems, nextPlots] = await Promise.all([listIrrigations(), listPlots()]);
      if (sequence !== request.current) return;
      setItems(nextItems);
      setPlots(nextPlots);
    } catch (err) {
      if (sequence !== request.current) return;
      setError(friendlyError(err, "No se pudo cargar el historial."));
    } finally {
      if (sequence === request.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      request.current += 1;
    };
  }, [load]);

  const reload = useCallback(async () => {
    await load();
  }, [load]);

  return { items, plots, loading, error, reload };
}
