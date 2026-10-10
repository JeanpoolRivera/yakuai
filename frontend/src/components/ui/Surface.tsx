import type { ReactNode } from 'react';
import { Icon } from './Icon';

export function Card({
  title,
  sub,
  action,
  accent,
  children,
  label,
}: {
  title?: string;
  sub?: string;
  action?: ReactNode;
  accent?: "warn" | "bad" | "info" | "ok";
  children: ReactNode;
  label?: string;
}): React.JSX.Element {
  return (
    <section className={`card stack${accent ? ` card-accent ${accent}` : ""}`} aria-label={label ?? title}>
      {title || action ? (
        <div className="card-head">
          <div>
            {title ? <h2 className="card-title">{title}</h2> : null}
            {sub ? <p className="card-sub">{sub}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function PageHead({
  eyebrow,
  title,
  desc,
  actions,
  crumbs,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  actions?: ReactNode;
  crumbs?: string;
}): React.JSX.Element {
  return (
    <header className="page-head">
      <div>
        {crumbs ? <p className="sr-only">{crumbs}</p> : null}
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        {desc ? <p className="page-desc">{desc}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

export function Stat({
  value,
  label,
  sub,
  tone,
  icon,
}: {
  value: string;
  label: string;
  sub?: string;
  tone?: "warn" | "bad" | "ok";
  icon?: string;
}): React.JSX.Element {
  return (
    <div className={`stat${tone ? ` ${tone}` : ""}`}>
      <div className="stat-heading">
        <span className="stat-label">{label}</span>
        {icon ? <span className="stat-icon" aria-hidden="true"><Icon name={icon} size={18} /></span> : null}
      </div>
      <span className="stat-value">{value}</span>
      {sub ? <span className="stat-sub">{sub}</span> : null}
    </div>
  );
}
