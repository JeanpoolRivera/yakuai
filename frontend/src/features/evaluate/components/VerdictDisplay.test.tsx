import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { EvalResult, Evaluation } from "@/api/types";
import { VerdictDisplay } from "./VerdictDisplay";

afterEach(() => cleanup());

const base: Evaluation = {
  id: 1,
  plot_id: 1,
  evaluated_at: new Date().toISOString(),
  stage: null,
  inputs_snapshot: {},
  result: "no",
  min_liters: null,
  max_liters: null,
  confidence: null,
  reason: "humedad_suficiente",
  next_at: null,
  is_critical: false,
};

function make(overrides: Partial<Evaluation>): Evaluation {
  return { ...base, ...overrides };
}

const cases: Array<{ result: EvalResult; reason: string; title: string }> = [
  { result: "riega", reason: "bajo_umbral", title: "Es momento de regar" },
  { result: "no", reason: "humedad_suficiente", title: "No es necesario regar" },
  { result: "espera", reason: "lluvia_prevista_suficiente", title: "Espera antes de regar" },
  { result: "incompleta", reason: "sin_humedad_valida", title: "Revisar datos" },
];

describe.each(cases)("VerdictDisplay · $result", ({ result, reason, title }) => {
  const evaluation = make({
    result,
    reason,
    min_liters: result === "riega" ? "1400" : null,
    max_liters: result === "riega" ? "1800" : null,
  });

  it("rinde el título del veredicto", () => {
    render(
      <MemoryRouter>
        <VerdictDisplay evaluation={evaluation} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
  });

  it("técnico: ofrece enlaces profundos solo si falta un dato", () => {
    render(
      <MemoryRouter>
        <VerdictDisplay evaluation={evaluation} showDeepLinks />
      </MemoryRouter>,
    );
    if (result === "incompleta") {
      expect(screen.getByRole("link", { name: "Ir a sensores" })).toHaveAttribute("href", "/sensores");
    } else {
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    }
  });

  it("agricultor: no recibe rutas exclusivas del técnico", () => {
    render(
      <MemoryRouter>
        <VerdictDisplay evaluation={evaluation} />
      </MemoryRouter>,
    );
    if (result === "incompleta") {
      expect(screen.getByText(/Contacta a tu técnico/)).toBeInTheDocument();
      expect(screen.queryByText("Registra una lectura reciente para poder decidir.")).not.toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    }
  });
});

describe("VerdictDisplay · riega crítico", () => {
  it("muestra volumen recomendado y prioridad alta", () => {
    render(
      <MemoryRouter>
        <VerdictDisplay
          evaluation={make({
            result: "riega",
            reason: "humedad_critica",
            is_critical: true,
            min_liters: "1400",
            max_liters: "1800",
          })}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Riego prioritario" })).toBeInTheDocument();
    expect(screen.getByText("Prioridad alta")).toBeInTheDocument();
    expect(screen.getByText("1,400–1,800")).toBeInTheDocument();
    expect(screen.getByText("litros")).toBeInTheDocument();
  });
});
