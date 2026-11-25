import { describe, expect, it } from "vitest";
import type { EvalSnapshot } from "@/api/types";
import { humidityFromSnapshot, litersRange, planFromSnapshot, rainFromSnapshot } from "./utils";

describe("utilidades de evaluación", () => {
  it("convierte unidades del snapshot y conserva valores ausentes", () => {
    expect(humidityFromSnapshot({ humedad_pct: 42, umbral: 0.3, pmp: 0.12 })).toEqual({
      actual: 42,
      threshold: 30,
      pmp: 12,
    });
    expect(humidityFromSnapshot(null)).toEqual({ actual: null, threshold: null, pmp: null });
    expect(rainFromSnapshot({ rain_mm: 2.4, rain_prob: 0.756 })).toEqual({ mm: 2.4, probability: 76 });
    expect(rainFromSnapshot(undefined)).toEqual({ mm: null, probability: null });
  });

  it("acepta un plan con campos mínimos y descarta estructuras incompletas", () => {
    const plan = { inicio: "2026-11-16 06:00", litros: 400, jornadas: 1 };
    expect(planFromSnapshot({ plan } as EvalSnapshot)).toEqual(plan);
    expect(planFromSnapshot({ plan: { inicio: "2026-11-16 06:00", litros: 400 } } as EvalSnapshot)).toBeNull();
    expect(planFromSnapshot(null)).toBeNull();
  });

  it("formatea rangos de litros o devuelve null si falta un extremo", () => {
    expect(litersRange(1200, 2500)).toBe("1,200–2,500 litros");
    expect(litersRange(null, 2500)).toBeNull();
  });
});
