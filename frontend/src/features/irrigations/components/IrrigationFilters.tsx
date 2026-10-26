import { useState } from "react";
import { ChevronDown, FilterX, SlidersHorizontal } from "lucide-react";
import { Button, Card, SearchInput } from "@/design-system/primitives";
import { cn } from "@/lib/utils";
import type { Plot } from "@/api/types";
import {
  CLEAR_FILTERS,
  DATE_LABEL,
  FEWER_FILTERS,
  FILTER_GROUP_LABEL,
  MORE_FILTERS,
  PERIOD_LABEL,
  RESULTS_LABEL,
  STATUS_FILTER_LABEL,
  STATUS_ORDER,
  pageCopy,
} from "../copy";
import type {
  IrrigationFilters as IrrigationFilterState,
  PeriodFilter,
  StatusFilter,
  StatusCounts,
} from "../utils";

const PERIOD_ORDER: PeriodFilter[] = ["7d", "30d", "todo"];

const tabClass = (active: boolean): string =>
  cn(
    "inline-flex min-h-[var(--target-sm)] items-center gap-2 rounded-full px-3 text-xs font-semibold transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
    active
      ? "bg-brand-soft text-brand"
      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
  );

const selectClass =
  "h-[var(--target-sm)] appearance-none rounded-md border border-border-strong bg-white px-3 pr-10 text-sm text-neutral-800 transition-colors focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

const labelClass = "sr-only";

export interface IrrigationFiltersProps {
  filters: IrrigationFilterState;
  counts: StatusCounts;
  plots: Plot[];
  isStaff: boolean;
  hasFilters: boolean;
  total: number;
  onChange: (patch: Partial<IrrigationFilterState>) => void;
  onReset: () => void;
}

export function IrrigationFilters({
  filters,
  counts,
  plots,
  isStaff,
  hasFilters,
  total,
  onChange,
  onReset,
}: IrrigationFiltersProps): React.JSX.Element {
  const copy = pageCopy(isStaff);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const advancedCount = filters.from !== null || filters.to !== null ? 1 : 0;
  const visibleStatuses = STATUS_ORDER.filter(
    (status) => status === "todos" || counts[status] > 0,
  );

  function handleReset(): void {
    setAdvancedOpen(false);
    onReset();
  }

  return (
    <Card className="p-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center">
        <SearchInput
          value={filters.query}
          onChange={(query) => onChange({ query })}
          label="Buscar riegos"
          placeholder={copy.searchPlaceholder}
          className="w-full sm:w-[280px]"
        />

        <div
          role="group"
          aria-label={FILTER_GROUP_LABEL.status}
          className="flex flex-wrap items-center gap-1.5"
        >
          {visibleStatuses.map((status) => {
            const active = filters.status === status;
            return (
              <button
                key={status}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ status: status as StatusFilter })}
                className={tabClass(active)}
              >
                {STATUS_FILTER_LABEL[status]}
                <span
                  className={cn(
                    "text-[11px] tabular-nums",
                    active ? "text-brand" : "text-neutral-500",
                  )}
                >
                  {counts[status]}
                </span>
              </button>
            );
          })}
        </div>

        <div
          role="group"
          aria-label={FILTER_GROUP_LABEL.period}
          className="flex flex-wrap items-center gap-1.5"
        >
          {PERIOD_ORDER.map((period) => {
            const active = filters.period === period;
            return (
              <button
                key={period}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ period, from: null, to: null })}
                className={tabClass(active)}
              >
                {PERIOD_LABEL[period]}
              </button>
            );
          })}
        </div>

        {isStaff ? (
          <div className="relative">
            <label htmlFor="plot-select" className={labelClass}>
              Parcela
            </label>
            <select
              id="plot-select"
              value={filters.plotId ?? ""}
              onChange={(event) =>
                onChange({ plotId: event.target.value === "" ? null : Number(event.target.value) })
              }
              className={cn(selectClass, "min-w-[180px]")}
            >
              <option value="">Todas las parcelas</option>
              {plots.map((plot) => (
                <option key={plot.id} value={plot.id}>
                  {plot.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none"
              aria-hidden="true"
            />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
          <span aria-live="polite" className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-neutral-600 bg-neutral-100")}>
            {total} {RESULTS_LABEL}
          </span>
          <Button
            variant="outline"
            size="sm"
            aria-expanded={advancedOpen}
            onClick={() => setAdvancedOpen((value) => !value)}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            {advancedOpen ? FEWER_FILTERS : MORE_FILTERS}
            {advancedCount > 0 ? (
              <span className="rounded-full bg-brand-soft px-1.5 text-[11px] font-bold tabular-nums text-brand">
                {advancedCount}
              </span>
            ) : null}
          </Button>
          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <FilterX className="h-4 w-4" aria-hidden="true" />
              {CLEAR_FILTERS}
            </Button>
          ) : null}
        </div>
      </div>

      {advancedOpen ? (
        <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-border pt-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-600">{DATE_LABEL.from}</span>
            <input
              type="date"
              lang="es-PE"
              value={filters.from ?? ""}
              max={filters.to ?? undefined}
              onChange={(event) => onChange({ from: event.target.value || null, period: "todo" })}
              className={selectClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-600">{DATE_LABEL.to}</span>
            <input
              type="date"
              lang="es-PE"
              value={filters.to ?? ""}
              min={filters.from ?? undefined}
              onChange={(event) => onChange({ to: event.target.value || null, period: "todo" })}
              className={selectClass}
            />
          </label>
        </div>
      ) : null}
    </Card>
  );
}
