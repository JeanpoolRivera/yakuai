import type { ReactNode } from "react";
import { AlertCircle, Check, CircleHelp, LoaderCircle } from "lucide-react";
import { Badge } from "@/design-system/primitives/badge";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { cn } from "@/lib/utils";

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }): React.JSX.Element {
  return <header className="flex flex-col gap-4 border-b border-neutral-200 pb-5 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[.12em] text-primary-700">{eyebrow}</p><h1 className="mt-1.5 text-[clamp(1.65rem,1.35rem+1vw,2.1rem)] font-semibold leading-tight tracking-tight text-neutral-900">{title}</h1><p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-neutral-700">{description}</p></div>{action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}</header>;
}

export function SectionHeading({ title, description, action, className }: { title: string; description?: string; action?: ReactNode; className?: string }): React.JSX.Element {
  return <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}><div><h2 className="text-base font-semibold text-neutral-900">{title}</h2>{description ? <p className="mt-1 text-sm leading-relaxed text-neutral-600">{description}</p> : null}</div>{action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}</div>;
}

export function Metric({ label, value, detail, icon, tone = "default" }: { label: string; value: ReactNode; detail?: ReactNode; icon?: ReactNode; tone?: "default" | "brand" | "warning" | "danger" }): React.JSX.Element {
  const tones = { default: "border-neutral-200 bg-white", brand: "border-primary-100 bg-primary-50/70", warning: "border-warning-100 bg-warning-50/70", danger: "border-danger-100 bg-danger-50/70" };
  return <Card className={cn("min-w-0 rounded-xl p-4 shadow-xs sm:p-5", tones[tone])}><div className="flex items-start justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">{label}</p>{icon ? <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/80 text-primary-700" aria-hidden="true">{icon}</span> : null}</div><p className="mt-3 text-2xl font-semibold leading-none tracking-tight tabular-nums text-neutral-900">{value}</p>{detail ? <p className="mt-2 text-xs leading-relaxed text-neutral-600">{detail}</p> : null}</Card>;
}

const statusTone: Record<string, "riega" | "no" | "espera" | "incompleta" | "success" | "warning" | "danger" | "brand" | "neutral"> = { riega: "riega", no: "no", espera: "espera", incompleta: "incompleta", activo: "success", activa: "success", ok: "success", operativo: "success", vigente: "success", corregido: "warning", anomalo: "warning", sin_datos: "neutral", pausada: "neutral", cerrada: "neutral", critica: "danger", inactivo: "neutral", demo: "brand", owm: "brand" };
export function StatusBadge({ value, label, className }: { value: string; label?: string; className?: string }): React.JSX.Element {
  const normalized = value.toLowerCase().replaceAll(" ", "_");
  return <Badge tone={statusTone[normalized] ?? "neutral"} className={className}>{label ?? value}</Badge>;
}

export function LoadingBlock({ label = "Cargando información…" }: { label?: string }): React.JSX.Element {
  return <div className="flex min-h-40 items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-600" role="status" aria-live="polite"><LoaderCircle className="h-5 w-5 animate-spin text-primary-600" aria-hidden="true" />{label}</div>;
}

export function ErrorBlock({ message, retry }: { message: string; retry?: () => void }): React.JSX.Element {
  return <div className="flex flex-col items-start gap-3 rounded-xl border border-danger-100 bg-danger-50 p-4 sm:flex-row sm:items-center sm:justify-between" role="alert"><div className="flex items-start gap-2.5 text-sm text-neutral-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger-600" aria-hidden="true" /><span>{message}</span></div>{retry ? <Button variant="outline" size="sm" onClick={retry}>Reintentar</Button> : null}</div>;
}

export function EmptyBlock({ title, description, action }: { title: string; description: string; action?: ReactNode }): React.JSX.Element {
  return <div className="grid min-h-52 place-items-center rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-10 text-center" role="status" aria-live="polite"><div className="grid justify-items-center gap-2.5"><span className="grid h-11 w-11 place-items-center rounded-full bg-primary-50 text-primary-700" aria-hidden="true"><CircleHelp className="h-5 w-5" /></span><h3 className="text-base font-semibold text-neutral-900">{title}</h3><p className="max-w-[52ch] text-sm leading-relaxed text-neutral-600">{description}</p>{action ? <div className="mt-2">{action}</div> : null}</div></div>;
}

export function SuccessMark({ children }: { children: ReactNode }): React.JSX.Element {
  return <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success-700"><Check className="h-4 w-4" aria-hidden="true" />{children}</span>;
}

