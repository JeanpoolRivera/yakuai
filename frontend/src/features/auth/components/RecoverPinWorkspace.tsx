import { AuthLayout } from "@/components/AuthLayout";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, ArrowRight, Check, Eye, EyeOff, KeyRound, LoaderCircle, Mail, MessageCircle } from "lucide-react";
import { ApiError, friendlyError } from "@/api/client";
import { recoverPin, resetPin } from "@/api/endpoints";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/shadcn/dialog";

const SUPPORT_CONTACT = { display: "+51 981 749 857", wa: "https://wa.me/51981749857" };
type Step = "request" | "verify";

export function RecoverPinWorkspace(): React.JSX.Element {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPin, setNewPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showContact, setShowContact] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [pinError, setPinError] = useState("");

  async function requestCode(): Promise<void> {
    if (busy) return;
    setError(null); setSuccess(null); setEmailError("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return setEmailError("Escribe tu correo.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return setEmailError("Escribe un correo válido.");
    setBusy(true);
    try {
      const result = await recoverPin(cleanEmail);
      setSuccess(result.message);
      setRecoveryCode("");
      setStep("verify");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : friendlyError(err, "No se pudo procesar la solicitud."));
    } finally {
      setBusy(false);
    }
  }

  async function onRequest(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await requestCode();
  }

  async function onVerify(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (busy) return;
    setError(null); setSuccess(null); setCodeError(""); setPinError("");
    let invalid = false;
    if (!/^\d{6}$/.test(recoveryCode.trim())) { setCodeError("Escribe el código de 6 dígitos."); invalid = true; }
    if (!/^\d{4}$/.test(newPin)) { setPinError("El PIN debe tener 4 dígitos numéricos."); invalid = true; }
    if (invalid) return;
    setBusy(true);
    try {
      const result = await resetPin(email.trim().toLowerCase(), recoveryCode.trim(), newPin.trim());
      setSuccess(result.message);
      window.setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : friendlyError(err, "No se pudo actualizar el PIN."));
    } finally {
      setBusy(false);
    }
  }

  const clearMessages = (): void => { setError(null); setSuccess(null); };
  return <>
    <AuthLayout recovery footer={<Link className="auth-link" to="/login"><ArrowLeft size={15} aria-hidden="true"/>Volver al inicio de sesión</Link>}>
      <header>
        <p className="auth-eyebrow">Recuperación</p>
        <h1 id="recover-title">{step === "request" ? "Recuperar PIN" : "Crea un nuevo PIN"}</h1>
        <p>{step === "request" ? "Te enviaremos un código al correo de tu cuenta." : "Ingresa el código recibido y elige un PIN de 4 dígitos."}</p>
      </header>
      <div className="auth-progress" aria-label={`Paso ${step === "request" ? 1 : 2} de 2`}>
        <div className={`auth-step ${step === "request" ? "is-current" : "is-complete"}`} aria-current={step === "request" ? "step" : undefined}><span className="auth-step-marker">{step === "request" ? "1" : <Check size={14} aria-hidden="true"/>}</span><span className="auth-step-label">Correo</span></div>
        <div className={`auth-step ${step === "verify" ? "is-current" : ""}`} aria-current={step === "verify" ? "step" : undefined}><span className="auth-step-marker">2</span><span className="auth-step-label">Nuevo PIN</span></div>
      </div>
      <p className="auth-step-status" aria-live="polite">Paso {step === "request" ? 1 : 2} de 2</p>
      {error && <div className="auth-error" role="alert"><AlertCircle size={17} aria-hidden="true"/><span>{error}</span></div>}
      {success && <div className="auth-success" role="status"><Check size={17} aria-hidden="true"/><span>{success}</span></div>}
      {step === "request" ? <form className="auth-recovery-form" aria-busy={busy} onSubmit={(event)=>void onRequest(event)} noValidate>
        <div className="auth-field"><label htmlFor="recover-email">Correo electrónico</label><div className="auth-input-wrap"><Mail aria-hidden="true"/><input id="recover-email" className="auth-input" type="email" autoComplete="email" required maxLength={254} placeholder="nombre@ejemplo.com" value={email} disabled={busy} aria-invalid={Boolean(emailError)} aria-describedby={emailError?"recover-email-error":undefined} onChange={(event)=>{setEmail(event.target.value);setEmailError("");clearMessages();}}/></div>{emailError&&<p className="auth-field-error" id="recover-email-error" role="alert">{emailError}</p>}</div>
        <button className="auth-submit" type="submit" disabled={busy}>{busy?<><LoaderCircle size={17} className="auth-loader" aria-hidden="true"/>Enviando…</>:<>Enviar código de recuperación<ArrowRight size={17} aria-hidden="true"/></>}</button>
      </form> : <form className="auth-recovery-form" aria-busy={busy} onSubmit={(event)=>void onVerify(event)} noValidate>
        <div className="auth-field"><label htmlFor="recover-code">Código de recuperación</label><div className="auth-input-wrap"><KeyRound aria-hidden="true"/><input id="recover-code" className="auth-input" type="text" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} placeholder="6 dígitos" value={recoveryCode} disabled={busy} aria-invalid={Boolean(codeError)} aria-describedby={codeError?"recover-code-error":undefined} onChange={(event)=>{setRecoveryCode(event.target.value.replace(/\D/g,"").slice(0,6));setCodeError("");clearMessages();}}/></div>{codeError&&<p className="auth-field-error" id="recover-code-error" role="alert">{codeError}</p>}</div>
        <div className="auth-field"><label htmlFor="recover-newpin">Nuevo PIN</label><div className="auth-input-wrap"><KeyRound aria-hidden="true"/><input id="recover-newpin" className="auth-input has-trailing" type={showPin?"text":"password"} inputMode="numeric" autoComplete="new-password" required maxLength={4} placeholder="4 dígitos" value={newPin} disabled={busy} aria-invalid={Boolean(pinError)} aria-describedby={pinError?"recover-pin-error":undefined} onChange={(event)=>{setNewPin(event.target.value.replace(/\D/g,"").slice(0,4));setPinError("");clearMessages();}}/><button className="auth-password-toggle" type="button" aria-label={showPin?"Ocultar PIN":"Mostrar PIN"} aria-pressed={showPin} disabled={busy} onClick={()=>setShowPin(value=>!value)}>{showPin?<EyeOff size={18} aria-hidden="true"/>:<Eye size={18} aria-hidden="true"/>}</button></div>{pinError&&<p className="auth-field-error" id="recover-pin-error" role="alert">{pinError}</p>}</div>
        <button className="auth-submit" type="submit" disabled={busy}>{busy?<><LoaderCircle size={17} className="auth-loader" aria-hidden="true"/>Actualizando…</>:<>Actualizar PIN<ArrowRight size={17} aria-hidden="true"/></>}</button>
        <button className="auth-link" type="button" disabled={busy} onClick={()=>void requestCode()}>Reenviar código</button>
      </form>}
      <div className="auth-support"><p>¿No tienes acceso a tu correo?</p><button type="button" onClick={()=>setShowContact(true)}>Contacta a tu técnico</button></div>
    </AuthLayout>
    <Dialog open={showContact} onOpenChange={(open)=>setShowContact(open)}><DialogContent><DialogHeader><DialogTitle>Contactar a tu técnico</DialogTitle><DialogDescription>Solicita ayuda para recuperar el acceso a tu cuenta.</DialogDescription></DialogHeader><div className="auth-contact-details"><p><strong>Teléfono:</strong> {SUPPORT_CONTACT.display}</p><p><strong>WhatsApp:</strong> {SUPPORT_CONTACT.display}</p><p><strong>Horario:</strong> Lunes a viernes, 8:00–17:00</p></div><DialogFooter><button className="auth-dialog-secondary" type="button" onClick={()=>setShowContact(false)}>Cerrar</button><a className="auth-dialog-primary" href={SUPPORT_CONTACT.wa} target="_blank" rel="noreferrer"><MessageCircle size={16} aria-hidden="true"/>Abrir WhatsApp</a></DialogFooter></DialogContent></Dialog>
  </>;
}
