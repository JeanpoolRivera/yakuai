import { useAsync } from "@/hooks/useAsync";
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

type IrrigationsData = { items: Irrigation[]; plots: Plot[] };

export function useIrrigations(): UseIrrigationsResult {
  const { data, loading, error, execute } = useAsync<IrrigationsData>(async () => {
    try {
      const [items, plots] = await Promise.all([listIrrigations(), listPlots()]);
      return { items, plots };
    } catch (err) {
      throw new Error(friendlyError(err, "No se pudo cargar el historial."));
    }
  });

  return { items: data?.items ?? [], plots: data?.plots ?? [], loading, error, reload: execute };
}
