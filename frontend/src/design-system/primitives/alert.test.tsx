import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Alert } from "./alert";

afterEach(() => cleanup());

describe("Alert", () => {
  it("usa role=alert y par accesible para errores", () => {
    render(
      <Alert tone="danger" title="No se pudo guardar">
        Revisa la conexión e inténtalo de nuevo.
      </Alert>,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("bg-danger-bg", "text-danger-fg");
    expect(alert).toHaveTextContent("Revisa la conexión e inténtalo de nuevo.");
  });

  it("usa role=status para confirmaciones", () => {
    render(<Alert tone="success">Evaluación guardada.</Alert>);
    expect(screen.getByRole("status")).toHaveTextContent("Evaluación guardada.");
  });
});
