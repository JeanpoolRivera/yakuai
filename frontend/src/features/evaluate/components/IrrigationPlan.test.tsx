import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { IrrigationPlan } from "./IrrigationPlan";

afterEach(() => cleanup());

describe("IrrigationPlan", () => {
  it("muestra inicio, fin, duración y jornadas del plan del backend", () => {
    render(
      <IrrigationPlan
        evaluation={{
          inputs_snapshot: {
            plan: {
              litros: 1600,
              minutos: 30,
              inicio: "2026-10-19T05:30:00",
              fin: "2026-10-19T06:00:00",
              jornadas: 1,
              nota: null,
            },
          },
        }}
      />,
    );
    expect(screen.getByRole("heading", { name: "Plan de riego" })).toBeInTheDocument();
    expect(screen.getByText("Inicio")).toBeInTheDocument();
    expect(screen.getByText("Fin")).toBeInTheDocument();
    expect(screen.getByText("Duración")).toBeInTheDocument();
    expect(screen.getByText("30 min")).toBeInTheDocument();
    expect(screen.getByText("Jornadas")).toBeInTheDocument();
    expect(screen.getByText(/Riega temprano/)).toBeInTheDocument();
  });

  it("no rinde nada cuando el backend no envía plan", () => {
    const { container } = render(<IrrigationPlan evaluation={{ inputs_snapshot: {} }} />);
    expect(container).toBeEmptyDOMElement();
  });
});
