import { cn } from "@/lib/utils";

interface StatProps {
  value: string | number;
  label: string;
  sub?: string;
  tone?: "ok" | "warn" | "bad" | "info";
  icon?: React.ReactNode;
  to?: string;
  className?: string;
}

const TONE_CLASSES = {
  ok: "border-success-200 bg-success-50",
  warn: "border-warning-200 bg-warning-50",
  bad: "border-danger-200 bg-danger-50",
  info: "border-info-200 bg-info-50",
} as const;

export function Stat({
  value,
  label,
  sub,
  tone,
  icon,
  to,
  className,
}: StatProps) {
  const toneClass = tone ? TONE_CLASSES[tone] : "border-neutral-200 bg-white";
  if (to) {
    return (
      <a
        href={to}
        className={cn(
          "block rounded-lg p-4 shadow-card transition-shadow hover:shadow-card-hover",
          toneClass,
          className
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-neutral-600">{to}</span>
        </div>
        <div className="mt-1 block text-2xl font-semibold tabular-nums tracking-tight text-neutral-800">{value}</div>
        <p className="mt-1 text-sm text-neutral-600">{label}</p>
      </a>
    );
  }

  return (
    <div className={cn("rounded-lg p-4 shadow-card", toneClass)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-neutral-600">{label}</span>
        {icon ? <span aria-hidden="true" className="text-neutral-500">{icon}</span> : null}
      </div>
      <div className="mt-1 block text-2xl font-semibold tabular-nums tracking-tight text-neutral-800">{value}</div>
      {sub ? <span className="mt-1 block text-xs text-neutral-500">{sub}</span> : null}
    </div>
  );
}