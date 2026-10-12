export type VerdictTone = "riega" | "no" | "espera" | "incompleta";

const VERDICT = {
  riega: { icon: "💧", card: "border-warning-100 bg-verdict-riega-bg" },
  no: { icon: "✅", card: "border-success-100 bg-verdict-no-bg" },
  espera: { icon: "☁️", card: "border-info-100 bg-verdict-espera-bg" },
  incompleta: { icon: "⚠️", card: "border-neutral-300 bg-verdict-incompleta-bg" },
} as const;

interface VerdictHeroProps {
  tone: VerdictTone;
  kicker: string;
  title: string;
  amount?: string;
  chips: string[];
  className?: string;
}

export function VerdictHero({
  tone,
  kicker,
  title,
  amount,
  chips,
  className,
}: VerdictHeroProps) {
  return (
    <div className={`rounded-xl border bg-white overflow-hidden ${className || ""}`}>
      <div className="grid gap-4 p-6">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/70 text-neutral-700">
            <span className="text-2xl" role="img" aria-hidden="true">
              {VERDICT[tone].icon}
            </span>
          </span>
          <div className="min-w-0">
            <p className="text-2xs font-semibold uppercase tracking-wider text-neutral-600">{kicker}</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-neutral-800">{title}</h2>
            {amount ? <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-800">{amount}</p> : null}
          </div>
        </div>
        {chips.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <span key={c} className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium text-neutral-700">{c}</span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}