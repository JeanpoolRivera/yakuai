import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { Button } from './Button';

function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )).filter((el) => el.offsetParent !== null || el === document.activeElement);
}

export function Modal({
  title,
  sub,
  onClose,
  children,
  foot,
  wide = false,
  busy = false,
}: {
  title: string;
  sub?: string;
  onClose: () => void;
  children: ReactNode;
  foot?: ReactNode;
  wide?: boolean;
  busy?: boolean;
}): React.JSX.Element {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  useEffect(() => { closeRef.current = onClose; busyRef.current = busy; }, [onClose, busy]);

  useEffect(() => {
    const prevActive = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const appRoot = document.getElementById("root");
    const wasInert = appRoot?.inert ?? false;
    if (appRoot) appRoot.inert = true;

    const dialog = dialogRef.current;
    const target = dialog ? focusables(dialog)[0] ?? dialog : null;
    if (dialog && !dialog.hasAttribute("tabindex")) dialog.setAttribute("tabindex", "-1");
    (target as HTMLElement | null)?.focus?.();

    const onKey = (e: KeyboardEvent): void => {
      if (Array.from(document.querySelectorAll("[data-yaku-dialog]")).at(-1) !== dialog) return;
      if (e.key === "Escape" && !busyRef.current) closeRef.current();
      if (e.key === "Tab" && dialog) {
        const items = focusables(dialog);
        if (items.length === 0) {
          e.preventDefault();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (appRoot) appRoot.inert = wasInert;
      prevActive?.focus?.();
    };
  }, []);

  return createPortal(
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div data-yaku-dialog ref={dialogRef} className={`dialog${wide ? " dialog-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={sub ? `${titleId}-description` : undefined}>
        <div className="dialog-head">
          <div>
            <h2 className="card-title" id={titleId} tabIndex={-1}>
              {title}
            </h2>
            {sub ? <p className="card-sub" id={`${titleId}-description`}>{sub}</p> : null}
          </div>
          <button className="icon-btn" onClick={onClose} disabled={busy} aria-label="Cerrar diálogo">
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="dialog-body">{children}</div>
        {foot ? <div className="dialog-foot">{foot}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

export function Confirm({
  title,
  body,
  confirmLabel,
  busy = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}): React.JSX.Element {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      busy={busy}
      foot={
        <>
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="muted small">{body}</p>
    </Modal>
  );
}
