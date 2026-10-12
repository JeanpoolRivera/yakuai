import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

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
  ok: "border-success-100 bg-success-50",
  warn: "border-warning-100 bg-warning-50",
  bad: "border-danger-100 bg-danger-50",
  info: "border-info-100 bg-info-50",
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
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-neutral-600">{label}</span>
        {icon ? <span aria-hidden="true" className="text-neutral-500">{icon}</span> : null}
      </div>
      <div className="mt-3 block font-display text-3xl font-semibold tabular-nums tracking-tight text-neutral-800">{value}</div>
      {sub ? <span className="mt-1 block text-xs text-neutral-500">{sub}</span> : null}
    </>
  );
  const style = cn("stat-card block rounded-lg border p-5 shadow-card", toneClass, className);
  return to ? <Link to={to} className={cn(style, "transition-shadow hover:shadow-card-hover")}>{content}</Link> : <div className={style}>{content}</div>;
}
