import { describe, expect, it } from "vitest";
import type { ValidationReport } from "@/api/types";
import { detailLabel, filterCases, isAllPassed, pctPassed, reasonLabel, resultLabel } from "./utils";

const report: ValidationReport = {
  total: 3,
  passed: 2,
  cases: [
    { caso: "Humedad suficiente", esperado: "no", obtenido: "no", ok: true, detalle: "humedad_suficiente correcto" },
    { caso: "Lluvia alta", esperado: "espera", obtenido: "riega", ok: false, detalle: "lluvia_alta revisar" },
    { caso: "Sensor vencido", esperado: "incompleta", obtenido: "incompleta", ok: true, detalle: "sensor_vencido" },
  ],
};

describe("utilidades de validación", () => {
  it("traduce códigos conocidos y conserva detalles desconocidos", () => {
    expect(reasonLabel("bajo_umbral")).toBe("La humedad bajó del umbral del cultivo.");
    expect(detailLabel("humedad_suficiente valor observado")).toBe("La tierra aún tiene agua suficiente. valor observado");
    expect(detailLabel("codigo_nuevo detalle adicional")).toBe("codigo_nuevo detalle adicional");
    expect(resultLabel("espera")).toBe("Espera");
    expect(resultLabel("otro")).toBe("otro");
  });

  it("calcula porcentaje y estado completo sin dividir entre cero", () => {
    expect(pctPassed(report)).toBe(67);
    expect(pctPassed({ total: 0, passed: 0, cases: [] })).toBe(0);
    expect(pctPassed(null)).toBe(0);
    expect(isAllPassed(report)).toBe(false);
    expect(isAllPassed({ total: 2, passed: 2, cases: [] })).toBe(true);
    expect(isAllPassed(null)).toBe(false);
  });

  it("combina pestaña de resultado y búsqueda sin mutar los casos originales", () => {
    const original = [...report.cases];
    expect(filterCases(report.cases, "ok", "sensor").map((item) => item.caso)).toEqual(["Sensor vencido"]);
    expect(filterCases(report.cases, "fallos", "LLUVIA").map((item) => item.caso)).toEqual(["Lluvia alta"]);
    expect(filterCases(report.cases, "todos", " ")).toHaveLength(3);
    expect(report.cases).toEqual(original);
  });
});
