import { useCallback, useState } from "react";
import { createIrrigation, listIrrigations } from "@/api/endpoints";
import type { Evaluation } from "@/api/types";
import { toastError, toastInfo, toastOk } from "@/lib/toast";

export interface UseIrrigationConfirmResult {
  confirming: boolean;
  confirm: () => Promise<void>;
}

export function useIrrigationConfirm(evaluation: Evaluation | null): UseIrrigationConfirmResult {
  const [confirming, setConfirming] = useState(false);

  const confirm = useCallback(async () => {
    if (!evaluation || evaluation.result !== "riega") return;
    setConfirming(true);
    try {
      // El backend ignora plot_id para agricultor: filtramos en cliente.
      const recent = await listIrrigations(evaluation.plot_id);
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const alreadyWatered = recent.some(
        (item) =>
          item.plot_id === evaluation.plot_id &&
          item.status === "activo" &&
          new Date(item.occurred_at).getTime() >= dayAgo,
      );
      if (alreadyWatered) {
        toastInfo(
          "Esta parcela ya tiene un riego registrado en las últimas 24 horas. Revisa el historial antes de regar de nuevo.",
        );
        return;
      }
      const average =
        evaluation.min_liters && evaluation.max_liters
          ? Math.round((Number(evaluation.min_liters) + Number(evaluation.max_liters)) / 2)
          : 0;
      await createIrrigation({
        plot_id: evaluation.plot_id,
        evaluation_id: evaluation.id,
        occurred_at: new Date().toISOString().slice(0, 19),
        recommended_liters: average,
        applied_liters: average,
        note: "Confirmado con 1 desde Evaluar",
      });
      toastOk("Riego anotado. Mañana verificamos si la tierra se recuperó.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "No se pudo anotar el riego.");
    } finally {
      setConfirming(false);
    }
  }, [evaluation]);

  return { confirming, confirm };
}
