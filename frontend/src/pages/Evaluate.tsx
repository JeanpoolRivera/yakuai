/* Evaluar riego: elige parcela → veredicto idempotente + historial + WhatsApp. */
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../app/auth";
import { EvaluationWorkspace } from "../features/evaluate/components";
import { useEvaluation, useHistory, useIrrigationConfirm, usePlots } from "../features/evaluate/hooks";

export function Evaluate(): React.JSX.Element {
  const { role } = useAuth();
  const isStaff = role === "tecnico" || role === "admin";
  const location = useLocation();
  const requestedPlotId = useMemo(() => {
    const state = location.state as { plotId?: unknown } | null;
    return typeof state?.plotId === "number" ? state.plotId : null;
  }, [location.state]);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const plots = usePlots(requestedPlotId);
  const history = useHistory(plots.plotId);
  const evaluation = useEvaluation();
  const irrigation = useIrrigationConfirm(evaluation.current);

  const { plotId, setPlotId } = plots;
  const { current, busy, reset, evaluate } = evaluation;
  const { reload: reloadHistory } = history;

  useEffect(() => {
    if (current && !busy) titleRef.current?.focus();
  }, [current, busy]);

  const select = useCallback((id: number) => {
    if (id === plotId) return;
    setPlotId(id);
    reset();
  }, [plotId, setPlotId, reset]);

  const run = useCallback(async () => {
    if (plotId === null) return;
    await evaluate(plotId);
    reloadHistory();
  }, [plotId, evaluate, reloadHistory]);

  return (
    <EvaluationWorkspace
      plots={plots}
      history={history}
      evaluation={evaluation}
      irrigation={irrigation}
      isStaff={isStaff}
      titleRef={titleRef}
      onSelect={select}
      onEvaluate={() => void run()}
    />
  );
}
