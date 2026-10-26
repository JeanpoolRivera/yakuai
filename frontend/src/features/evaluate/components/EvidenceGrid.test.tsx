import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { EvidenceGrid } from "./EvidenceGrid";

afterEach(() => cleanup());

describe("EvidenceGrid", () => {
  it("rinde humedad, lluvia y próxima revisión con los datos del snapshot", () => {
    render(
      <EvidenceGrid
        evaluation={{
          inputs_snapshot: { humedad_pct: 18, umbral: 0.24, pmp: 0.15, rain_mm: 2, rain_prob: 0.2 },
          next_at: null,
          result: "riega",
        }}
      />,
    );
    expect(screen.getByText("Humedad del suelo")).toBeInTheDocument();
    expect(screen.getByText("18.0%")).toBeInTheDocument();
    expect(screen.getByText("Lluvia · 6 h")).toBeInTheDocument();
    expect(screen.getByText("2 mm")).toBeInTheDocument();
    expect(screen.getByText("20% de probabilidad")).toBeInTheDocument();
    expect(screen.getByText("Próxima revisión")).toBeInTheDocument();
  });

  it("degrada sin datos de lluvia ni humedad", () => {
    render(<EvidenceGrid evaluation={{ inputs_snapshot: {}, next_at: null, result: "riega" }} />);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(screen.getByText("Sin datos")).toBeInTheDocument();
  });

  it("conserva la evidencia disponible aunque la evaluación esté incompleta", () => {
    render(
      <EvidenceGrid
        evaluation={{
          inputs_snapshot: { humedad_pct: 21, umbral: 0.24, pmp: 0.15, rain_mm: 0, rain_prob: 0 },
          next_at: null,
          result: "incompleta",
        }}
      />,
    );
    expect(screen.getByText("0 mm")).toBeInTheDocument();
    expect(screen.getByText("0% de probabilidad")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("oculta PMP y umbral en modo agricultor", () => {
    render(
      <EvidenceGrid
        evaluation={{ inputs_snapshot: { humedad_pct: 18, umbral: 0.24, pmp: 0.15 }, next_at: null, result: "riega" }}
        showTechnical={false}
      />,
    );
    expect(screen.queryByText(/PMP/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Umbral/)).not.toBeInTheDocument();
  });
});
