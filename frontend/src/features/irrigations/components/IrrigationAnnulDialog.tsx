import { useState } from "react";
import type { FormEvent } from "react";
import { Alert, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/design-system/primitives";
import { FormField } from "@/components/forms/FormField";
import { GuardedInput } from "@/components/forms/GuardedInput";
import type { Irrigation } from "@/api/types";
import { FORM_HINT, FORM_TITLE } from "../copy";
import { plotName } from "../utils";

export interface IrrigationAnnulDialogProps {
  item: Irrigation;
  busy: boolean;
  fieldErrors: Record<string, string[]>;
  onClose: () => void;
  onSubmit: (id: number, motivo: string) => Promise<boolean>;
}

export function IrrigationAnnulDialog({
  item,
  busy,
  fieldErrors,
  onClose,
  onSubmit,
}: IrrigationAnnulDialogProps): React.JSX.Element {
  const [motivo, setMotivo] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(): Promise<void> {
    if (!motivo.trim() || motivo.trim().length > 255) {
      setFormError("Escribe un motivo (máx. 255 caracteres).");
      setConfirming(false);
      return;
    }
    setFormError(null);
    const ok = await onSubmit(item.id, motivo.trim());
    if (ok) onClose();
  }

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    void submit();
  }

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next && !busy) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {FORM_TITLE.void} #{item.id}
          </DialogTitle>
          <DialogDescription>{FORM_HINT.void}</DialogDescription>
        </DialogHeader>

        {confirming ? (
          <>
            <Alert tone="warning" title={`Vas a anular el riego de ${plotName(item)}`}>
              Quedará marcado como anulado con el motivo “{motivo.trim()}”. No se puede deshacer.
            </Alert>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirming(false)} disabled={busy}>
                Volver
              </Button>
              <Button variant="danger" onClick={() => void submit()} loading={busy}>
                Anular registro
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form id="irrigation-annul-form" onSubmit={handleSubmit} className="grid gap-4">
            <FormField
              label="Motivo de anulación"
              hint="Quedará en la auditoría junto al registro."
              required
              htmlFor="irr-annul-motivo"
              error={fieldErrors.motivo?.[0]}
            >
<GuardedInput id="irr-annul-motivo" guardMode="text" maxLength={255} required placeholder="Ej. No se regó" value={motivo} onValueChange={setMotivo} />
            </FormField>
            {formError ? (
              <p role="alert" className="validation-message">
                {formError}
              </p>
            ) : null}
            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={busy}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                type="button"
                disabled={motivo.trim() === ""}
                onClick={() => setConfirming(true)}
              >
                Continuar
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}






