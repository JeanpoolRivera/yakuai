import { useCallback, useEffect, useRef, useState } from "react";
import { listEvaluations } from "@/api/endpoints";
import type { Evaluation } from "@/api/types";

export interface UseHistoryResult {
  history: Evaluation[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useHistory(plotId: number | null): UseHistoryResult {
  const [history, setHistory] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);

  const load = useCallback(async (id: number) => {
    const sequence = ++request.current;
    setError(null);
    setLoading(true);
    try {
      // El backend ignora plot_id para agricultor: filtramos en cliente.
      const list = await listEvaluations(id);
      if (sequence !== request.current) return;
      setHistory(
        list
          .filter((item) => item.plot_id === id)
          .sort((a, b) => Date.parse(b.evaluated_at) - Date.parse(a.evaluated_at))
          .slice(0, 20),
      );
    } catch {
      if (sequence !== request.current) return;
      setHistory([]);
      setError("No se pudo cargar el historial.");
    } finally {
      if (sequence === request.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (plotId === null) return;
    void load(plotId);
    return () => {
      request.current += 1;
    };
  }, [plotId, load]);

  const reload = useCallback(() => {
    if (plotId !== null) void load(plotId);
  }, [plotId, load]);

  return { history, loading, error, reload };
}
