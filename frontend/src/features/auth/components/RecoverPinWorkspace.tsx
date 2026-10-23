import { AuthLayout } from "@/components/AuthLayout";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, LoaderCircle, Lock, Mail, MessageCircle } from "lucide-react";
import { ApiError } from "@/api/client";
import { recoverPin, resetPin } from "@/api/endpoints";
import { Banner } from "@/components/shadcn/feedback";
import { Button } from "@/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Stepper } from "@/components/shadcn/Stepper";

/* Contacto de soporte visible en un solo lugar. Pendiente: servirlo desde configuración del backend. */
const SUPPORT_CONTACT = {
  display: "+51 981 749 857",
  wa: "https://wa.me/51981749857",
};

type Step = "request" | "verify";

export function RecoverPinWorkspace(): React.JSX.Element {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPin, setNewPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showContact, setShowContact] = useState(false);

  async function requestCode(): Promise<void> {
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
      setRecoveryCode("");
      setStep("verify");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo procesar la solicitud.");
    } finally {
      setBusy(false);
    }
  }

  async function onRequest(e: FormEvent): Promise<void> {
    e.preventDefault();
    await requestCode();
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
      <AuthLayout
        recovery
        footer={
          <Link
            to="/login"
            className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver al inicio de sesión
          </Link>
        }
      >
        <header>
          <p className="text-2xs font-semibold uppercase tracking-wide text-primary-700">Recuperación de PIN</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-800">
            {step === "request" ? "Paso 1 de 2" : "Paso 2 de 2"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            {step === "request" ? "Ingresa tu email para recibir el código." : "Ingresa el código y tu nuevo PIN."}
          </p>
        </header>

        <div className="mt-6">
          <Stepper steps={["Solicitar código", "Actualizar PIN"]} current={step === "request" ? 1 : 2} />
        </div>

        {error ? (
          <div className="mt-6">
            <Banner kind="bad">
              <strong className="font-semibold">{error}</strong>
            </Banner>
          </div>
        ) : null}

        {success ? (
          <div className="mt-6">
            <Banner kind="ok">
              <strong className="font-semibold">{success}</strong>
            </Banner>
          </div>
        ) : null}

        {step === "request" ? (
          <form className="mt-8 grid gap-5" aria-busy={busy} onSubmit={(e) => void onRequest(e)} noValidate>
            <div className="grid gap-1.5">
              <Label htmlFor="recover-email">
                Correo electrónico <span aria-hidden="true" className="text-danger-500">*</span>
              </Label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-neutral-500"
                  aria-hidden="true"
                />
                <Input
                  id="recover-email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  placeholder="nombre@ejemplo.com"
                  value={email}
                  disabled={busy}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 text-base placeholder:text-sm"
                />
              </div>
            </div>

            <Button type="submit" disabled={busy} className="w-full">
              {busy ? (
                <>
                  <LoaderCircle className="h-[17px] w-[17px] animate-spin" aria-hidden="true" />
                  Enviando…
                </>
              ) : (
                <>
                  Enviar código de recuperación
                  <ArrowRight className="h-[17px] w-[17px]" aria-hidden="true" />
                </>
              )}
            </Button>
          </form>
        ) : (
          <form className="mt-8 grid gap-5" aria-busy={busy} onSubmit={(e) => void onVerify(e)} noValidate>
            <div className="grid gap-1.5">
              <Label htmlFor="recover-code">
                Código de recuperación <span aria-hidden="true" className="text-danger-500">*</span>
              </Label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-neutral-500"
                  aria-hidden="true"
                />
                <Input
                  id="recover-code"
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={6}
                  placeholder="Código de 6 dígitos"
                  value={recoveryCode}
                  disabled={busy}
                  onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="pl-11 text-base placeholder:text-sm"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="recover-newpin">
                Nuevo PIN <span aria-hidden="true" className="text-danger-500">*</span>
              </Label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-neutral-500"
                  aria-hidden="true"
                />
                <Input
                  id="recover-newpin"
                  type="password"
                  inputMode="numeric"
                  required
                  maxLength={4}
                  placeholder="PIN de 4 dígitos"
                  value={newPin}
                  disabled={busy}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="pl-11 text-base placeholder:text-sm"
                />
              </div>
            </div>

            <Button type="submit" disabled={busy} className="w-full">
              {busy ? (
                <>
                  <LoaderCircle className="h-[17px] w-[17px] animate-spin" aria-hidden="true" />
                  Actualizando…
                </>
              ) : (
                <>
                  Actualizar PIN
                  <ArrowRight className="h-[17px] w-[17px]" aria-hidden="true" />
                </>
              )}
            </Button>
            <div className="text-center">
              <Button type="button" variant="link" disabled={busy} onClick={() => void requestCode()}>
                Reenviar código
              </Button>
            </div>
          </form>
        )}

        <div className="mt-6 flex items-start gap-3 border-t border-neutral-200 pt-6 text-xs leading-relaxed">
          <Lock className="mt-0.5 h-[18px] w-[18px] shrink-0 text-neutral-400" aria-hidden="true" />
          <div>
            <p className="font-semibold text-neutral-800">¿No tienes acceso a tu email?</p>
            <button
              type="button"
              onClick={() => setShowContact(true)}
              className="min-h-[44px] py-2 text-left font-semibold text-primary-700 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15"
            >
              Contactar a técnico o administrador
            </button>
          </div>
        </div>
      </AuthLayout>
      <Dialog
        open={showContact}
        onOpenChange={(open) => {
          if (!open) setShowContact(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contactar a tu técnico</DialogTitle>
            <DialogDescription>Comunícate con tu técnico o administrador para recuperar tu PIN.</DialogDescription>
          </DialogHeader>
          <div className="rounded-md bg-neutral-100 p-4 text-sm">
            <p className="py-1">
              <strong className="font-semibold">Teléfono:</strong> {SUPPORT_CONTACT.display}
            </p>
            <p className="py-1">
              <strong className="font-semibold">WhatsApp:</strong> {SUPPORT_CONTACT.display}
            </p>
            <p className="py-1">
              <strong className="font-semibold">Horario:</strong> Lunes a Viernes 8am - 5pm
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContact(false)}>
              Cerrar
            </Button>
            <Button asChild>
              <a href={SUPPORT_CONTACT.wa} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Abrir WhatsApp
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
