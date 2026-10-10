import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { Badge } from './Feedback';

/** Humedad y umbrales en porcentaje (0-100).
 * El backend entrega `humedad_pct` en porcentaje y `umbral`/`pmp` en fracción.
 * Los callers convierten la fracción a porcentaje antes de usar este componente.
 */
export function SoilMeter({
  actual,
  umbral,
  critico,
}: {
  actual: number | null;
  umbral: number | null;
  critico: number | null;
}): React.JSX.Element {
  if (actual === null || umbral === null || !Number.isFinite(actual) || !Number.isFinite(umbral)) return <span className="tiny">Sin dato de humedad</span>;
  const pct = Math.max(0, Math.min(100, actual));
  const threshold = Math.max(0, Math.min(100, umbral));
  const rawCritical = critico ?? 0;
  const critical = Number.isFinite(rawCritical) ? Math.max(0, Math.min(100, rawCritical)) : 0;
  const state = pct <= critical ? "crit" : pct <= threshold ? "low" : "";
  const label = pct <= critical ? "Crítico — regar hoy" : pct <= threshold ? "Bajo umbral" : "Adecuado";
  return (
    <div className="soil">
      <div className="spread">
        <strong className="small num">{pct.toFixed(1)} %</strong>
        <Badge tone={pct <= critical ? "critica" : pct <= threshold ? "riega" : "ok"}>{label}</Badge>
      </div>
      <div
        className="soil-track"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Humedad ${pct.toFixed(1)} por ciento, ${label}`}
      >
        <div className={`soil-fill ${state}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="soil-marks">
        <span>PMP {critico !== null ? `${critical.toFixed(1)}%` : "—"}</span>
        <span>Umbral {threshold.toFixed(1)}%</span>
      </div>
    </div>
  );
}

const VERDICT_ICON: Record<string, string> = {
  riega: "drop",
  no: "check",
  espera: "cloud",
  incompleta: "alert",
};

export function VerdictCard({
  tone,
  kicker,
  title,
  amount,
  chips,
  action,
  children,
}: {
  tone: "riega" | "no" | "espera" | "incompleta";
  kicker: string;
  title: string;
  amount?: string;
  chips: string[];
  action?: ReactNode;
  children?: ReactNode;
}): React.JSX.Element {
  return (
    <div className={`verdict ${tone}`}>
      <div className="verdict-top">
        <span className="verdict-icon" aria-hidden="true">
          <Icon name={VERDICT_ICON[tone] ?? "info"} size={22} />
        </span>
        <div className="stack-sm">
          <p className="verdict-kicker">{kicker}</p>
          <h2 className="verdict-title">{title}</h2>
          {amount ? <p className="verdict-amount num">{amount}</p> : null}
        </div>
      </div>
      {chips.length > 0 ? (
        <div className="chips">
          {chips.map((c) => (
            <span className="chip" key={c}>
              {c}
            </span>
          ))}
        </div>
      ) : null}
      {children}
      {action}
    </div>
  );
}
