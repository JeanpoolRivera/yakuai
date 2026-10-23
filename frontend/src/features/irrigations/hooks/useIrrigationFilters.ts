import { useCallback, useMemo, useState } from "react";
import type { Irrigation } from "@/api/types";
import {
  EMPTY_FILTERS,
  countByStatus,
  filterIrrigations,
  groupByDay,
  hasActiveFilters,
  summarize,
} from "../utils";
import type {
  IrrigationDay,
  IrrigationFilters,
  IrrigationSummary,
  StatusCounts,
} from "../utils";

export interface UseIrrigationFiltersResult {
  filters: IrrigationFilters;
  update: (patch: Partial<IrrigationFilters>) => void;
  reset: () => void;
  filtered: Irrigation[];
  summary: IrrigationSummary;
  counts: StatusCounts;
  days: IrrigationDay[];
  hasFilters: boolean;
  total: number;
}

export function useIrrigationFilters(items: Irrigation[]): UseIrrigationFiltersResult {
  const [filters, setFilters] = useState<IrrigationFilters>(EMPTY_FILTERS);

  const update = useCallback((patch: Partial<IrrigationFilters>) => {
    setFilters((previous) => ({ ...previous, ...patch }));
  }, []);

  const reset = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const filtered = useMemo(() => filterIrrigations(items, filters), [items, filters]);
  const contextual = useMemo(
    () => filterIrrigations(items, { ...filters, status: "todos" }),
    [items, filters],
  );
  const summary = useMemo(() => summarize(contextual), [contextual]);
  const counts = useMemo(() => countByStatus(contextual), [contextual]);
  const days = useMemo(() => groupByDay(filtered), [filtered]);
  const hasFilters = hasActiveFilters(filters);

  return {
    filters,
    update,
    reset,
    filtered,
    summary,
    counts,
    days,
    hasFilters,
    total: filtered.length,
  };
}
