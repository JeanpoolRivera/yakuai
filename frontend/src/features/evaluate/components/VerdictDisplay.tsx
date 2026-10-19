import type { Ref } from "react";
import { Link } from "react-router-dom";
import { Check, CloudSun, Droplet, TriangleAlert } from "lucide-react";
import type { EvalResult, Evaluation } from "@/api/types";
import { cn } from "@/lib/utils";
import { fmtNum, reasonLabel } from "@/lib/format";
import { Badge, Button } from "@/design-system/primitives";
import { FARMER_CONTACT_COPY, INCOMPLETE_FALLBACK, INCOMPLETE_HELP, verdictTitle } from "../copy";

const TONE: Record<EvalResult, { bg: string; fg: string; Icon: typeof Droplet }> = {
  riega: { bg: "bg-verdict-riega-bg", fg: "text-verdict-riega-text", Icon: Droplet },
  no: { bg: "bg-verdict-no-bg", fg: "text-verdict-no-text", Icon: Check },
  espera: { bg: "bg-verdict-espera-bg", fg: "text-verdict-espera-text", Icon: CloudSun },
  incompleta: { bg: "bg-verdict-incompleta-bg", fg: "text-verdict-incompleta-text", Icon: TriangleAlert },
};

export interface VerdictDisplayProps {
  evaluation: Evaluation;
  showDeepLinks?: boolean;
  titleRef?: Ref<HTMLHeadingElement>;
  className?: string;
}

export function VerdictDisplay({ evaluation, showDeepLinks = false, titleRef, className }: VerdictDisplayProps): React.JSX.Element {
  const tone = TONE[evaluation.result];
  const Icon = tone.Icon;
  const help = INCOMPLETE_HELP[evaluation.reason] ?? null;
  const hasVolume = evaluation.result === "riega" && evaluation.min_liters !== null && evaluation.max_liters !== null;

  return (
    <div className={cn("grid gap-5 p-6 sm:p-8", tone.bg, className)}>
      <div className="flex flex-wrap items-center gap-3">
        <span aria-hidden="true" className={cn("grid h-13 w-13 place-items-center rounded-lg bg-white/75", tone.fg)}>
          <Icon className="h-7 w-7" />
        </span>
        {evaluation.is_critical ? (
          <Badge tone="danger" dot>
            Prioridad alta
          </Badge>
        ) : null}
      </div>

      <div className="grid gap-1.5">
        <h2 ref={titleRef} tabIndex={-1} className={cn("text-d1 font-bold leading-tight tracking-tight", tone.fg)}>
          {verdictTitle(evaluation)}
        </h2>
        <p className="max-w-prose text-sm text-neutral-700">{reasonLabel(evaluation.reason)}</p>
      </div>

      {hasVolume ? (
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <strong className="text-d2 font-bold tracking-tight tabular-nums text-neutral-900">
            {fmtNum(evaluation.min_liters)}–{fmtNum(evaluation.max_liters)}
          </strong>
          <span className="text-lg font-medium text-neutral-700">litros</span>
          <span className="text-sm text-neutral-700">Volumen para esta parcela</span>
        </p>
      ) : null}

      {evaluation.result === "incompleta" ? (
        <div className="grid gap-3">
          <p className="max-w-prose text-sm text-neutral-700">
            {showDeepLinks ? (help?.text ?? INCOMPLETE_FALLBACK) : FARMER_CONTACT_COPY}
          </p>
          {help && showDeepLinks ? (
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link to={help.to} state={{ plotId: evaluation.plot_id }}>
                  {help.action}
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
