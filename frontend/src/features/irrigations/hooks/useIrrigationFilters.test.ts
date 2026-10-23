import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import type { Irrigation } from "@/api/types";
import { useIrrigationFilters } from "./useIrrigationFilters";

afterEach(() => cleanup());

function make(id: number, overrides: Partial<Irrigation> = {}): Irrigation {
  return {
    id,
    plot_id: 1,
    evaluation_id: null,
    supersedes_id: null,
    occurred_at: new Date().toISOString(),
    recommended_liters: "3000",
    applied_liters: "3000",
    origin: "manual",
    note: null,
    status: "activo",
    plot: { id: 1, name: "Parcela Norte" } as Irrigation["plot"],
    ...overrides,
  };
}

const items = [
  make(1, { applied_liters: "3200" }),
  make(2, { applied_liters: "5000", recommended_liters: null }),
  make(3, { status: "corregido" }),
  make(4, { status: "anulado", note: "No se regó" }),
];

describe("useIrrigationFilters", () => {
  it("deriva resumen, conteos y días", () => {
    const { result } = renderHook(() => useIrrigationFilters(items));
    expect(result.current.total).toBe(4);
    expect(result.current.summary.activeCount).toBe(2);
    expect(result.current.counts).toEqual({ todos: 4, activo: 2, corregido: 1, anulado: 1 });
    expect(result.current.days).toHaveLength(1);
    expect(result.current.hasFilters).toBe(false);
  });

  it("filtra por estado y búsqueda, y permite limpiar", () => {
    const { result } = renderHook(() => useIrrigationFilters(items));

    act(() => result.current.update({ status: "anulado" }));
    expect(result.current.filtered.map((item) => item.id)).toEqual([4]);
    expect(result.current.summary.activeCount).toBe(2);
    expect(result.current.counts).toEqual({ todos: 4, activo: 2, corregido: 1, anulado: 1 });
    expect(result.current.hasFilters).toBe(true);

    act(() => result.current.update({ status: "todos", query: "norte" }));
    expect(result.current.filtered).toHaveLength(4);
    expect(result.current.counts.todos).toBe(4);

    act(() => result.current.reset());
    expect(result.current.filtered).toHaveLength(4);
    expect(result.current.hasFilters).toBe(false);
  });
});
