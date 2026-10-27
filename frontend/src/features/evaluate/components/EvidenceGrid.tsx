import type { ReactNode } from "react";
import { CloudRain, Clock, Droplet } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtDateTime } from "@/lib/format";
import type { Evaluation } from "@/api/types";
import { SoilMoistureMeter } from "./SoilMoistureMeter";
import { humidityFromSnapshot, rainFromSnapshot } from "../utils";

function EvidenceCard({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="flex h-full flex-col gap-3 rounded-lg border border-border bg-white p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-600">
        <span className="text-brand">{icon}</span>
        {label}
      </div>
      {children}
    </div>
  );
}

export interface EvidenceGridProps {
  evaluation: Pick<Evaluation, "inputs_snapshot" | "next_at" | "result">;
  showTechnical?: boolean;
  className?: string;
}

export function EvidenceGrid({ evaluation, showTechnical = true, className }: EvidenceGridProps): React.JSX.Element {
  const { actual, threshold, pmp } = humidityFromSnapshot(evaluation.inputs_snapshot);
  const rain = rainFromSnapshot(evaluation.inputs_snapshot);
  const hasHumidity = actual !== null;
  const hasRain = rain.mm !== null;
  const hasNext = evaluation.next_at !== null;

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      <EvidenceCard icon={<Droplet className="h-4 w-4" aria-hidden="true" />} label="Humedad del suelo">
        <SoilMoistureMeter
          actual={hasHumidity ? actual : null}
          threshold={threshold}
          pmp={pmp}
          showTechnical={showTechnical}
        />
      </EvidenceCard>

      <EvidenceCard icon={<CloudRain className="h-4 w-4" aria-hidden="true" />} label="Lluvia · 6 h">
        <div className="flex flex-1 flex-col justify-between gap-3">
          <strong className="text-lg font-bold tracking-tight tabular-nums text-neutral-900">
            {hasRain ? `${rain.mm} mm` : "—"}
          </strong>
          <p className="text-xs text-neutral-600">
            {hasRain ? (rain.probability === null ? "Sin pronóstico" : `${rain.probability}% de probabilidad`) : "Sin datos"}
          </p>
        </div>
      </EvidenceCard>

      <EvidenceCard icon={<Clock className="h-4 w-4" aria-hidden="true" />} label="Próxima revisión">
        <div className="flex flex-1 flex-col justify-between gap-3">
          <strong className="text-lg font-bold tracking-tight text-neutral-900">
            {hasNext ? fmtDateTime(evaluation.next_at) : "—"}
          </strong>
          <p className="text-xs text-neutral-600">{hasNext ? "Programada" : "Sin programar"}</p>
        </div>
      </EvidenceCard>
    </div>
  );
}
