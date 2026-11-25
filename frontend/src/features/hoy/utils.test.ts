import { describe, expect, it } from "vitest";
import type { Evaluation } from "@/api/types";
import { cardBg, cardBarColor, countByResult, filterEvaluations, latestPerPlot, sortEvaluations } from "./utils";

function evaluation(id: number, plotId: number, evaluatedAt: string, result: Evaluation["result"], name = "Parcela Norte"): Evaluation {
  return {
    id,
    plot_id: plotId,
    evaluated_at: evaluatedAt,
    stage: null,
    inputs_snapshot: {},
    result,
    min_liters: null,
    max_liters: null,
    confidence: null,
    reason: "",
    next_at: null,
    is_critical: false,
    plot: { id: plotId, farmer_id: 1, name, latitude: "0", longitude: "0", boundary: null, area_m2: "1", area_origin: "manual", crop_id: 1, sowing_date: "2026-01-01", soil_texture_code: "franco", irrigation_system: "goteo", irrigation_efficiency: "0.9", flow_lpm: null, status: "activa" },
  };
}

const items = [
  evaluation(1, 1, "2026-11-14T10:00:00Z", "no"),
  evaluation(2, 1, "2026-11-16T10:00:00Z", "riega"),
  evaluation(3, 2, "2026-11-15T10:00:00Z", "espera", "Parcela Sur"),
];

describe("utilidades de la vista Hoy", () => {
  it("obtiene la última evaluación por parcela y ordena sin alterar el arreglo", () => {
    expect(latestPerPlot(items).map((item) => item.id)).toEqual([2, 3]);
    expect(sortEvaluations(items, "reciente").map((item) => item.id)).toEqual([2, 3, 1]);
    expect(sortEvaluations(items, "antiguo").map((item) => item.id)).toEqual([1, 3, 2]);
    expect(items.map((item) => item.id)).toEqual([1, 2, 3]);
  });

  it("filtra por parcela y resultado y cuenta cada estado", () => {
    expect(filterEvaluations(items, " SUR ", "todas").map((item) => item.id)).toEqual([3]);
    expect(filterEvaluations(items, "", "riega").map((item) => item.id)).toEqual([2]);
    expect(countByResult(items)).toEqual({ todas: 3, riega: 1, no: 1, espera: 1, incompleta: 0 });
  });

  it("usa estilos conocidos y fallback para tonos inesperados", () => {
    expect(cardBg("riega")).toContain("bg-success-50");
    expect(cardBg("desconocido")).toBe(cardBg("incompleta"));
    expect(cardBarColor("espera")).toBe("#B86E00");
    expect(cardBarColor("desconocido")).toBe(cardBarColor("incompleta"));
  });
});
