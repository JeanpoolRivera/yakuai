import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { Evaluation } from "@/api/types";
import { HistoryTimeline } from "./HistoryTimeline";

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

function make(id: number, plotId: number, daysAgo: number, result: Evaluation["result"] = "no"): Evaluation {
  return {
    ...base,
    id,
    plot_id: plotId,
    result,
    reason: result === "no" ? "humedad_suficiente" : "bajo_umbral",
    min_liters: result === "riega" ? "1400" : null,
    max_liters: result === "riega" ? "1800" : null,
    evaluated_at: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
  };
}

describe("HistoryTimeline", () => {
  it("agrupa por día con etiquetas legibles", () => {
    render(<HistoryTimeline items={[make(1, 1, 0), make(2, 1, 0), make(3, 2, 1)]} />);
    expect(screen.getByRole("heading", { name: "Hoy" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ayer" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("no ofrece filtro por parcela", () => {
    render(<HistoryTimeline items={[make(1, 1, 0)]} />);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("muestra estado vacío sin evaluaciones", () => {
    render(<HistoryTimeline items={[]} />);
    expect(screen.getByText("Sin historial")).toBeInTheDocument();
  });
});
