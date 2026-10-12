import { AuthLayout } from "../components/AuthLayout";
/* Ingreso unificado: el sistema detecta el rol automáticamente por el email. */
/* Visual: réplica EXACTA v2 (login.css) con Tailwind v4. */
import { useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { LoginIcon } from "../components/login-icons";
import { useAuth } from "../app/auth";
import { ApiError, friendlyError } from "../api/client";
import { Button } from "../components/shadcn/button";
import { Input } from "../components/shadcn/input";
import { Label } from "../components/shadcn/label";

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

const INPUT_CLS =
  "h-[50px] w-full rounded-[7px] border border-neutral-400 bg-white pl-11 text-[16px] text-neutral-800 transition-[border-color,box-shadow] placeholder:text-[13px] placeholder:text-neutral-500 hover:border-primary-600 focus:border-primary-600 focus:outline-none focus:[box-shadow:var(--shadow-focus)]! focus:[outline:2px_solid_var(--color-primary-600)]! focus:[outline-offset:2px]! disabled:bg-neutral-100 disabled:hover:border-neutral-400 aria-[invalid=true]:border-danger-500";

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
      <header>
        <p className="mb-3 text-[11px] font-semibold tracking-[.08em] text-primary-700">BIENVENIDO A YAKUAI</p>
        <h1 id="access-title" className="text-[32px] font-semibold leading-[1.2] tracking-[-.04em] text-neutral-800 max-[760px]:text-[28px] max-[380px]:text-[26px]">
          Bienvenido a tu campo.
        </h1>
        <p className="mt-3 text-sm leading-[1.75] text-neutral-700">
          Inicia sesión para continuar con el cuidado de tus parcelas.
        </p>
      </header>

      {error ? (
        <div className="mt-6 flex gap-2.5 rounded-[7px] border border-danger-100 bg-danger-50 p-[14px_16px] text-[13px] text-danger-600" role="alert">
          <LoginIcon name="alert" size={19} />
          <div><strong className="font-semibold">{error}</strong>{hint ? <p className="mt-1">{hint}</p> : null}</div>
        </div>
      ) : null}

      <form className="mt-8 grid gap-[22px] min-[761px]:[@media(max-height:760px)]:mt-6 min-[761px]:[@media(max-height:760px)]:gap-4" aria-busy={busy} onSubmit={(e) => void onSubmit(e)} noValidate>
        <div className="grid min-w-0 gap-2">
          <Label htmlFor="access-email" className="text-[13px] font-semibold text-neutral-800">
            Correo electrónico <span aria-hidden="true" className="text-danger-500">*</span>
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-[15px] top-1/2 flex -translate-y-1/2 text-neutral-600" aria-hidden="true">
              <LoginIcon name="mail" size={17} />
            </span>
            <Input
              id="access-email"
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
              className={`${INPUT_CLS} pr-3.5`}
            />
          </div>
          {emailError ? (
            <p className="text-xs text-danger-500" role="alert" id="access-email-error">
              {emailError}
            </p>
          ) : null}
        </div>

        <div className="grid min-w-0 gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor="access-secret" className="text-[13px] font-semibold text-neutral-800">
              Contraseña o PIN <span aria-hidden="true" className="text-danger-500">*</span>
            </Label>
            {secret.length > 0 && !/^\d{4}$/.test(secret) ? (
              <span className="text-[11px] font-semibold" style={{ color: passwordStrength(secret).color }}>
                {passwordStrength(secret).label}
              </span>
            ) : null}
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-[15px] top-1/2 flex -translate-y-1/2 text-neutral-600" aria-hidden="true">
              <LoginIcon name="lock" size={17} />
            </span>
            <Input
              id="access-secret"
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
              className={`${INPUT_CLS} pr-[50px]`}
            />
            <button
              type="button"
              aria-label={`${showSecret ? "Ocultar" : "Mostrar"} contraseña`}
              aria-pressed={showSecret}
              title={showSecret ? "Ocultar" : "Mostrar"}
              disabled={busy}
              onClick={() => setShowSecret((s) => !s)}
              className="absolute right-[3px] top-[3px] grid h-11 w-11 cursor-pointer place-items-center rounded-[5px] border-0 bg-transparent text-neutral-600 transition-colors hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15 disabled:opacity-50"
            >
              <LoginIcon name={showSecret ? "eyeOff" : "eye"} size={18} />
            </button>
          </div>
          {showCapsHint ? (
            <p className="text-xs text-warning-600" role="status">
              Bloq Mayús está activado.
            </p>
          ) : null}
          {secretError ? (
            <p className="text-xs text-danger-500" role="alert" id="access-secret-error">
              {secretError}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          disabled={busy}
          className="min-h-[50px] w-full cursor-pointer gap-3 rounded-[7px] border border-primary-700 bg-primary-700 px-[18px] py-3.5 font-semibold hover:bg-primary-800 disabled:cursor-wait disabled:opacity-50"
        >
          {busy ? (
            <>
              <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
              Verificando…
            </>
          ) : (
            <>
              Iniciar sesión
              <LoginIcon name="arrow" size={17} />
            </>
          )}
        </Button>

        <div className="text-center">
          <Link
            to="/recuperar-pin"
            className="inline-flex min-h-11 items-center text-[13px] font-semibold text-neutral-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15"
          >
            ¿Olvidaste tu PIN?
          </Link>
        </div>
      </form>

      <div className="mt-6 flex items-start gap-3 border-t border-neutral-200 pt-6 text-xs leading-[1.8]">
        <span className="mt-[3px] shrink-0 text-neutral-600" aria-hidden="true"><LoginIcon name="lock" size={18} /></span>
        <div>
          <p className="font-semibold text-neutral-800">¿Necesitas ayuda para ingresar?</p>
          <span className="text-neutral-600">Contacta a tu técnico o administrador.</span>
        </div>
      </div>
    </AuthLayout>
  );
}