import { useCallback, useState } from "react";
import { ApiError } from "@/api/client";
import { evaluatePlot, getEvaluationMessage, refreshWeather } from "@/api/endpoints";
import type { Evaluation } from "@/api/types";
import { toastError, toastInfo, toastOk } from "@/lib/toast";

function announce(evaluation: Evaluation): void {
  if (evaluation.result === "riega") {
    toastOk(evaluation.is_critical ? "Humedad crítica: riega hoy mismo." : "Recomendación lista: toca regar.");
  } else if (evaluation.result === "espera") {
    toastInfo("Viene lluvia: mejor esperar 6 horas.");
  } else if (evaluation.result === "no") {
    toastOk("La tierra está bien. Sin riego por ahora.");
  }
}

export interface UseEvaluationResult {
  current: Evaluation | null;
  busy: boolean;
  sharing: boolean;
  error: string | null;
  evaluate: (plotId: number) => Promise<void>;
  reset: () => void;
  share: () => Promise<void>;
}

export function useEvaluation(): UseEvaluationResult {
  const [current, setCurrent] = useState<Evaluation | null>(null);
  const [busy, setBusy] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setCurrent(null);
    setError(null);
  }, []);

  const evaluate = useCallback(async (plotId: number) => {
    setError(null);
    setBusy(true);
    try {
      // 1 clic = actualiza clima OWM y evalúa con dato fresco.
      try {
        await refreshWeather(plotId);
      } catch {
        // Si el refresh falla, se evalúa igual (el backend usa el último válido).
      }
      const evaluation = await evaluatePlot(plotId);
      setCurrent(evaluation);
      announce(evaluation);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422 && err.data) {
        setError(null);
        setCurrent(err.data as Evaluation); // incompleta: el backend devuelve la evaluación creada
        toastInfo("Faltan datos para decidir. Revisa qué está pendiente.");
      } else {
        const message = err instanceof Error ? err.message : "No se pudo evaluar.";
        setError(message);
        toastError(message);
      }
    } finally {
      setBusy(false);
    }
  }, []);

  const share = useCallback(async () => {
    if (!current) return;
    setSharing(true);
    try {
      const { texto } = await getEvaluationMessage(current.id);
      const win = window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
      if (win === null) {
        toastInfo("El navegador bloqueó la ventana: permite ventanas emergentes para compartir por WhatsApp.");
      }
    } catch (err) {
      toastError(err instanceof Error ? err.message : "No se pudo generar el mensaje.");
    } finally {
      setSharing(false);
    }
  }, [current]);

  return { current, busy, sharing, error, evaluate, reset, share };
}
