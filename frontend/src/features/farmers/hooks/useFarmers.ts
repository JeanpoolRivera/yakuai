import { useEffect, useState } from "react";
import { listFarmers, createFarmer, updateFarmer } from "@/api/endpoints";
import type { Farmer } from "@/api/types";
import { ApiError, friendlyError } from "@/api/client";
import { toastError, toastOk } from "@/lib/toast";

export function useFarmers() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      setFarmers(await listFarmers());
    } catch (err) {
      setError(friendlyError(err, "No se pudieron cargar los agricultores."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return { farmers, loading, error, load, setFarmers };
}

export interface FarmerFormState {
  name: string;
  phone: string;
  active: boolean;
  editing: Farmer | null;
  open: boolean;
  saving: boolean;
  fieldErrors: Record<string, string[]>;
}

export function useFarmerForm() {
  const [state, setState] = useState<FarmerFormState>({
    name: "",
    phone: "",
    active: true,
    editing: null,
    open: false,
    saving: false,
    fieldErrors: {},
  });

  function openCreate() {
    setState({ name: "", phone: "", active: true, editing: null, open: true, saving: false, fieldErrors: {} });
  }

  function openEdit(f: Farmer) {
    setState({ name: f.name, phone: f.phone ?? "", active: f.is_active, editing: f, open: true, saving: false, fieldErrors: {} });
  }

  function close() {
    setState((s) => ({ ...s, open: false }));
  }

  async function submit(load: () => Promise<void>) {
    if (state.name.trim().length < 2) {
      toastError("El nombre debe tener al menos 2 letras.");
      return;
    }
    setState((s) => ({ ...s, saving: true, fieldErrors: {} }));
    try {
      const body = { name: state.name.trim(), phone: state.phone.trim() || undefined, is_active: state.active };
      if (state.editing) {
        await updateFarmer(state.editing.id, body);
        toastOk("Agricultor actualizado.");
      } else {
        await createFarmer(body);
        toastOk("Agricultor registrado.");
      }
      setState((s) => ({ ...s, open: false }));
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setState((s) => ({ ...s, fieldErrors: err.fields, saving: false }));
        toastError("Revisa los campos marcados.");
      } else {
        setState((s) => ({ ...s, saving: false }));
        toastError(friendlyError(err, "No se pudo guardar."));
      }
    }
  }

  return { state, setState, openCreate, openEdit, close, submit };
}