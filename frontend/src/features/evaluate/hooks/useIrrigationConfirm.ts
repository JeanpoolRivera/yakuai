import { useCallback, useState } from "react";
import { createIrrigation, listIrrigations } from "@/api/endpoints";
import { ApiError } from "@/api/client";
import type { Evaluation } from "@/api/types";
import { toastError, toastInfo, toastOk } from "@/lib/toast";

export interface UseIrrigationConfirmResult {
  confirming: boolean;
  recorded: boolean;
  validationError: string | null;
  clearValidationError: () => void;
  confirm: (appliedLiters: number) => Promise<boolean>;
}

export function useIrrigationConfirm(evaluation: Evaluation | null): UseIrrigationConfirmResult {
  const [confirming, setConfirming] = useState(false);
  const [recordedEvaluationId, setRecordedEvaluationId] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const clearValidationError = useCallback(() => setValidationError(null), []);

  const confirm = useCallback(async (appliedLiters: number): Promise<boolean> => {
    if (!evaluation || evaluation.result !== "riega") return false;
    setValidationError(null);
    if (!Number.isFinite(appliedLiters) || appliedLiters <= 0 || appliedLiters > 99999999.99 || Math.round(appliedLiters * 100) !== appliedLiters * 100) {
      setValidationError("Usa litros mayores que 0 y hasta 2 decimales.");
      return false;
    }
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
          "Esta parcela ya tiene un riego registrado en las últimas 24 horas. Revisa el historial antes de registrar otro.",
        );
        return false;
      }
      const recommended =
        evaluation.min_liters !== null && evaluation.max_liters !== null
          ? Math.round((Number(evaluation.min_liters) + Number(evaluation.max_liters)) / 2)
          : null;
      await createIrrigation({
        plot_id: evaluation.plot_id,
        evaluation_id: evaluation.id,
        occurred_at: new Date().toISOString().slice(0, 19),
        recommended_liters: recommended,
        applied_liters: appliedLiters,
        note: "Cantidad aplicada confirmada desde Evaluar.",
      });
      setRecordedEvaluationId(evaluation.id);
      toastOk("Riego registrado con la cantidad que aplicaste.");
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 422 && err.fields.applied_liters?.[0]) {
        setValidationError(err.fields.applied_liters[0]);
      } else {
        toastError(err instanceof Error ? err.message : "No se pudo registrar el riego.");
      }
      return false;
    } finally {
      setConfirming(false);
    }
  }, [evaluation]);

  return { confirming, recorded: recordedEvaluationId === evaluation?.id, validationError, clearValidationError, confirm };
}






