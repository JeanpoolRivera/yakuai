import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { listIrrigations } from "@/api/endpoints";
import type { Evaluation } from "@/api/types";
import { arduinoSerial } from "@/features/sensors/arduinoSerial";

const TELEMETRY_MAX_AGE_MS = 3000;
const PUMP_START_TIMEOUT_MS = 2500;
const PUMP_STOP_TIMEOUT_MS = 2500;

function waitForPumpState(expected: boolean, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    let unsubscribe = (): void => undefined;
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error(expected
        ? "El Arduino no confirmó que la bomba encendió. Revisa el relé y el flotador."
        : "El Arduino no confirmó que la bomba se apagó. Desconecta la alimentación de la bomba."));
    }, timeoutMs);
    const check = (): void => {
      const state = arduinoSerial.getSnapshot();
      if (!state.connected) {
        clearTimeout(timeout);
        unsubscribe();
        reject(new Error("Se perdió la conexión USB con el Arduino."));
      } else if (state.reading?.bomba === expected) {
        clearTimeout(timeout);
        unsubscribe();
        resolve();
      }
    };
    unsubscribe = arduinoSerial.subscribe(check);
    check();
  });
}

export function useArduinoPump(evaluation: Evaluation | null, canControlPump: boolean) {
  const state = useSyncExternalStore(arduinoSerial.subscribe, arduinoSerial.getSnapshot, arduinoSerial.getSnapshot);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState("");
  const [runLiters, setRunLiters] = useState<number | null>(null);
  const startVolumeRef = useRef<number | null>(null);
  const sawPumpOnRef = useRef(false);
  const fresh = state.lastReceivedAt !== null && Date.now() - state.lastReceivedAt <= TELEMETRY_MAX_AGE_MS;
  const waterAvailable = fresh && state.reading?.flotador === "Hay agua suficiente";
  const pumpOn = state.reading?.bomba === true;

  useEffect(() => {
    const reading = state.reading;
    if (startVolumeRef.current !== null && reading?.bomba) sawPumpOnRef.current = true;
    if (startVolumeRef.current !== null && sawPumpOnRef.current && reading && !reading.bomba) {
      const delivered = Math.max(0, reading.volumen_l - startVolumeRef.current);
      setRunLiters(Math.round(delivered * 100) / 100);
      startVolumeRef.current = null;
      sawPumpOnRef.current = false;
    }
  }, [state.reading]);

  const connect = useCallback(async (): Promise<void> => {
    setLocalError("");
    try {
      await arduinoSerial.connect();
    } catch (cause) {
      setLocalError(cause instanceof Error ? cause.message : "No se pudo conectar con el Arduino.");
    }
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    setLocalError("");
    if (evaluation?.result !== "riega") {
      setLocalError("La recomendación actual no autoriza el riego de la maqueta.");
      return false;
    }
    if (!canControlPump) {
      setLocalError("Solo el técnico puede controlar la bomba de la maqueta.");
      return false;
    }
    if (runLiters !== null) {
      setLocalError("Esta evaluación ya activó la maqueta. Registra el resultado antes de iniciar otra activación.");
      return false;
    }
    const current = arduinoSerial.getSnapshot();
    const currentFresh = current.lastReceivedAt !== null && Date.now() - current.lastReceivedAt <= TELEMETRY_MAX_AGE_MS;
    if (!current.connected || !currentFresh) {
      setLocalError("Conecta el Arduino y espera una lectura reciente antes de regar.");
      return false;
    }
    const reading = current.reading;
    if (reading?.flotador !== "Hay agua suficiente") {
      setLocalError("El flotador indica que no hay suficiente agua. La bomba queda bloqueada.");
      return false;
    }
    if (reading.bomba) {
      setLocalError("La bomba ya está encendida.");
      return false;
    }

    setBusy(true);
    try {
      const recent = await listIrrigations(evaluation.plot_id);
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      if (recent.some((item) => item.plot_id === evaluation.plot_id && item.status === "activo" && new Date(item.occurred_at).getTime() >= dayAgo)) {
        setLocalError("Ya hay un riego registrado para esta parcela en las últimas 24 horas.");
        return false;
      }

      setRunLiters(null);
      startVolumeRef.current = reading.volumen_l;
      sawPumpOnRef.current = false;
      await arduinoSerial.sendPumpCommand("1");
      await waitForPumpState(true, PUMP_START_TIMEOUT_MS);
      return true;
    } catch (cause) {
      startVolumeRef.current = null;
      sawPumpOnRef.current = false;
      setLocalError(cause instanceof Error ? cause.message : "No se pudo iniciar la bomba.");
      return false;
    } finally {
      setBusy(false);
    }
  }, [canControlPump, evaluation, runLiters]);

  const stop = useCallback(async (): Promise<void> => {
    setLocalError("");
    setBusy(true);
    try {
      await arduinoSerial.sendPumpCommand("0");
      await waitForPumpState(false, PUMP_STOP_TIMEOUT_MS);
    } catch (cause) {
      setLocalError(cause instanceof Error ? cause.message : "No se pudo detener la bomba.");
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    connected: state.connected,
    connecting: state.connecting,
    reading: state.reading,
    fresh,
    waterAvailable,
    pumpOn,
    busy,
    error: localError || state.error,
    runLiters,
    connect,
    start,
    stop,
  };
}
