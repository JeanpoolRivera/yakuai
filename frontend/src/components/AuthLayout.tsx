import type { ReactNode } from "react";
import { Brand } from "./layout/Brand";
import "@/styles/auth.css";

export function AuthLayout({
  children,
  footer,
  recovery = false,
}: {
  children: ReactNode;
  footer: ReactNode;
  recovery?: boolean;
}): React.JSX.Element {
  return (
    <main className={`auth-screen${recovery ? " auth-screen-recovery" : ""}`}>
      <div className="auth-layout">
        <aside className="auth-visual" aria-label="YakuAI, decisiones de riego para el campo">
          <div className="auth-brand">
            <Brand tone="dark" />
          </div>
          <div className="auth-visual-copy">
            <p className="auth-visual-kicker">Chupaca, Junín</p>
            <h2>
              {recovery ? (
                <>
                  Recupera el acceso.
                  <span> Sigue decidiendo tú.</span>
                </>
              ) : (
                <>
                  ¿Riego ahora?
                  <span> Una respuesta clara.</span>
                </>
              )}
            </h2>
            <p>
              {recovery
                ? "Un código al correo y un PIN nuevo. El sistema recomienda; tú riegas."
                : "Parcela, suelo, sensor y clima. Recomendación explicable, en litros y en horario."}
            </p>
          </div>
          <ul className="auth-visual-foot">
            <li>Regar</li>
            <li>Esperar</li>
            <li>No regar</li>
          </ul>
        </aside>
        <section className="auth-content" aria-label={recovery ? "Recuperación de acceso" : "Inicio de sesión"}>
          <div className="auth-content-inner">
            {children}
            <footer className="auth-footer">{footer}</footer>
          </div>
          <p className="auth-legal">
            <span>YakuAI</span>
            <span>Acceso protegido</span>
          </p>
        </section>
      </div>
    </main>
  );
}
