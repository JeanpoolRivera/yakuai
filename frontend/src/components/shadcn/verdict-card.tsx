import type { ReactNode } from "react";
import { Check, CloudSun, Droplet, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import { Card, CardContent } from "@/components/shadcn/card";
import { cn } from "@/lib/utils";

export type VerdictTone = "riega" | "no" | "espera" | "incompleta";

const VERDICT = {
  riega: { Icon: Droplet, card: "border-warning-100 bg-verdict-riega-bg" },
  no: { Icon: Check, card: "border-success-100 bg-verdict-no-bg" },
  espera: { Icon: CloudSun, card: "border-info-100 bg-verdict-espera-bg" },
  incompleta: { Icon: TriangleAlert, card: "border-neutral-300 bg-verdict-incompleta-bg" },
} as const;

export function VerdictCard({
  tone,
  kicker,
  title,
  amount,
  chips,
  action,
  children,
}: {
  tone: VerdictTone;
  kicker: string;
  title: string;
  amount?: string;
  chips: string[];
  action?: ReactNode;
  children?: ReactNode;
}): React.JSX.Element {
  const { Icon, card } = VERDICT[tone];
  return (
    <Card className={cn("verdict-panel", card)}>
      <CardContent className="grid gap-4 p-6">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/70 text-neutral-700">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-2xs font-semibold uppercase tracking-wider text-neutral-600">{kicker}</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-neutral-800">{title}</h2>
            {amount ? <p className="verdict-amount mt-1 text-2xl font-semibold tabular-nums text-neutral-800">{amount}</p> : null}
          </div>
        </div>
        {chips.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <Badge key={c} variant="secondary">{c}</Badge>
            ))}
          </div>
        ) : null}
        {children}
        {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
