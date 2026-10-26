import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface KPIProps {
  value: string | number;
  label: string;
  sub?: string;
  icon?: React.ReactNode;
  to?: string;
  className?: string;
}

export function KPI({
  value,
  label,
  sub,
  icon,
  to,
  className,
}: KPIProps) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-neutral-700">{label}</span>
        {icon ? <span aria-hidden="true" className="text-neutral-500">{icon}</span> : null}
      </div>
      <div className="mt-1 block text-2xl font-semibold tabular-nums tracking-tight text-neutral-900">
        {value}
      </div>
      {sub ? <span className="mt-1 block text-xs text-neutral-500">{sub}</span> : null}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          "block rounded-xl border border-neutral-200 bg-white p-4 shadow-card transition-shadow hover:border-primary-300 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/20 focus-visible:ring-offset-2 sm:p-5",
          className
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={cn("rounded-xl border border-neutral-200 bg-white p-4 shadow-card sm:p-5", className)}>
      {content}
    </div>
  );
}
export const MetricCard = KPI;
