import { AuthLayout } from "@/components/AuthLayout";
import { useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, Eye, EyeOff, KeyRound, LoaderCircle, Mail } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { ApiError, friendlyError } from "@/api/client";
import { AUTH_COPY as C } from "../copy";
import { GuardedInput } from "@/components/forms/GuardedInput";
import { isValidEmail } from "@/lib/validation";

function hintFor(status: number, backendMsg: string): string | null {
  if (status === 429) return null;
  if (/inactiva/i.test(backendMsg)) return C.accountInactive;
  return "Verifica tu correo y tu PIN o contraseña.";
}

export function LoginWorkspace(): React.JSX.Element {
  const { signInPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState("");

  function trackCaps(event: KeyboardEvent<HTMLInputElement>): void {
    if (typeof event.getModifierState === "function") setCapsOn(event.getModifierState("CapsLock"));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setHint(null);
    setFieldError("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return setFieldError(C.emailError);
    if (!isValidEmail(cleanEmail)) return setFieldError(C.invalidEmail);
    if (!secret) return setFieldError("Ingresa tu PIN o contraseña.");

    setBusy(true);
    try {
      // El backend identifica el rol de la cuenta y valida el PIN o la contraseña.
      await signInPassword(cleanEmail, secret);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const [key] = Object.keys(err.fields);
        setFieldError(key === "email" ? C.invalidEmail : C.invalidSecret);
      } else {
        const message = err instanceof ApiError
          ? err.status === 429
            ? friendlyError(err, C.noAccess)
            : err.message || C.noAccess
          : C.noAccess;
        setError(message);
        setHint(err instanceof ApiError ? hintFor(err.status, message) : null);
      }
    } finally {
      setBusy(false);
    }
  }

  const emailError = /correo/i.test(fieldError) ? fieldError : "";
  const secretError = emailError ? "" : fieldError;
  const clearError = (): void => {
    setFieldError("");
    setError(null);
    setHint(null);
  };

  return (
    <AuthLayout footer={<>{C.sharedDevice}</>}>
      <header>
        <p className="auth-eyebrow">Acceso</p>
        <h1 id="access-title">Entra a tu campo</h1>
        <p>Ingresa el correo de tu cuenta y tu PIN o contraseña.</p>
      </header>
      {error ? (
        <div className="auth-error" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <div><strong>{error}</strong>{hint ? <p>{hint}</p> : null}</div>
        </div>
      ) : null}
      <form aria-busy={busy} onSubmit={(event) => void onSubmit(event)} noValidate>
        <div className="auth-field">
          <label htmlFor="access-email">Correo de cuenta</label>
          <div className="auth-input-wrap">
            <Mail aria-hidden="true" />
            <GuardedInput
              id="access-email" className="auth-input" guardMode="email" autoComplete="email" required maxLength={254}
              placeholder={C.emailPlaceholder} value={email} disabled={busy} aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "access-email-error" : undefined}
              onValueChange={(value) => { setEmail(value); if (fieldError || error) clearError(); }}
              onBlur={() => { if (email.trim() && !isValidEmail(email)) setFieldError(C.invalidEmail); }}
            />
          </div>
          {emailError ? <p className="validation-message" id="access-email-error" role="alert">{emailError}</p> : null}
        </div>
        <div className="auth-field">
          <label htmlFor="access-secret">PIN o contraseña</label>
          <div className="auth-input-wrap">
            <KeyRound aria-hidden="true" />
            <input
              id="access-secret" className="auth-input has-trailing" type={showSecret ? "text" : "password"}
              autoComplete="current-password" required maxLength={255} placeholder="Ingresa tu PIN o contraseña"
              value={secret} disabled={busy} aria-invalid={Boolean(secretError)}
              aria-describedby={secretError ? "access-secret-error" : undefined}
              onKeyDown={trackCaps} onKeyUp={trackCaps} onBlur={() => setCapsOn(false)}
              onChange={(event) => { setSecret(event.target.value); if (fieldError || error) clearError(); }}
            />
            <button className="auth-password-toggle" type="button" aria-label={`${showSecret ? "Ocultar" : "Mostrar"} PIN o contraseña`} aria-pressed={showSecret} title={showSecret ? "Ocultar" : "Mostrar"} disabled={busy} onClick={() => setShowSecret((value) => !value)}>
              {showSecret ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </div>
          {capsOn && !showSecret ? <p className="auth-caps-hint" role="status">{C.capsLock}</p> : null}
          {secretError ? <p className="validation-message" id="access-secret-error" role="alert">{secretError}</p> : null}
        </div>
        <button className="auth-submit" type="submit" disabled={busy}>
          {busy ? <><LoaderCircle size={17} className="auth-loader" aria-hidden="true" />{C.verifying}</> : <>{C.loginButton}<ArrowRight size={17} aria-hidden="true" /></>}
        </button>
      </form>
      <div className="auth-login-help">
        <Link to="/recuperar-pin">¿Olvidaste tu PIN?</Link><span aria-hidden="true"> · </span><span>El personal técnico puede solicitar ayuda a su administrador.</span>
      </div>
    </AuthLayout>
  );
}





