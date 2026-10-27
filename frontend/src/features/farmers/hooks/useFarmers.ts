import { useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { createFarmer, listFarmers, resendFarmerInvitation, updateFarmer } from "@/api/endpoints";
import type { Farmer } from "@/api/types";
import { ApiError, friendlyError } from "@/api/client";
import { toastError, toastOk } from "@/lib/toast";
import { isValidEmail, isValidFarmerName, isValidPeruvianPhone } from "@/lib/validation";

export function useFarmers() {
  const { data, loading, error, execute, setData } = useAsync<Farmer[]>(async () => {
    try {
      return await listFarmers();
    } catch (err) {
      throw new Error(friendlyError(err, "No se pudieron cargar los agricultores."));
    }
  });

  async function resendInvitation(farmerId: number): Promise<void> {
    try {
      await resendFarmerInvitation(farmerId);
      toastOk("Invitación enviada nuevamente.");
      await execute();
    } catch (err) {
      toastError(friendlyError(err, "No se pudo reenviar la invitación."));
    }
  }

  return { farmers: data ?? [], loading, error, load: execute, setFarmers: setData, resendInvitation };
}

export interface FarmerFormState {
  name: string;
  phone: string;
  email: string;
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
    email: "",
    active: true,
    editing: null,
    open: false,
    saving: false,
    fieldErrors: {},
  });

  function openCreate(): void {
    setState({ name: "", phone: "", email: "", active: true, editing: null, open: true, saving: false, fieldErrors: {} });
  }

  function openEdit(farmer: Farmer): void {
    setState({ name: farmer.name, phone: farmer.phone ?? "", email: farmer.email ?? "", active: farmer.is_active, editing: farmer, open: true, saving: false, fieldErrors: {} });
  }

  function close(): void {
    setState((current) => ({ ...current, open: false }));
  }

  async function submit(load: () => Promise<void>): Promise<void> {
    const name = state.name.trim();
    const phone = state.phone.trim();
    const emailInput = state.email.trim();
    const errors: Record<string, string[]> = {};
    if (!isValidFarmerName(name)) errors.name = ["Usa un nombre válido (2 a 120 caracteres)."];
    if (phone && !isValidPeruvianPhone(phone)) errors.phone = ["Usa 9 dígitos, sin símbolos."];
    if (emailInput && !isValidEmail(emailInput)) errors.email = ["Escribe un correo válido."];
    if (state.editing?.email && !emailInput) errors.email = ["No se puede quitar el correo de una cuenta de acceso."];
    if (Object.keys(errors).length) {
      setState((current) => ({ ...current, fieldErrors: errors }));
      return;
    }
    setState((current) => ({ ...current, saving: true, fieldErrors: {} }));
    try {
      const email = emailInput.toLowerCase();
      const body = { name: state.name.trim(), phone: state.phone.trim() || undefined, ...(email ? { email } : {}), is_active: state.active };
      const saved = state.editing
        ? await updateFarmer(state.editing.id, body)
        : await createFarmer(body);
      if (saved.invitation_sent === false) {
        toastError("La ficha se guardó, pero no se pudo enviar la invitación. Reenvíala desde el directorio.");
      } else if (saved.invitation_sent === true) {
        toastOk("Agricultor guardado e invitación enviada.");
      } else {
        toastOk(state.editing ? "Agricultor actualizado." : "Agricultor registrado.");
      }
      setState((current) => ({ ...current, open: false }));
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setState((current) => ({ ...current, fieldErrors: err.fields, saving: false }));
      } else {
        setState((current) => ({ ...current, saving: false }));
        toastError(friendlyError(err, "No se pudo guardar."));
      }
    }
  }

  return { state, setState, openCreate, openEdit, close, submit };
}



