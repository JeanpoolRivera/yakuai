import { describe, expect, it } from "vitest";
import type { Irrigation } from "@/api/types";
import {
  EMPTY_FILTERS,
  appliedLiters,
  correctionChain,
  countByStatus,
  dayKey,
  dayLabel,
  deviationFor,
  deviationLevel,
  filterIrrigations,
  groupByDay,
  hasActiveFilters,
  isActionable,
  localDayKey,
  matchesPeriod,
  matchesQuery,
  plotName,
  recommendedLiters,
  sortByOccurredDesc,
  summarize,
  timeLabel,
} from "./utils";

function make(overrides: Partial<Irrigation> = {}): Irrigation {
  return {
    id: 1,
    plot_id: 1,
    evaluation_id: null,
    supersedes_id: null,
    occurred_at: new Date(2026, 8, 12, 6, 30).toISOString(),
    recommended_liters: "3000",
    applied_liters: "3000",
    origin: "manual",
    note: null,
    status: "activo",
    plot: { id: 1, name: "Parcela Norte" } as Irrigation["plot"],
    ...overrides,
  };
}

const now = new Date(2026, 8, 12, 12, 0);

describe("litros y desvío", () => {
  it("convierte litros y calcula el desvío", () => {
    expect(appliedLiters(make({ applied_liters: "4800" }))).toBe(4800);
    expect(recommendedLiters(make({ recommended_liters: null }))).toBeNull();
    expect(deviationFor(make({ applied_liters: "4800", recommended_liters: "4650" }))).toBe(150);
    expect(deviationFor(make({ recommended_liters: null }))).toBeNull();
  });

  it("clasifica el desvío con tolerancia de 100 L o 5 %", () => {
    expect(deviationLevel(make({ applied_liters: "3080", recommended_liters: "3000" }))).toBe("ok");
    expect(deviationLevel(make({ applied_liters: "3400", recommended_liters: "3000" }))).toBe("over");
    expect(deviationLevel(make({ applied_liters: "2600", recommended_liters: "3000" }))).toBe("under");
    expect(deviationLevel(make({ recommended_liters: null }))).toBe("none");
    expect(deviationLevel(make({ applied_liters: "52000", recommended_liters: "50000" }))).toBe("ok");
  });

  it("solo los registros vigentes son accionables", () => {
    expect(isActionable(make({ status: "activo" }))).toBe(true);
    expect(isActionable(make({ status: "corregido" }))).toBe(false);
    expect(isActionable(make({ status: "anulado" }))).toBe(false);
  });

  it("usa el nombre de la parcela o un fallback legible", () => {
    expect(plotName(make())).toBe("Parcela Norte");
    expect(plotName(make({ plot: undefined, plot_id: 9 }))).toBe("Parcela #9");
  });
});

