import { Button } from "./button";
import { Droplet } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyBriefProps {
  piden: number;
  onEvaluate: () => void;
  refreshing?: boolean;
}

export function DailyBrief({ piden, onEvaluate, refreshing }: DailyBriefProps) {
  const alert = piden > 0;

  return (
    <header
      className={cn(
        "flex flex-wrap items-center gap-4 rounded-lg border p-4 sm:p-5",
        alert ? "border-primary-800 bg-primary-900 text-white" : "border-success-100 bg-white"
      )}
    >
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-2xs font-semibold uppercase tracking-wider",
            alert ? "text-dark-accent" : "text-primary-700"
          )}
        >
          Tu jornada
        </p>
        <h1 className={cn("mt-1 text-2xl font-semibold tracking-tight", alert ? "text-white" : "text-neutral-800")}>
          {piden > 0 ? `${piden} ${piden === 1 ? "parcela pide agua" : "parcelas piden agua"} hoy` : "Nada urgente por ahora"}
        </h1>
        <p className={cn("mt-1 text-sm", alert ? "text-dark-muted" : "text-neutral-600")}>
          {piden > 0
            ? "Riega en la ventana 05:30–07:00 para perder menos agua."
            : "Consulta las últimas evaluaciones y revisa de nuevo cuando el sistema lo indique."}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="lg" variant={alert ? "secondary" : "default"} asChild>
            <a href="/evaluar">
              Evaluar riego <span aria-hidden="true"><svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></span>
            </a>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void onEvaluate()}
            disabled={refreshing}
            className={cn(alert ? "border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white" : undefined)}
          >
            {refreshing ? (
              <>
                <span className="h-[15px] w-[15px] animate-spin" aria-hidden="true" />
                Actualizando…
              </>
            ) : (
              <>
                <svg className="h-[15px] w-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4" /></svg>
                Actualizar
              </>
            )}
          </Button>
        </div>
      </div>
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm",
          alert ? "bg-white/10" : "bg-neutral-100"
        )}
      >
        <Droplet className={cn("h-5 w-5", alert ? "text-dark-accent" : "text-primary-700")} aria-hidden="true" />
        <div>
          <span className={cn("block text-xs", alert ? "text-dark-muted" : "text-neutral-500")}>Ventana de riego</span>
          <strong className={cn("font-semibold tabular-nums", alert ? "text-white" : "text-neutral-800")}>
            05:30 – 07:00
          </strong>
        </div>
      </div>
    </header>
  );
}