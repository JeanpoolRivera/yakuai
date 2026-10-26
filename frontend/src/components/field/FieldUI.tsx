import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowUpRight, LoaderCircle, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Link } from "react-router-dom";

export function FieldPage({ title, intro, actions, children }: { title: string; intro: string; actions?: ReactNode; children: ReactNode }) {
  return <div className="field-app"><header className="field-header"><div><p className="field-eyebrow">GESTIÓN DEL RIEGO</p><h1>{title}</h1><p className="field-intro">{intro}</p></div>{actions && <div className="field-actions">{actions}</div>}</header>{children}</div>;
}
export function Action({ children, tone = "solid", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "solid" | "quiet" | "line" }) {
  return <button type="button" {...props} className={`field-button ${tone} ${className}`}>{children}</button>;
}
export function FieldLink({ to, children, plotId, quiet = false }: { to: string; children: ReactNode; plotId?: number; quiet?: boolean }) {
  return <Link className={`field-button ${quiet ? "line" : "solid"}`} to={to} state={plotId ? { plotId } : undefined}>{children}<ArrowUpRight size={17} aria-hidden="true" /></Link>;
}
export function Status({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" | "blue" }) {
  return <span className={`field-status ${tone}`}><i aria-hidden="true" />{children}</span>;
}
export function FieldBlank({ title, children, icon, action }: { title: string; children: ReactNode; icon?: ReactNode; action?: ReactNode }) {
  return <div className="field-blank">{icon && <span className="field-blank-icon" aria-hidden="true">{icon}</span>}<h3>{title}</h3><p>{children}</p>{action}</div>;
}
export function FieldLoading({ children = "Cargando información…" }: { children?: ReactNode }) {
  return <div className="field-loading" role="status"><LoaderCircle size={21} className="animate-spin" aria-hidden="true" />{children}</div>;
}
export function FieldError({ children, retry }: { children: ReactNode; retry?: () => void }) {
  return <div className="field-error" role="alert"><span>{children}</span>{retry && <Action tone="quiet" onClick={retry}>Reintentar</Action>}</div>;
}

export function FieldDialogContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-[#162d26]/45" />
    <DialogPrimitive.Content className={`field-dialog fixed left-1/2 top-1/2 grid w-[calc(100%_-_32px)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-white p-6 shadow-xl ${className}`}>
      {children}
      <DialogPrimitive.Close className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-md text-neutral-500 hover:bg-neutral-100" aria-label="Cerrar"><X size={17} /></DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>;
}
