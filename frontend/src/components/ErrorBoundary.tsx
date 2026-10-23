import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Evita la pantalla en blanco: si algún componente falla al dibujarse, en vez
 * de desmontar toda la app se muestra el mensaje del error y un botón para
 * recargar. El detalle también queda en la consola del navegador (F12).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div role="alert" style={{ maxWidth: 640, margin: "10vh auto", padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Algo salió mal al mostrar esta pantalla</h1>
        <p style={{ color: "#555", marginBottom: 16 }}>
          Tus datos no se perdieron. Puedes recargar la página; si el problema se repite, copia el mensaje de abajo.
        </p>
        <pre style={{ whiteSpace: "pre-wrap", background: "#f4f4f4", padding: 12, borderRadius: 8, fontSize: 13 }}>
          {error.name}: {error.message}
        </pre>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button type="button" onClick={() => window.location.reload()} style={{ padding: "8px 16px", cursor: "pointer" }}>
            Recargar
          </button>
          <button type="button" onClick={() => { window.location.href = "/"; }} style={{ padding: "8px 16px", cursor: "pointer" }}>
            Ir al inicio
          </button>
        </div>
      </div>
    );
  }
}
