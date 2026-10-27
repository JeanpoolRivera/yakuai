import { useCallback, useState } from "react";
import { ApiError, friendlyError } from "@/api/client";
import {
  correctIrrigation,
  createIrrigation,
  voidIrrigation as voidIrrigationApi,
} from "@/api/endpoints";
import type { IrrigationInput } from "@/api/endpoints";
import { toastError, toastOk } from "@/lib/toast";
import { TOAST } from "../copy";

export interface IrrigationMutationsResult {
  busy: boolean;
  fieldErrors: Record<string, string[]>;
  clearFieldErrors: () => void;
  create: (input: IrrigationInput) => Promise<boolean>;
  correct: (id: number, appliedLiters: number, motivo: string) => Promise<boolean>;
  annul: (id: number, motivo: string) => Promise<boolean>;
}

export function useIrrigationMutations(onDone?: () => void | Promise<void>): IrrigationMutationsResult {
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const clearFieldErrors = useCallback(() => setFieldErrors({}), []);

  const finish = useCallback(async () => {
    if (onDone) await onDone();
  }, [onDone]);

  const create = useCallback(
    async (input: IrrigationInput): Promise<boolean> => {
      setBusy(true);
      setFieldErrors({});
      try {
        await createIrrigation(input);
        toastOk(TOAST.created);
        await finish();
        return true;
      } catch (err) {
        if (err instanceof ApiError && err.status === 422) {
          setFieldErrors(err.fields);
        } else {
          toastError(friendlyError(err, "No se pudo registrar el riego."));
        }
        return false;
      } finally {
        setBusy(false);
      }
    },
    [finish],
  );

  const correct = useCallback(
    async (id: number, appliedLiters: number, motivo: string): Promise<boolean> => {
      setBusy(true);
      setFieldErrors({});
      try {
        await correctIrrigation(id, appliedLiters, motivo);
        toastOk(TOAST.corrected);
        await finish();
        return true;
      } catch (err) {
        if (err instanceof ApiError && err.status === 422) {
          setFieldErrors(err.fields);
        } else {
          toastError(friendlyError(err, "No se pudo corregir el riego."));
        }
        return false;
      } finally {
        setBusy(false);
      }
    },
    [finish],
  );

  const annul = useCallback(
    async (id: number, motivo: string): Promise<boolean> => {
      setBusy(true);
      setFieldErrors({});
      try {
        await voidIrrigationApi(id, motivo);
        toastOk(TOAST.voided);
        await finish();
        return true;
      } catch (err) {
        if (err instanceof ApiError && err.status === 422) {
          setFieldErrors(err.fields);
        } else {
          toastError(friendlyError(err, "No se pudo anular el riego."));
        }
        return false;
      } finally {
        setBusy(false);
      }
    },
    [finish],
  );

  return { busy, fieldErrors, clearFieldErrors, create, correct, annul };
}
