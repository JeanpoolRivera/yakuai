import { useState } from "react";
import type { FormEvent } from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/design-system/primitives";
import { FormField } from "@/components/forms/FormField";
import { GuardedInput } from "@/components/forms/GuardedInput";
import type { Irrigation } from "@/api/types";
import { FORM_HINT, FORM_TITLE } from "../copy";
import { fmtNum } from "@/lib/format";

export interface IrrigationCorrectDialogProps {
  item: Irrigation;
  busy: boolean;
  fieldErrors: Record<string, string[]>;
  onClose: () => void;
  onSubmit: (id: number, appliedLiters: number, motivo: string) => Promise<boolean>;
}

export function IrrigationCorrectDialog({
  item,
  busy,
  fieldErrors,
  onClose,
  onSubmit,
}: IrrigationCorrectDialogProps): React.JSX.Element {
  const [applied, setApplied] = useState(String(item.applied_liters));
  const [motivo, setMotivo] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    const value = Number(applied);
    if (!Number.isFinite(value) || value <= 0 || value > 99999999.99 || Math.round(value * 100) !== value * 100 || !motivo.trim() || motivo.trim().length > 255) {
      setFormError("Litros: mayor que 0, máx. 2 decimales. Motivo: máx. 255 caracteres.");
      return;
    }
    setFormError(null);
    const ok = await onSubmit(item.id, value, motivo.trim());
    if (ok) onClose();
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
            {FORM_TITLE.correct} #{item.id}
          </DialogTitle>
          <DialogDescription>{FORM_HINT.correct}</DialogDescription>
        </DialogHeader>

        <p className="rounded-lg border border-border bg-neutral-50 p-3 text-sm text-neutral-700">
          Valor actual: <strong className="tabular-nums">{fmtNum(item.applied_liters)} L</strong>
        </p>

        <form id="irrigation-correct-form" noValidate onSubmit={(event) => void handleSubmit(event)} className="grid gap-4">
          <FormField
            label="Agua aplicada corregida (L)"
            required
            htmlFor="irr-correct-applied"
            error={fieldErrors.applied_liters?.[0]}
          >
            <GuardedInput id="irr-correct-applied" guardMode="decimal" maxDecimals={2} required value={applied} onValueChange={setApplied} />
          </FormField>
          <FormField
            label="Motivo"
            hint="Queda en la auditoría."
            required
            htmlFor="irr-correct-motivo"
            error={fieldErrors.motivo?.[0]}
          >
            <GuardedInput id="irr-correct-motivo" guardMode="text" maxLength={255} placeholder="Ej. Medí mal el contador" value={motivo} onValueChange={setMotivo} />
          </FormField>
          {formError ? (
            <p role="alert" className="validation-message">
              {formError}
            </p>
          ) : null}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" form="irrigation-correct-form" loading={busy}>
            Guardar corrección
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}








