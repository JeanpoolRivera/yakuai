import { describe, expect, it } from "vitest";
import {
  DEVIATION_LABEL,
  PERIOD_LABEL,
  STATUS_FILTER_LABEL,
  STATUS_LABEL,
  STATUS_ORDER,
  TOAST,
  deviationLabel,
  originLabel,
  pageCopy,
  statusLabel,
} from "./copy";

describe("copy por rol", () => {
  it("usa el lenguaje de staff y de agricultor", () => {
    expect(pageCopy(true).title).toBe("Historial de riego");
    expect(pageCopy(true).eyebrow).toBe("Operación");
    expect(pageCopy(false).title).toBe("Mis riegos");
    expect(pageCopy(false).eyebrow).toBe("Tu campo");
    expect(pageCopy(true).cta).toBe(pageCopy(false).cta);
  });

  it("adapta el vacío al rol", () => {
    expect(pageCopy(true).emptyTitle).toBe("Aún no hay riegos registrados");
    expect(pageCopy(false).emptyTitle).toBe("Aún no has registrado riegos");
  });
});

describe("etiquetas legibles", () => {
  it("traduce estados sin exponer enums crudos", () => {
    expect(STATUS_LABEL).toEqual({ activo: "Vigente", corregido: "Corregido", anulado: "Anulado" });
    expect(statusLabel("activo")).toBe("Vigente");
    expect(statusLabel("desconocido")).toBe("desconocido");
  });

  it("traduce origen y desvío", () => {
    expect(originLabel("manual")).toBe("Manual");
    expect(originLabel("demo")).toBe("Demostración");
    expect(originLabel("otro")).toBe("otro");
    expect(deviationLabel("ok")).toBe("En rango");
    expect(deviationLabel("over")).toBe("Por encima");
    expect(deviationLabel("under")).toBe("Por debajo");
    expect(deviationLabel("none")).toBe("Sin recomendación");
  });

  it("mantiene el orden y las etiquetas de los filtros", () => {
    expect(STATUS_ORDER).toEqual(["todos", "activo", "corregido", "anulado"]);
    expect(Object.keys(STATUS_FILTER_LABEL)).toEqual(STATUS_ORDER);
    expect(PERIOD_LABEL).toEqual({ "7d": "7 días", "30d": "30 días", todo: "Histórico" });
    expect(Object.keys(DEVIATION_LABEL)).toEqual(["none", "ok", "over", "under"]);
  });

  it("explica el resultado de cada acción", () => {
    expect(TOAST.created).toContain("historial");
    expect(TOAST.corrected).toContain("se conserva");
    expect(TOAST.voided).toContain("conserva");
  });
});
