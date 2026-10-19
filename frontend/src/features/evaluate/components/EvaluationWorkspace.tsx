import { useState, type Ref } from "react";
import { Clock } from "lucide-react";
import { Alert, Button, Card, LoadingState } from "@/design-system/primitives";
import { EvaluateHeader } from "./EvaluateHeader";
import { EvaluationHistory } from "./EvaluationHistory";
import { EvaluationReport } from "./EvaluationReport";
import { PlotSelector } from "./PlotSelector";
import { ReadyToEvaluate } from "./ReadyToEvaluate";
import type { UseEvaluationResult } from "../hooks/useEvaluation";
import type { UseHistoryResult } from "../hooks/useHistory";
import type { UseIrrigationConfirmResult } from "../hooks/useIrrigationConfirm";
import type { UsePlotsResult } from "../hooks/usePlots";

export interface EvaluationWorkspaceProps {
  plots: UsePlotsResult;
  history: UseHistoryResult;
  evaluation: UseEvaluationResult;
  irrigation: UseIrrigationConfirmResult;
  isStaff: boolean;
  titleRef: Ref<HTMLHeadingElement>;
  onSelect: (id: number) => void;
  onEvaluate: () => void;
}

export function EvaluationWorkspace({
  plots,
  history,
  evaluation,
  irrigation,
  isStaff,
  titleRef,
  onSelect,
  onEvaluate,
}: EvaluationWorkspaceProps): React.JSX.Element {
  const { current, busy, sharing } = evaluation;
  const { confirming } = irrigation;
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="mx-auto grid w-full max-w-[1360px] gap-6">
      <EvaluateHeader />

      {plots.loading ? (
        <LoadingState text="Cargando parcelas…" />
      ) : plots.error ? (
        <Alert
          tone="danger"
          title="No se pudieron cargar las parcelas"
          action={
            <Button variant="outline" onClick={plots.reload}>
              Reintentar
            </Button>
          }
        >
          {plots.error}
        </Alert>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
          <PlotSelector
            plots={plots.plots}
            selectedId={plots.plotId}
            onSelect={onSelect}
            onEvaluate={onEvaluate}
            evaluating={busy}
            disabled={busy || confirming}
            showFarmerBadge={isStaff}
          />
          <div className="grid min-w-0 gap-6">
            {busy ? (
              <Card>
                <LoadingState text="Analizando suelo, cultivo y clima…" />
              </Card>
            ) : !current ? (
              <ReadyToEvaluate plotName={plots.plot?.name ?? null} />
            ) : (
              <section aria-live="polite" aria-label="Resultado">
                <EvaluationReport
                  evaluation={current}
                  plotName={plots.plot?.name ?? null}
                  showDeepLinks={isStaff}
                  showTechnical={isStaff}
                  titleRef={titleRef}
                  sharing={sharing}
                  confirming={confirming}
                  onShare={() => void evaluation.share()}
                  onConfirm={() => void irrigation.confirm()}
                />
              </section>
            )}

            {plots.plotId !== null ? (
              <div className="grid gap-3">
                <Button
                  variant="outline"
                  aria-expanded={showHistory}
                  onClick={() => setShowHistory((value) => !value)}
                >
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  {showHistory ? "Ocultar historial" : "Ver historial"}
                </Button>
                {showHistory ? (
                  <EvaluationHistory
                    history={history.history}
                    loading={history.loading}
                    error={history.error}
                    plotName={plots.plot?.name ?? null}
                    onRetry={history.reload}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
