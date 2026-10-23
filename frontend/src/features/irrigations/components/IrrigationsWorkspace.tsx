import { useState } from "react";
import { Droplets, SearchX } from "lucide-react";
import { Alert, Button, EmptyState, LoadingState } from "@/design-system/primitives";
import type { Irrigation } from "@/api/types";
import {
  CLEAR_FILTERS,
  EMPTY_FILTERED_HINT,
  EMPTY_FILTERED_TITLE,
  LOAD_ERROR,
  RETRY,
  pageCopy,
} from "../copy";
import { groupByDay } from "../utils";
import type { UseIrrigationFiltersResult } from "../hooks/useIrrigationFilters";
import type { IrrigationMutationsResult } from "../hooks/useIrrigationMutations";
import type { UseIrrigationsResult } from "../hooks/useIrrigations";
import { IrrigationAnnulDialog } from "./IrrigationAnnulDialog";
import { IrrigationCorrectDialog } from "./IrrigationCorrectDialog";
import { IrrigationCreateDialog } from "./IrrigationCreateDialog";
import { IrrigationDetail } from "./IrrigationDetail";
import { IrrigationFilters } from "./IrrigationFilters";
import { IrrigationHeader } from "./IrrigationHeader";
import { IrrigationLedger } from "./IrrigationLedger";
import { IrrigationSummaryCards } from "./IrrigationSummaryCards";

const PAGE_SIZE = 20;

export interface IrrigationsWorkspaceProps {
  isStaff: boolean;
  irrigations: UseIrrigationsResult;
  filters: UseIrrigationFiltersResult;
  mutations: IrrigationMutationsResult;
}

export function IrrigationsWorkspace({
  isStaff,
  irrigations,
  filters,
  mutations,
}: IrrigationsWorkspaceProps): React.JSX.Element {
  const copy = pageCopy(isStaff);
  const [selected, setSelected] = useState<Irrigation | null>(null);
  const [creating, setCreating] = useState(false);
  const [correcting, setCorrecting] = useState<Irrigation | null>(null);
  const [annulling, setAnnulling] = useState<Irrigation | null>(null);

  const filterKey = JSON.stringify(filters.filters);
  const [pager, setPager] = useState({ key: "", count: PAGE_SIZE });
  const visibleCount = pager.key === filterKey ? pager.count : PAGE_SIZE;
  const visibleItems = filters.filtered.slice(0, visibleCount);
  const visibleDays = groupByDay(visibleItems);
  const remaining = filters.filtered.length - visibleItems.length;

  function openCreate(): void {
    mutations.clearFieldErrors();
    setCreating(true);
  }

  function startCorrect(item: Irrigation): void {
    mutations.clearFieldErrors();
    setSelected(null);
    setCorrecting(item);
  }

  function startAnnul(item: Irrigation): void {
    mutations.clearFieldErrors();
    setSelected(null);
    setAnnulling(item);
  }

  return (
    <div className="mx-auto grid w-full max-w-[1360px] gap-6">
      <IrrigationHeader isStaff={isStaff} onCreate={openCreate} />

      {irrigations.loading ? (
        <LoadingState text="Cargando historial…" />
      ) : irrigations.error ? (
        <Alert
          tone="danger"
          title={LOAD_ERROR}
          action={
            <Button variant="outline" size="sm" onClick={() => void irrigations.reload()}>
              {RETRY}
            </Button>
          }
        >
          {irrigations.error}
        </Alert>
      ) : (
        <>
          <IrrigationSummaryCards summary={filters.summary} />

          <IrrigationFilters
            filters={filters.filters}
            counts={filters.counts}
            plots={irrigations.plots}
            isStaff={isStaff}
            hasFilters={filters.hasFilters}
            total={filters.total}
            onChange={filters.update}
            onReset={filters.reset}
          />

          {irrigations.items.length === 0 ? (
            <EmptyState
              title={copy.emptyTitle}
              description={copy.emptyHint}
              icon={<Droplets className="h-5 w-5" />}
              className="py-10"
              action={<Button onClick={openCreate}>{copy.cta}</Button>}
            />
          ) : filters.total === 0 ? (
            <EmptyState
              title={EMPTY_FILTERED_TITLE}
              description={EMPTY_FILTERED_HINT}
              icon={<SearchX className="h-5 w-5" />}
              className="py-10"
              action={
                <Button variant="outline" onClick={filters.reset}>
                  {CLEAR_FILTERS}
                </Button>
              }
            />
          ) : (
            <>
              <IrrigationLedger days={visibleDays} onOpen={setSelected} irrigations={irrigations.items} visibleIrrigations={visibleItems} />
              {remaining > 0 ? (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setPager({ key: filterKey, count: visibleCount + PAGE_SIZE })
                    }
                  >
                    Mostrar más ({remaining})
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </>
      )}

      {creating ? (
        <IrrigationCreateDialog
          open
          plots={irrigations.plots}
          busy={mutations.busy}
          fieldErrors={mutations.fieldErrors}
          onClose={() => setCreating(false)}
          onSubmit={mutations.create}
        />
      ) : null}

      {correcting ? (
        <IrrigationCorrectDialog
          item={correcting}
          busy={mutations.busy}
          fieldErrors={mutations.fieldErrors}
          onClose={() => setCorrecting(null)}
          onSubmit={mutations.correct}
        />
      ) : null}

      {annulling ? (
        <IrrigationAnnulDialog
          item={annulling}
          busy={mutations.busy}
          fieldErrors={mutations.fieldErrors}
          onClose={() => setAnnulling(null)}
          onSubmit={mutations.annul}
        />
      ) : null}

      <IrrigationDetail
        item={selected}
        items={filters.filtered}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        onOpenRelated={setSelected}
        onCorrect={startCorrect}
        onAnnul={startAnnul}
      />
    </div>
  );
}
