import { useAsync } from "@/hooks/useAsync";
import { listEvaluations } from "@/api/endpoints";
import type { Evaluation } from "@/api/types";

type HistoryData = { plotId: number | null; history: Evaluation[]; error: string | null };

export interface UseHistoryResult {
  history: Evaluation[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useHistory(plotId: number | null): UseHistoryResult {
  const { data, loading, execute } = useAsync<HistoryData>(async () => {
    if (plotId === null) return { plotId: null, history: [], error: null };
    try {
      const list = await listEvaluations(plotId);
      return {
        plotId,
        history: list.filter((item) => item.plot_id === plotId).sort((a, b) => Date.parse(b.evaluated_at) - Date.parse(a.evaluated_at)).slice(0, 20),
        error: null,
      };
    } catch {
      return { plotId, history: [], error: "No se pudo cargar el historial." };
    }
  }, { immediate: plotId !== null, refreshKey: plotId });

  const matchesPlot = data?.plotId === plotId;
  return {
    history: matchesPlot ? data.history : [],
    loading: plotId !== null && (loading || !matchesPlot),
    error: matchesPlot ? data.error : null,
    reload: () => { if (plotId !== null) void execute(); },
  };
}
