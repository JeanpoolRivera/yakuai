import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { EmptyState } from "./empty-state";

afterEach(() => cleanup());

describe("EmptyState", () => {
  it("anuncia título, descripción y acción", () => {
    render(
      <EmptyState
        title="No hay parcelas"
        description="Crea tu primera parcela para evaluar el riego."
        action={<button type="button">Crear parcela</button>}
      />,
    );
    expect(screen.getByText("No hay parcelas")).toBeInTheDocument();
    expect(screen.getByText("Crea tu primera parcela para evaluar el riego.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear parcela" })).toBeInTheDocument();
  });
});
