import { useState } from "react";
import type { FormEvent } from "react";
import { Alert, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/design-system/primitives";
import { FormField } from "@/components/forms/FormField";
import { GuardedInput } from "@/components/forms/GuardedInput";
import { localInputToIso, nowLocalInput } from "@/lib/format";
import type { IrrigationInput } from "@/api/endpoints";
import type { Plot } from "@/api/types";
import { NO_PLOTS, FORM_HINT, FORM_TITLE } from "../copy";

const SELECT_CLS =
  "min-h-[var(--target-sm)] w-full rounded-sm border border-border-strong bg-white px-3 text-sm text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

export interface IrrigationCreateDialogProps {
  open: boolean;
  plots: Plot[];
  busy: boolean;
  fieldErrors: Record<string, string[]>;
  onClose: () => void;
  onSubmit: (input: IrrigationInput) => Promise<boolean>;
}

export function IrrigationCreateDialog({
  open,
  plots,
  busy,
  fieldErrors,
  onClose,
  onSubmit,
}: IrrigationCreateDialogProps): React.JSX.Element {
  const [plotId, setPlotId] = useState(() => (plots[0] ? String(plots[0].id) : ""));
  const [occurredAt, setOccurredAt] = useState(nowLocalInput);
  const [applied, setApplied] = useState("");
  const [recommended, setRecommended] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    const appliedValue = Number(applied);
    const recommendedValue = recommended.trim() === "" ? null : Number(recommended);
    const occurredTimestamp = occurredAt ? new Date(occurredAt).getTime() : Number.NaN;
    if (!plotId || !Number.isFinite(occurredTimestamp) || occurredTimestamp > Date.now() || !Number.isFinite(appliedValue) || appliedValue <= 0 || appliedValue > 99999999.99 || Math.round(appliedValue * 100) !== appliedValue * 100) {
      setFormError("Completa parcela y fecha; los litros deben ser mayores que 0 (máx. 2 decimales).");
      return;
    }
    if (recommendedValue !== null && (!Number.isFinite(recommendedValue) || recommendedValue < 0 || recommendedValue > 99999999.99 || Math.round(recommendedValue * 100) !== recommendedValue * 100)) {
      setFormError("Litros recomendados: 0–99 999 999,99 (máx. 2 decimales).");
      return;
    }
    setFormError(null);
    const ok = await onSubmit({
      plot_id: Number(plotId),
      occurred_at: localInputToIso(occurredAt),
      applied_liters: appliedValue,
      recommended_liters: recommendedValue,
      note: note.trim() || undefined,
    });
    if (ok) onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{FORM_TITLE.create}</DialogTitle>
          <DialogDescription>{FORM_HINT.create}</DialogDescription>
        </DialogHeader>

        {plots.length === 0 ? (
          <Alert tone="warning" title="Sin parcelas disponibles">
            {NO_PLOTS}
          </Alert>
        ) : null}

        <form id="irrigation-create-form" noValidate onSubmit={(event) => void handleSubmit(event)} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Parcela" required htmlFor="irr-plot" error={fieldErrors.plot_id?.[0]}>
              <select
                id="irr-plot"
                className={SELECT_CLS}
                value={plotId}
                onChange={(event) => setPlotId(event.target.value)}
              >
                <option value="">Selecciona…</option>
                {plots.map((plot) => (
                  <option key={plot.id} value={plot.id}>
                    {plot.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Fecha del riego" required htmlFor="irr-at" error={fieldErrors.occurred_at?.[0]}>
              <Input
                id="irr-at"
                type="datetime-local"
                required
                max={nowLocalInput()}
                value={occurredAt}
                onChange={(event) => setOccurredAt(event.target.value)}
              />
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Agua aplicada (L)" required htmlFor="irr-applied" error={fieldErrors.applied_liters?.[0]}>
              <GuardedInput id="irr-applied" guardMode="decimal" maxDecimals={2} required placeholder="Ej. 4800" value={applied} onValueChange={setApplied} />
            </FormField>
            <FormField
              label="Agua recomendada (L, opcional)"
              hint="Si la tienes, la comparamos con el agua aplicada."
              htmlFor="irr-recommended"
              error={fieldErrors.recommended_liters?.[0]}
            >
              <GuardedInput id="irr-recommended" guardMode="decimal" maxDecimals={2} placeholder="Ej. 4650" value={recommended} onValueChange={setRecommended} />
            </FormField>
          </div>
          <FormField label="Nota (opcional)" htmlFor="irr-note" error={fieldErrors.note?.[0]}>
            <GuardedInput id="irr-note" guardMode="text" maxLength={255} placeholder="Ej. Riego de prueba" value={note} onValueChange={setNote} />
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
          <Button type="submit" form="irrigation-create-form" loading={busy} disabled={plots.length === 0}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}









