import type { Evaluation } from "@/api/types";
import { Alert, Button, Card, LoadingState } from "@/design-system/primitives";
import { HistoryTimeline } from "./HistoryTimeline";

export interface EvaluationHistoryProps {
  history: Evaluation[];
  loading: boolean;
  error: string | null;
  plotName: string | null;
  onRetry: () => void;
}

export function EvaluationHistory({
  history,
  loading,
  error,
  plotName,
  onRetry,
}: EvaluationHistoryProps): React.JSX.Element {
  return (
    <Card className="p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-800">Evaluaciones anteriores</h2>
          <p className="text-xs text-neutral-600">{plotName ?? "Parcela"} · Últimos 20 resultados</p>
        </div>
        {loading ? <LoadingState text="Cargando historial…" className="py-0" /> : null}
      </header>

      {error ? (
        <Alert
          tone="danger"
          title="No se pudo cargar el historial"
          action={
            <Button variant="outline" onClick={onRetry}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      ) : loading ? null : (
        <HistoryTimeline items={history} />
      )}
    </Card>
  );
}
