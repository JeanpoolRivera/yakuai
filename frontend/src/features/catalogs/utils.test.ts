import { describe, expect, it } from "vitest";
import type { Crop, SoilTexture } from "@/api/types";
import { ETAPAS, filterCrops, filterSoils, formatDepth, formatKc, kcMeterWidth, waterUseful } from "./utils";

const crops: Crop[] = [
  { id: 1, code: "maiz", name: "Maíz", scientific_name: "Zea mays", is_active: true },
  { id: 2, code: "papa", name: "Papa", scientific_name: null, is_active: true },
];
const soils: SoilTexture[] = [
  { id: 1, code: "franco", name: "Franco arenoso", field_capacity: "0.24", wilting_point: "0.10", source: "", source_url: null, reviewed_at: null, version: 1 },
  { id: 2, code: "arcilla", name: "Arcilloso", field_capacity: "0.36", wilting_point: "0.18", source: "", source_url: null, reviewed_at: null, version: 1 },
];

describe("utilidades de catálogos", () => {
  it("expone nombres de etapas y calcula agua útil", () => {
    expect(ETAPAS).toEqual({ ini: "Inicio", des: "Desarrollo", med: "Media", fin: "Final" });
    expect(waterUseful(0.30, 0.12)).toBeCloseTo(0.18);
  });

  it("calcula ancho de medidor y formatos de valores", () => {
    expect(kcMeterWidth(0.75, 1.5)).toBe("50%");
    expect(kcMeterWidth(0.75, 0)).toBe("0%");
    expect(kcMeterWidth(-0.2, 1)).toBe("0%");
    expect(formatKc(1.234)).toBe("1.23");
    expect(formatDepth(0.8)).toBe("0.80");
  });

  it("filtra por nombre y código sin distinguir mayúsculas y conserva listado vacío", () => {
    expect(filterCrops(crops, " ZEA ").map((crop) => crop.id)).toEqual([1]);
    expect(filterCrops(crops, "PAPA").map((crop) => crop.id)).toEqual([2]);
    expect(filterSoils(soils, "ARCILLA").map((soil) => soil.code)).toEqual(["arcilla"]);
    expect(filterCrops(crops, " ")).toBe(crops);
    expect(filterSoils(soils, "no existe")).toEqual([]);
  });
});
