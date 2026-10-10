import { AuthLayout } from "../components/AuthLayout";
/* Ingreso unificado: el sistema detecta el rol automáticamente por el email. */
import { useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../app/auth";
import { ApiError, friendlyError } from "../api/client";
import { Icon } from "../components/ui";

function hintFor(status: number, backendMsg: string): string | null {
  if (status === 429) return null;
  if (/inactiva/i.test(backendMsg)) return "Pide a tu administrador que active tu cuenta.";
  if (/pin/i.test(backendMsg)) return "Verifica los 4 dígitos con tu técnico si lo olvidaste.";
  return "Verifica tu correo y contraseña e inténtalo de nuevo.";
}

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { score, label: "Débil", color: "#b91c1c" };
  if (score <= 3) return { score, label: "Media", color: "#b45309" };
  return { score, label: "Fuerte", color: "#15803d" };
}

export function Login(): React.JSX.Element {
  const { signInPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState("");

  function trackCaps(e: KeyboardEvent<HTMLInputElement>): void {
    if (typeof e.getModifierState === "function") setCapsOn(e.getModifierState("CapsLock"));
  }

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setHint(null);
    setFieldError("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setFieldError("Escribe tu correo.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFieldError("Escribe un correo válido.");
      return;
    }
    if (secret.length === 0) {
      setFieldError("Escribe tu contraseña o PIN.");
      return;
    }

    setBusy(true);
    try {
      await signInPassword(cleanEmail, secret);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const [key] = Object.keys(err.fields);
        if (key) {
          setFieldError(key === "email" ? "Escribe un correo válido." : "Revisa este dato.");
          return;
        }
        setFieldError("Revisa los datos del formulario.");
        return;
      }
      const msg =
        err instanceof ApiError
          ? err.status === 429
            ? friendlyError(err, "No se pudo ingresar. Revisa tus datos.")
            : err.message || "No se pudo ingresar. Revisa tus datos."
          : "No se pudo ingresar. Revisa tus datos.";
      setError(msg);
      setHint(err instanceof ApiError ? hintFor(err.status, msg) : null);
    } finally {
      setBusy(false);
    }
  }

  const showCapsHint = capsOn && !showSecret;
  const isEmailError = /correo/i.test(fieldError);
  const emailError = isEmailError ? fieldError : "";
  const secretError = isEmailError ? "" : fieldError;

  return (
    <AuthLayout footer="En un dispositivo compartido, cierra sesión al terminar.">
          <header className="access-heading">
            <p className="access-kicker">BIENVENIDO A YAKUAI</p>
            <h1 id="access-title">Bienvenido a tu campo.</h1>
            <p>Inicia sesión para continuar con el cuidado de tus parcelas.</p>
          </header>
          {error ? (
            <div className="access-alert" role="alert">
              <Icon name="alert" size={19} />
              <div><strong>{error}</strong>{hint ? <p>{hint}</p> : null}</div>
            </div>
          ) : null}
          <form className="access-form" aria-busy={busy} onSubmit={(e) => void onSubmit(e)} noValidate>
            <div className="access-field">
              <label className="access-label" htmlFor="access-email">
                Correo electrónico <span aria-hidden="true">*</span>
              </label>
              <div className="access-control">
                <span className="access-control-icon" aria-hidden="true">
                  <Icon name="mail" size={17} />
                </span>
                <input
                  id="access-email"
                  className="access-input"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  placeholder="nombre@ejemplo.com"
                  value={email}
                  disabled={busy}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? "access-email-error" : undefined}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldError) setFieldError("");
                    if (error) {
                      setError(null);
                      setHint(null);
                    }
                  }}
                />
              </div>
              {emailError ? (
                <p className="access-ferror" role="alert" id="access-email-error">
                  {emailError}
                </p>
              ) : null}
            </div>

            <div className="access-field">
              <div className="access-labelrow">
                <label className="access-label" htmlFor="access-secret">
                  Contraseña o PIN <span aria-hidden="true">*</span>
                </label>
                {secret.length > 0 && !/^\d{4}$/.test(secret) ? (
                  <span className="access-strength" style={{ color: passwordStrength(secret).color }}>
                    {passwordStrength(secret).label}
                  </span>
                ) : null}
              </div>
              <div className="access-control has-action">
                <span className="access-control-icon" aria-hidden="true">
                  <Icon name="lock" size={17} />
                </span>
                <input
                  id="access-secret"
                  className="access-input"
                  type={showSecret ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  maxLength={128}
                  placeholder="Ingresa tu contraseña o PIN"
                  value={secret}
                  disabled={busy}
                  aria-invalid={Boolean(secretError)}
                  aria-describedby={secretError ? "access-secret-error" : undefined}
                  onKeyDown={trackCaps}
                  onKeyUp={trackCaps}
                  onBlur={() => setCapsOn(false)}
                  onChange={(e) => {
                    setSecret(e.target.value);
                    if (fieldError) setFieldError("");
                    if (error) {
                      setError(null);
                      setHint(null);
                    }
                  }}
                />
                <button
                  type="button"
                  className="access-peek"
                  aria-label={`${showSecret ? "Ocultar" : "Mostrar"} contraseña`}
                  aria-pressed={showSecret}
                  title={showSecret ? "Ocultar" : "Mostrar"}
                  disabled={busy}
                  onClick={() => setShowSecret((s) => !s)}
                >
                  <Icon name={showSecret ? "eyeOff" : "eye"} size={18} />
                </button>
              </div>
              {showCapsHint ? (
                <p className="access-fwarn" role="status">
                  Bloq Mayús está activado.
                </p>
              ) : null}
              {secretError ? (
                <p className="access-ferror" role="alert" id="access-secret-error">
                  {secretError}
                </p>
              ) : null}
            </div>

            <button type="submit" className="access-submit" disabled={busy}>
              {busy ? (
                <>
                  <span className="access-spinner" aria-hidden="true" />
                  Verificando…
                </>
              ) : (
                <>
                  Iniciar sesión
                  <Icon name="arrow" size={17} />
                </>
              )}
            </button>
            <div className="access-recover">
              <Link to="/recuperar-pin">¿Olvidaste tu PIN?</Link>
            </div>
          </form>

          <div className="access-help">
            <span className="access-help-icon" aria-hidden="true"><Icon name="lock" size={18} /></span>
            <div><p>¿Necesitas ayuda para ingresar?</p><span>Contacta a tu técnico o administrador.</span></div>
          </div>

    </AuthLayout>
  );
}
