import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHead({
  eyebrow,
  title,
  desc,
  actions,
  crumbs,
  className,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  actions?: ReactNode;
  crumbs?: string;
  className?: string;
}): React.JSX.Element {
  return (
    <header className={cn("page-heading flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0 flex-1">
        {crumbs ? <p className="sr-only">{crumbs}</p> : null}
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-700">{eyebrow}</p>
        <h1 className="mt-2 text-[clamp(1.75rem,1.45rem+1.2vw,2.5rem)] font-semibold leading-tight tracking-tight text-neutral-900">{title}</h1>
        {desc ? <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-neutral-700">{desc}</p> : null}
      </div>
      {actions ? <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">{actions}</div> : null}
    </header>
  );
}
