import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <section className={cn("grid gap-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-card sm:p-6", className)}>
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-neutral-800">{title}</h2>
        {description ? <p className="mt-1 text-sm text-neutral-600">{description}</p> : null}
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}