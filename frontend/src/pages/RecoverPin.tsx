import { AuthLayout } from "../components/AuthLayout";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { recoverPin, resetPin } from "../api/endpoints";
import { Icon, Modal, Button } from "../components/ui";

type Step = "request" | "verify";

export function RecoverPin(): React.JSX.Element {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPin, setNewPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showContact, setShowContact] = useState(false);

  async function onRequest(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError("El email es requerido.");
      return;
    }

    setBusy(true);
    try {
      const res = await recoverPin(email.trim().toLowerCase());
      setSuccess(res.message);
      setStep("verify");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo procesar la solicitud.");
    } finally {
      setBusy(false);
    }
  }

  async function onVerify(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setSuccess(null);

    if (!recoveryCode.trim() || !newPin.trim()) {
      setError("Código de recuperación y nuevo PIN son requeridos.");
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      setError("El PIN debe tener 4 dígitos numéricos.");
      return;
    }

    setBusy(true);
    try {
      const res = await resetPin(email.trim().toLowerCase(), recoveryCode.trim(), newPin.trim());
      setSuccess(res.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo actualizar el PIN.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
    <AuthLayout recovery footer={<Link to="/login" className="access-back">← Volver al inicio de sesión</Link>}>
          <header className="access-heading">
            <p className="access-kicker">RECUPERACIÓN DE PIN</p>
            <h1 id="recover-panel-title">{step === "request" ? "Paso 1 de 2" : "Paso 2 de 2"}</h1>
            <p>{step === "request" ? "Ingresa tu email para recibir el código." : "Ingresa el código y tu nuevo PIN."}</p>
          </header>

          {error ? (
            <div className="access-alert" role="alert">
              <Icon name="alert" size={19} />
              <div><strong>{error}</strong></div>
            </div>
          ) : null}

          {success ? (
            <div className="access-success" role="status">
              <Icon name="check" size={19} />
              <div><strong>{success}</strong></div>
            </div>
          ) : null}

          {step === "request" ? (
            <form className="access-form" aria-busy={busy} onSubmit={(e) => void onRequest(e)} noValidate>
              <div className="access-field">
                <label className="access-label" htmlFor="recover-email">
                  Correo electrónico <span aria-hidden="true">*</span>
                </label>
                <div className="access-control">
                  <span className="access-control-icon" aria-hidden="true">
                    <Icon name="mail" size={17} />
                  </span>
                  <input
                    id="recover-email"
                    className="access-input"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    placeholder="nombre@ejemplo.com"
                    value={email}
                    disabled={busy}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="access-submit" disabled={busy}>
                {busy ? (
                  <>
                    <span className="access-spinner" aria-hidden="true" />
                    Enviando…
                  </>
                ) : (
                  <>
                    Enviar código de recuperación
                    <Icon name="arrow" size={17} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form className="access-form" aria-busy={busy} onSubmit={(e) => void onVerify(e)} noValidate>
              <div className="access-field">
                <label className="access-label" htmlFor="recover-code">
                  Código de recuperación <span aria-hidden="true">*</span>
                </label>
                <div className="access-control">
                  <span className="access-control-icon" aria-hidden="true">
                    <Icon name="lock" size={17} />
                  </span>
                  <input
                    id="recover-code"
                    className="access-input"
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={6}
                    placeholder="Código de 6 dígitos"
                    value={recoveryCode}
                    disabled={busy}
                    onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                </div>
              </div>

              <div className="access-field">
                <label className="access-label" htmlFor="recover-newpin">
                  Nuevo PIN <span aria-hidden="true">*</span>
                </label>
                <div className="access-control">
                  <span className="access-control-icon" aria-hidden="true">
                    <Icon name="lock" size={17} />
                  </span>
                  <input
                    id="recover-newpin"
                    className="access-input"
                    type="password"
                    inputMode="numeric"
                    required
                    maxLength={4}
                    placeholder="PIN de 4 dígitos"
                    value={newPin}
                    disabled={busy}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  />
                </div>
              </div>

              <button type="submit" className="access-submit" disabled={busy}>
                {busy ? (
                  <>
                    <span className="access-spinner" aria-hidden="true" />
                    Actualizando…
                  </>
                ) : (
                  <>
                    Actualizar PIN
                    <Icon name="arrow" size={17} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="access-help">
            <span className="access-help-icon" aria-hidden="true"><Icon name="lock" size={18} /></span>
            <div>
              <p>¿No tienes acceso a tu email?</p>
              <button
                type="button"
                className="access-contact-btn"
                onClick={() => setShowContact(true)}
              >
                Contactar a técnico o administrador
              </button>
            </div>
          </div>

    </AuthLayout>
      {showContact ? <Modal title="Contactar a tu técnico" onClose={()=>setShowContact(false)}
        foot={<><Button variant="outline" onClick={()=>setShowContact(false)}>Cerrar</Button><a href="https://wa.me/51981749857" target="_blank" rel="noreferrer" className="btn btn-primary">Abrir WhatsApp</a></>}>
        <p className="muted">Comunícate con tu técnico o administrador para recuperar tu PIN.</p>
        <div className="contact-info"><p><strong>Teléfono:</strong> +51 981 749 857</p><p><strong>WhatsApp:</strong> +51 981 749 857</p><p><strong>Horario:</strong> Lunes a Viernes 8am - 5pm</p></div>
      </Modal> : null}
    </>
  );
}
