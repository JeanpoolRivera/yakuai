import type { Ref } from "react";
import { Check, Share2 } from "lucide-react";
import type { Evaluation } from "@/api/types";
import { ageLabel, fmtNum } from "@/lib/format";
import { Button, Card, MetricCard } from "@/design-system/primitives";
import { EvidenceGrid } from "./EvidenceGrid";
import { IrrigationPlan } from "./IrrigationPlan";
import { VerdictDisplay } from "./VerdictDisplay";
import { humidityFromSnapshot } from "../utils";

export interface EvaluationReportProps {
  evaluation: Evaluation;
  plotName: string | null;
  showDeepLinks: boolean;
  showTechnical: boolean;
  titleRef?: Ref<HTMLHeadingElement>;
  sharing: boolean;
  confirming: boolean;
  onShare: () => void;
  onConfirm: () => void;
}

function metric(value: number | undefined, digits = 1, suffix = ""): string {
  return typeof value === "number" ? `${value.toFixed(digits)}${suffix}` : "—";
}

export function EvaluationReport({
  evaluation,
  plotName,
  showDeepLinks,
  showTechnical,
  titleRef,
  sharing,
  confirming,
  onShare,
  onConfirm,
}: EvaluationReportProps): React.JSX.Element {
  const snapshot = evaluation.inputs_snapshot;
  const { threshold } = humidityFromSnapshot(snapshot);

  const humidityPct = typeof snapshot.humedad_pct === "number" ? snapshot.humedad_pct.toFixed(1) : null;
  const laminaNet = typeof snapshot.lamina_neta_mm === "number" ? snapshot.lamina_neta_mm.toFixed(1) : null;
  const volumen = typeof snapshot.volumen_bruto_L === "number" ? `${fmtNum(snapshot.volumen_bruto_L)} L` : null;

  let balanceText: string;
  if (humidityPct !== null && threshold !== null && laminaNet !== null) {
    balanceText = `Con humedad ${humidityPct}% frente al umbral ${threshold.toFixed(0)}%, faltó reponer ${laminaNet} mm${volumen ? ` → ${volumen}` : ""}.`;
  } else if (laminaNet !== null) {
    balanceText = `Faltó reponer ${laminaNet} mm${volumen ? ` → ${volumen}` : ""}.`;
  } else {
    balanceText = "Con los datos registrados se estimó el déficit de agua.";
  }

  const groups = [
    {
      title: "Demanda del cultivo",
      items: [
        { label: "Etapa", value: evaluation.stage ?? "—", hint: "Del cultivo", info: "Fase de crecimiento del cultivo." },
        { label: "Kc", value: metric(snapshot.kc, 2), hint: "Coeficiente del cultivo", info: "Cuánta agua pide el cultivo en su etapa actual." },
        { label: "ET₀", value: metric(snapshot.et0_mm_dia, 1, " mm/d"), hint: "Hargreaves", info: "Agua que se evapora según el clima del día." },
        { label: "ETc", value: metric(snapshot.etc_mm_dia, 1, " mm/d"), hint: "Kc × ET₀", info: "ET₀ ajustada al cultivo." },
      ],
    },
    {
      title: "Agua a aplicar",
      items: [
        { label: "Lámina neta", value: metric(snapshot.lamina_neta_mm, 1, " mm"), hint: "A reponer", info: "Agua que falta reponer en el suelo." },
        { label: "Volumen bruto", value: typeof snapshot.volumen_bruto_L === "number" ? `${fmtNum(snapshot.volumen_bruto_L)} L` : "—", hint: "Para la parcela", info: "Agua total a aplicar, incluidas las pérdidas." },
      ],
    },
    {
      title: "Calidad del dato",
      items: [
        { label: "Confianza", value: evaluation.confidence ?? "No disponible", hint: "Datos recientes", info: "Qué tan completos y recientes son los datos disponibles." },
      ],
    },
  ];

  return (
    <Card className="overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
        <div>
          <p className="text-base font-semibold text-neutral-800">{plotName ?? `Parcela #${evaluation.plot_id}`}</p>
          <p className="text-xs text-neutral-600">Evaluada {ageLabel(evaluation.evaluated_at)}</p>
        </div>
        <Button variant="outline" onClick={onShare} loading={sharing}>
          <Share2 className="h-4 w-4" aria-hidden="true" />
          Compartir por WhatsApp
        </Button>
      </header>

      <VerdictDisplay evaluation={evaluation} showDeepLinks={showDeepLinks} titleRef={titleRef} />
      <EvidenceGrid evaluation={evaluation} showTechnical={showTechnical} className="border-t border-border p-6" />
      <IrrigationPlan evaluation={evaluation} />

      {evaluation.result === "riega" ? (
        <footer className="flex justify-end border-t border-border p-4">
          <Button onClick={onConfirm} loading={confirming}>
            <Check className="h-4 w-4" aria-hidden="true" />
            Ya regué
          </Button>
        </footer>
      ) : null}

      {showTechnical ? (
        <details className="border-t border-border px-6 py-4">
          <summary className="min-h-[var(--target-sm)] cursor-pointer py-2 text-sm font-medium text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            Consultar el cálculo y los datos utilizados
          </summary>
          <div className="mt-4 grid gap-5">
            <p className="max-w-prose text-sm leading-relaxed text-neutral-700">
              El cultivo pide <strong className="font-semibold">ETc</strong> (Kc × ET₀). {balanceText}
            </p>
            {groups.map((group) => (
              <section key={group.title} className="grid gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-600">{group.title}</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((item) => (
                    <MetricCard key={item.label} label={item.label} value={item.value} hint={item.hint} info={item.info} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </details>
      ) : null}
    </Card>
  );
}
