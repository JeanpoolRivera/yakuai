import type { ReactNode } from "react";
import { Check, Info, LoaderCircle, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const BANNERS = {
  bad: { cls: "border-danger-100 bg-danger-50 text-danger-600", Icon: TriangleAlert, role: "alert" },
  ok: { cls: "border-success-100 bg-success-50 text-success-600", Icon: Check, role: "status" },
  warn: { cls: "border-warning-100 bg-warning-50 text-warning-600", Icon: TriangleAlert, role: "status" },
  info: { cls: "border-info-100 bg-info-50 text-info-600", Icon: Info, role: "status" },
} as const;

export function Banner({
  kind,
  children,
}: {
  kind: keyof typeof BANNERS;
  children: ReactNode;
}): React.JSX.Element {
  const { cls, Icon, role } = BANNERS[kind];
  return (
    <div role={role} className={cn("flex items-start gap-3 rounded-md border p-4 text-sm", cls)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 text-neutral-800">{children}</div>
    </div>
  );
}

export function Empty({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-10 text-center">
      <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-full bg-neutral-100 text-neutral-500">
        {icon ?? <Info className="h-5 w-5" />}
      </span>
      <p className="text-base font-semibold text-neutral-800">{title}</p>
      {hint ? <p className="max-w-[52ch] text-sm text-neutral-500">{hint}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function Loading({ text = "Cargando…" }: { text?: string }): React.JSX.Element {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-sm text-neutral-600" role="status" aria-live="polite">
      <LoaderCircle className="h-5 w-5 animate-spin text-primary-700" aria-hidden="true" />
      {text}
    </div>
  );
}

export function Skeletons({ n = 3 }: { n?: number }): React.JSX.Element {
  return (
    <div className="grid gap-3" aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-md bg-neutral-200" />
      ))}
    </div>
  );
}