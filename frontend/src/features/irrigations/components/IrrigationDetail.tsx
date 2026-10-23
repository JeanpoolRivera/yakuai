import { Ban, PencilLine } from "lucide-react";
import {
  Badge,
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/design-system/primitives";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { fmtDate, fmtNum } from "@/lib/format";
import type { Irrigation } from "@/api/types";
import { AUDIT_NOTE, COMPARE, deviationLabel, deviationTone, originLabel, statusLabel } from "../copy";
import {
  appliedLiters,
  buildComparisonData,
  deviationFor,
  deviationLevel,
  isActionable,
  plotName,
  recommendedLiters,
  timeLabel,
} from "../utils";

export interface IrrigationDetailProps {
  item: Irrigation | null;
  items: Irrigation[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenRelated: (item: Irrigation) => void;
  onCorrect: (item: Irrigation) => void;
  onAnnul: (item: Irrigation) => void;
}

const metricLabel = "text-[10.5px] font-bold uppercase tracking-wide text-neutral-600";
const sectionLabel = "text-[11px] font-semibold uppercase tracking-wide text-neutral-600";

export function IrrigationDetail({
  item,
  items,
  open,
  onOpenChange,
  onOpenRelated,
  onCorrect,
  onAnnul,
}: IrrigationDetailProps): React.JSX.Element | null {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  if (!item) return null;

  const applied = appliedLiters(item);
  const recommended = recommendedLiters(item);
  const deviation = deviationFor(item);
  const level = deviationLevel(item);
  const comparison = buildComparisonData(items, item, onOpenRelated);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={isDesktop ? "sm:w-[27rem]" : undefined}
      >
        <SheetHeader>
          <p className="text-[11px] font-semibold uppercase tracking-[.1em] text-brand">
            {item.status !== "activo" || item.supersedes_id !== null
              ? `Registro #${item.id} · ${originLabel(item.origin)}`
              : originLabel(item.origin)}
          </p>
          <SheetTitle className="text-d3 font-bold tracking-tight text-neutral-900">
            {plotName(item)}
          </SheetTitle>
          <SheetDescription>
            {fmtDate(item.occurred_at)} · {timeLabel(item.occurred_at)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            tone={item.status === "activo" ? "success" : item.status === "anulado" ? "danger" : "neutral"}
            dot
          >
            {statusLabel(item.status)}
          </Badge>
          <Badge tone={deviationTone(level)} dot>
            {deviationLabel(level)}
          </Badge>
        </div>

        <div className="grid gap-4 rounded-lg border border-border bg-neutral-50 p-4">
          <div>
            <p className={metricLabel}>Agua aplicada</p>
            <p className="text-d2 mt-1 font-bold leading-none tracking-tight tabular-nums text-neutral-900">
              {fmtNum(applied)}{" "}
              <span className="text-sm font-semibold text-neutral-600">L</span>
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-4 border-t border-border pt-4">
            <div>
              <dt className={metricLabel}>Agua recomendada</dt>
              <dd className="mt-1 text-sm font-semibold tabular-nums text-neutral-800">
                {recommended === null ? "Sin recomendación" : `${fmtNum(recommended)} L`}
              </dd>
            </div>
            <div>
              <dt className={metricLabel}>Diferencia</dt>
              <dd className="mt-1 text-sm font-semibold tabular-nums text-neutral-800">
                {deviation === null
                  ? "—"
                  : deviation === 0
                    ? "Sin diferencia"
                    : `${fmtNum(Math.abs(deviation))} L ${
                        deviation > 0 ? "por encima" : "por debajo"
                      }`}
              </dd>
            </div>
          </dl>
        </div>

        {item.note ? (
          <section className="rounded-lg border border-border bg-white p-3">
            <p className={sectionLabel}>
              {item.status === "anulado" ? AUDIT_NOTE.voided : AUDIT_NOTE.active}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-700">{item.note}</p>
          </section>
        ) : null}

        {comparison ? (
          <section className="rounded-lg border border-border bg-white p-3">
            <p className={sectionLabel}>{COMPARE.title}</p>
            <p className="mt-1.5 text-sm text-neutral-700">
              {comparison.labelBefore === "Antes"
                ? `${COMPARE.supersedesPrefix} ${comparison.dateBefore}`
                : `${COMPARE.supersededPrefix} ${comparison.dateAfter}`}
            </p>
            <dl className="mt-3 grid gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <dt className={metricLabel}>{COMPARE.applied}</dt>
                <dd className="text-sm font-semibold tabular-nums text-neutral-800">
                  {fmtNum(comparison.applied.before)} L
                  <span className="mx-1.5 font-normal text-neutral-400" aria-hidden="true">
                    →
                  </span>
                  <span className="text-neutral-900">{fmtNum(comparison.applied.after)} L</span>
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className={metricLabel}>{COMPARE.recommended}</dt>
                <dd className="text-sm font-semibold tabular-nums text-neutral-800">
                  {comparison.recommended.before === null ? "—" : `${fmtNum(comparison.recommended.before)} L`}
                  <span className="mx-1.5 font-normal text-neutral-400" aria-hidden="true">
                    →
                  </span>
                  <span className="text-neutral-900">
                    {comparison.recommended.after === null
                      ? "Sin recomendación"
                      : `${fmtNum(comparison.recommended.after)} L`}
                  </span>
                </dd>
              </div>
            </dl>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 justify-start"
              onClick={comparison.openAction}
            >
              {comparison.openLabel}
            </Button>
          </section>
        ) : null}

        <SheetFooter className="border-t border-border pt-4">
          {isActionable(item) ? (
            <>
              <Button
                variant="outline"
                className="text-danger-fg hover:bg-danger-bg hover:text-danger-fg"
                onClick={() => onAnnul(item)}
              >
                <Ban className="h-4 w-4" aria-hidden="true" />
                Anular
              </Button>
              <Button onClick={() => onCorrect(item)}>
                <PencilLine className="h-4 w-4" aria-hidden="true" />
                Corregir
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}