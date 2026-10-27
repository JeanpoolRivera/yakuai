import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Check, KeyRound, LoaderCircle } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { GuardedInput } from "@/components/forms/GuardedInput";
import { ApiError, friendlyError } from "@/api/client";
import { activateFarmer } from "@/api/endpoints";

export function ActivateFarmer(): React.JSX.Element {
  const token = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
  const [pin, setPin] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinError, setPinError] = useState("");
  const [confirmationError, setConfirmationError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setPinError("");
    setConfirmationError("");
    if (!token) return setError("El enlace de invitación no es válido. Solicita uno nuevo a tu técnico.");
    if (!/^\d{4}$/.test(pin)) return setPinError("El PIN debe tener 4 dígitos.");
    if (pin !== confirmation) return setConfirmationError("Los PIN no coinciden.");
    setBusy(true);
    try {
      await activateFarmer(token, pin, confirmation);
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const pinMessage = err.fields.new_pin?.[0];
        const confirmationMessage = err.fields.new_pin_confirmation?.[0];
        if (pinMessage) setPinError(pinMessage);
        if (confirmationMessage) setConfirmationError(confirmationMessage);
        if (!pinMessage && !confirmationMessage) setError(friendlyError(err, "Revisa los datos de activación."));
      } else {
        setError(friendlyError(err, "No se pudo activar la cuenta."));
      }
    } finally {
      setBusy(false);
    }
  }

  return <AuthLayout recovery footer={<Link className="auth-link" to="/login">Volver al inicio de sesión</Link>}>
    <header>
      <p className="auth-eyebrow">Cuenta de agricultor</p>
      <h1 id="activate-title">{success ? "Cuenta activada" : "Activa tu cuenta"}</h1>
      <p>{success ? "Ya puedes ingresar con el correo invitado y tu nuevo PIN." : "Confirma tu invitación y crea un PIN personal de 4 dígitos."}</p>
    </header>
    {error && <div className="auth-error" role="alert"><AlertCircle size={17} aria-hidden="true"/><span>{error}</span></div>}
    {success ? <div className="auth-success" role="status"><Check size={17} aria-hidden="true"/><span>Tu cuenta ya está lista.</span></div> : <form className="auth-recovery-form" onSubmit={(event) => void submit(event)} noValidate>
      <div className="auth-field"><label htmlFor="activate-pin">Crea tu PIN</label><div className="auth-input-wrap"><KeyRound aria-hidden="true"/><GuardedInput id="activate-pin" className="auth-input" displayType="password" guardMode="digits" autoComplete="new-password" required maxLength={4} pattern="[0-9]{4}" value={pin} disabled={busy} aria-invalid={Boolean(pinError)} aria-describedby={pinError ? "activate-pin-error" : undefined} onValueChange={(value) => { setPin(value); setPinError(""); setConfirmationError(""); }} placeholder="4 dígitos" /></div>{pinError && <span className="validation-message" id="activate-pin-error" role="alert">{pinError}</span>}</div>
      <div className="auth-field"><label htmlFor="activate-pin-confirm">Repite tu PIN</label><div className="auth-input-wrap"><KeyRound aria-hidden="true"/><GuardedInput id="activate-pin-confirm" className="auth-input" displayType="password" guardMode="digits" autoComplete="new-password" required maxLength={4} pattern="[0-9]{4}" value={confirmation} disabled={busy} aria-invalid={Boolean(confirmationError)} aria-describedby={confirmationError ? "activate-pin-confirm-error" : undefined} onValueChange={(value) => { setConfirmation(value); setConfirmationError(""); }} placeholder="4 dígitos" /></div>{confirmationError && <span className="validation-message" id="activate-pin-confirm-error" role="alert">{confirmationError}</span>}</div>
      <button className="auth-submit" type="submit" disabled={busy}>{busy ? <><LoaderCircle size={17} className="auth-loader" aria-hidden="true"/>Activando…</> : <>Confirmar correo y crear PIN</>}</button>
    </form>}
  </AuthLayout>;
}





