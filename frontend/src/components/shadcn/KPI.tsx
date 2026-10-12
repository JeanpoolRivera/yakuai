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
        <span className="text-sm text-neutral-600">{label}</span>
        {icon ? <span aria-hidden="true" className="text-neutral-500">{icon}</span> : null}
      </div>
      <div className="mt-1 block text-2xl font-semibold tabular-nums tracking-tight text-neutral-800">
        {value}
      </div>
      {sub ? <span className="mt-1 block text-xs text-neutral-500">{sub}</span> : null}
    </>
  );

  if (to) {
    return (
      <a
        href={to}
        className={cn(
          "block rounded-lg border border-neutral-200 bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover",
          className
        )}
      >
        {content}
      </a>
    );
  }

  return (
    <div className={cn("rounded-lg border border-neutral-200 bg-white p-4 shadow-card", className)}>
      {content}
    </div>
  );
}