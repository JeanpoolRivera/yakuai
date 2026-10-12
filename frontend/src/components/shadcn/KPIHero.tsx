import { cn } from "@/lib/utils";

interface KPIHeroProps {
  value: string | number;
  label: string;
  sub?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  trend?: { value: number; label: string };
}

export function KPIHero({
  value,
  label,
  sub,
  icon,
  action,
  trend,
}: KPIHeroProps) {
  return (
    <div className="grid gap-3 rounded-xl border bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xs font-semibold uppercase tracking-wider text-primary-700">{label}</p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="mt-2">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold tabular-nums tracking-tight text-neutral-800">{value}</span>
          {icon && <span aria-hidden="true" className="text-neutral-500 self-end">{icon}</span>}
        </div>
        {sub && <p className="mt-1 text-sm text-neutral-600">{sub}</p>}
      </div>
      {trend && (
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <span className={cn(
            'font-semibold',
            trend.value >= 0 ? 'text-success-600' : 'text-danger-600'
          )}>
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
          <span className="text-neutral-500">{trend.label}</span>
        </div>
      )}
    </div>
  );
}