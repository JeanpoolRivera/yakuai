import { useState } from "react";
import type { FormEvent } from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/design-system/primitives";
import { FormField } from "@/components/forms/FormField";
import { Input } from "@/components/shadcn/input";
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
  const [applied, setApplied] = useState(item.applied_liters);
  const [motivo, setMotivo] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (applied.trim() === "" || motivo.trim() === "") {
      setFormError("Escribe el valor corregido y el motivo.");
      return;
    }
    setFormError(null);
    const ok = await onSubmit(item.id, Number(applied), motivo.trim());
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

        <form id="irrigation-correct-form" onSubmit={(event) => void handleSubmit(event)} className="grid gap-4">
          <FormField
            label="Agua aplicada corregida (L)"
            required
            htmlFor="irr-correct-applied"
            error={fieldErrors.applied_liters?.[0]}
          >
            <Input
              id="irr-correct-applied"
              inputMode="decimal"
              value={applied}
              onChange={(event) => setApplied(event.target.value)}
            />
          </FormField>
          <FormField
            label="Motivo"
            hint="Queda en la auditoría."
            required
            htmlFor="irr-correct-motivo"
            error={fieldErrors.motivo?.[0]}
          >
            <Input
              id="irr-correct-motivo"
              placeholder="Ej. Medí mal el contador"
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
            />
          </FormField>
          {formError ? (
            <p role="alert" className="text-sm font-medium text-danger-600">
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
