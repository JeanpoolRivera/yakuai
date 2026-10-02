import type { ReactNode } from 'react';
import { Icon } from './Icon';

export function Banner({
  kind,
  children,
}: {
  kind: "bad" | "ok" | "info" | "warn";
  children: ReactNode;
}): React.JSX.Element {
  const icon = kind === "bad" ? "alert" : kind === "ok" ? "check" : kind === "warn" ? "alert" : "info";
  return (
    <div className={`banner b-${kind}`} role={kind === "bad" ? "alert" : "status"}>
      <Icon name={icon} size={17} />
      <div>{children}</div>
    </div>
  );
}

export function Empty({
  icon = "info",
  title,
  hint,
  action,
}: {
  icon?: string;
  title: string;
  hint?: string;
  action?: ReactNode;
}): React.JSX.Element {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon name={icon} size={22} />
      </div>
      <p className="empty-title">{title}</p>
      {hint ? <p className="muted small">{hint}</p> : null}
      {action}
    </div>
  );
}

export function Loading({ text = "Cargando…" }: { text?: string }): React.JSX.Element {
  return (
    <div className="loading" role="status" aria-live="polite">
      <span className="spinner dark" aria-hidden="true" />
      {text}
    </div>
  );
}

export function Skeletons({ n = 3 }: { n?: number }): React.JSX.Element {
  return (
    <div className="skeletons" aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <div className="skeleton" key={i} />
      ))}
    </div>
  );
}

export function Badge({ tone, children }: { tone: string; children: ReactNode }): React.JSX.Element {
  const safe = tone.replace(/[^a-z_]/g, "") || "neutro";
  return <span className={`badge b-${safe}`}>{children}</span>;
}