describe("fechas locales", () => {
  it("agrupa por día local y no por la cadena UTC", () => {
    const local = new Date(2026, 8, 12, 23, 30);
    expect(dayKey(local.toISOString())).toBe("2026-09-12");
    expect(localDayKey(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(dayKey("no-es-fecha")).toBe("invalid");
  });

  it("etiqueta hoy, ayer y fechas anteriores", () => {
    expect(dayLabel(new Date(2026, 8, 12, 8, 0).toISOString(), now)).toBe("Hoy");
    expect(dayLabel(new Date(2026, 8, 11, 8, 0).toISOString(), now)).toBe("Ayer");
    expect(dayLabel(new Date(2026, 7, 1, 8, 0).toISOString(), now)).toContain("agosto");
    expect(dayLabel("no-es-fecha", now)).toBe("Sin fecha");
  });

  it("formatea la hora y tolera fechas inválidas", () => {
    expect(timeLabel(new Date(2026, 8, 12, 6, 30).toISOString())).toContain("06:30");
    expect(timeLabel("no-es-fecha")).toBe("—");
  });
});

describe("agrupación y resumen", () => {
  it("ordena de más reciente a más antiguo y agrupa por día", () => {
    const items = [
      make({ id: 1, occurred_at: new Date(2026, 8, 11, 7, 0).toISOString() }),
      make({ id: 2, occurred_at: new Date(2026, 8, 12, 7, 0).toISOString() }),
      make({ id: 3, occurred_at: new Date(2026, 8, 12, 6, 0).toISOString() }),
    ];
    expect(sortByOccurredDesc(items).map((item) => item.id)).toEqual([2, 3, 1]);
    const days = groupByDay(items, now);
    expect(days).toHaveLength(2);
    expect(days[0].label).toBe("Hoy");
    expect(days[0].items.map((item) => item.id)).toEqual([2, 3]);
    expect(days[0].appliedLiters).toBe(6000);
  });

  it("resume solo registros vigentes y calcula el desvío con recomendación", () => {
    const summary = summarize([
      make({ id: 1, applied_liters: "3000", recommended_liters: "3200" }),
      make({ id: 2, applied_liters: "5000", recommended_liters: null }),
      make({ id: 3, applied_liters: "9999", recommended_liters: "9999", status: "corregido" }),
      make({ id: 4, applied_liters: "9999", recommended_liters: "9999", status: "anulado" }),
    ]);
    expect(summary.activeCount).toBe(2);
    expect(summary.appliedLiters).toBe(8000);
    expect(summary.recommendedLiters).toBe(3200);
    expect(summary.withRecommendation).toBe(1);
    expect(summary.deviation).toBe(-200);
    expect(summary.level).toBe("under");
  });

  it("no inventa desvío si ningún vigente tiene recomendación", () => {
    const summary = summarize([make({ recommended_liters: null })]);
    expect(summary.deviation).toBeNull();
    expect(summary.level).toBe("none");
  });

  it("cuenta por estado incluyendo el total", () => {
    expect(
      countByStatus([
        make({ id: 1, status: "activo" }),
        make({ id: 2, status: "activo" }),
        make({ id: 3, status: "corregido" }),
        make({ id: 4, status: "anulado" }),
      ]),
    ).toEqual({ todos: 4, activo: 2, corregido: 1, anulado: 1 });
  });
});

describe("búsqueda y filtros", () => {
  it("busca sin distinguir mayúsculas por parcela, nota o número", () => {
    const item = make({ id: 42, note: "Riego de prueba" });
    expect(matchesQuery(item, "norte")).toBe(true);
    expect(matchesQuery(item, "PRUEBA")).toBe(true);
    expect(matchesQuery(item, "42")).toBe(true);
    expect(matchesQuery(item, "sur")).toBe(false);
    expect(matchesQuery(item, "  ")).toBe(true);
  });

  it("filtra por período de 7 y 30 días", () => {
    const recent = make({ occurred_at: new Date(2026, 8, 10, 8, 0).toISOString() });
    const old = make({ occurred_at: new Date(2026, 7, 20, 8, 0).toISOString() });
    expect(matchesPeriod(recent, "7d", now)).toBe(true);
    expect(matchesPeriod(old, "7d", now)).toBe(false);
    expect(matchesPeriod(old, "30d", now)).toBe(true);
    expect(matchesPeriod(old, "todo", now)).toBe(true);
    expect(matchesPeriod(make({ occurred_at: "no-es-fecha" }), "todo", now)).toBe(false);
  });

  it("un rango manual tiene prioridad sobre el período", () => {
    const item = make({ occurred_at: new Date(2026, 7, 20, 8, 0).toISOString() });
    expect(matchesPeriod(item, "7d", now, "2026-08-01", "2026-08-31")).toBe(true);
    expect(matchesPeriod(item, "todo", now, "2026-09-01", null)).toBe(false);
    expect(matchesPeriod(item, "todo", now, null, "2026-08-01")).toBe(false);
  });

  it("combina estado, parcela, búsqueda y período", () => {
    const items = [
      make({ id: 1, plot_id: 1, occurred_at: new Date(2026, 8, 11, 8, 0).toISOString() }),
      make({ id: 2, plot_id: 2, occurred_at: new Date(2026, 8, 11, 8, 0).toISOString() }),
      make({ id: 3, plot_id: 1, status: "anulado" }),
    ];
    const result = filterIrrigations(
      items,
      { ...EMPTY_FILTERS, status: "activo", plotId: 1, period: "7d", query: "norte" },
      now,
    );
    expect(result.map((item) => item.id)).toEqual([1]);
  });

  it("detecta si hay filtros activos", () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, query: " " })).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, status: "activo" })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, period: "7d" })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, from: "2026-09-01" })).toBe(true);
  });
});

describe("trazabilidad", () => {
  it("encuentra el registro anterior y el que reemplazó", () => {
    const previous = make({ id: 1, status: "corregido" });
    const current = make({ id: 2, supersedes_id: 1 });
    const next = make({ id: 3, supersedes_id: 2, status: "corregido" });
    const chain = correctionChain([previous, current, next], current);
    expect(chain.previous?.id).toBe(1);
    expect(chain.next?.id).toBe(3);
  });

  it("devuelve null cuando no hay cadena", () => {
    const chain = correctionChain([make()], make({ id: 99 }));
    expect(chain.previous).toBeNull();
    expect(chain.next).toBeNull();
  });
});
