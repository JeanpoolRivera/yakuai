import { useRef } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';

export function Pager({
  page,
  pages,
  onPage,
  count,
}: {
  page: number;
  pages: number;
  onPage: (p: number) => void;
  count: string;
}): React.JSX.Element {
  if (pages <= 1) return <p className="tiny pager-count">{count}</p>;
  return (
    <nav className="pager" aria-label="Paginación">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Anterior
      </Button>
      <span aria-live="polite">
        Página {page} de {pages} · {count}
      </span>
      <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Siguiente
      </Button>
    </nav>
  );
}

export function Stepper({ steps, current }: { steps: string[]; current: number }): React.JSX.Element {
  return (
    <ol className="stepper" aria-label="Progreso">
      {steps.map((s, i) => {
        const n = i + 1;
        const state = n < current ? "is-done" : n === current ? "is-current" : "";
        return (
          <li key={s} className={state} aria-current={n === current ? "step" : undefined}>
            <span className="step-dot" aria-hidden="true">
              {n < current ? <Icon name="check" size={13} /> : n}
            </span>
            {s}
            {n < steps.length ? <span className="step-sep" aria-hidden="true" /> : null}
          </li>
        );
      })}
    </ol>
  );
}

export function Tabs<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  label: string;
}): React.JSX.Element {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  function onKey(e: React.KeyboardEvent, idx: number): void {
    let next: number | null = null;
    if (e.key === "ArrowRight") next = (idx + 1) % options.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + options.length) % options.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = options.length - 1;
    if (next !== null) {
      e.preventDefault();
      onChange(options[next].value);
      refs.current[next]?.focus();
    }
  }
  return (
    <div className="tabs" role="group" aria-label={label}>
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          aria-pressed={o.value === value}
          tabIndex={o.value === value ? 0 : -1}
          className={`tab${o.value === value ? " active" : ""}`}
          onClick={() => onChange(o.value)}
          onKeyDown={(e) => onKey(e, i)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
