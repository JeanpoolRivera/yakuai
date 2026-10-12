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
    <header className={cn("page-heading flex flex-wrap items-end justify-between gap-4 pb-6", className)}>
      <div className="min-w-0">
        {crumbs ? <p className="sr-only">{crumbs}</p> : null}
        <p className="text-2xs font-semibold uppercase tracking-wider text-primary-700">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-800">{title}</h1>
        {desc ? <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-neutral-600">{desc}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}