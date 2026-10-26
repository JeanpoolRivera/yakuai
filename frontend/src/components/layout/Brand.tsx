import { Link } from "react-router-dom";

export function Brand({ tone = "light", tagline = true }: { tone?: "light" | "dark"; tagline?: boolean }): React.JSX.Element {
  return (
    <Link to="/" aria-label="YakuAI, inicio" className={`yaku-brand yaku-brand--${tone}`}>
      <span className="yaku-brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" width="23" height="23" fill="none"><path d="M16 3.5C12 9 7 13.2 7 19a9 9 0 0 0 18 0c0-5.8-5-10-9-15.5Z" fill="currentColor"/><path d="M11.5 20.5c1.5 2.4 4 3.5 7 3" stroke="white" strokeWidth="1.7" strokeLinecap="round"/></svg></span>
      <span className="yaku-brand-copy"><span className="yaku-brand-name">Yaku<span>AI</span></span>{tagline ? <span className="yaku-brand-tagline">Decisiones claras para el riego</span> : null}</span>
    </Link>
  );
}