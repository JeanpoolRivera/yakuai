import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Irrigation } from "@/api/types";
import { EMPTY_FILTERS, countByStatus, groupByDay, summarize } from "../utils";
import type { UseIrrigationFiltersResult } from "../hooks/useIrrigationFilters";
import type { IrrigationMutationsResult } from "../hooks/useIrrigationMutations";
import type { UseIrrigationsResult } from "../hooks/useIrrigations";
import { IrrigationsWorkspace } from "./IrrigationsWorkspace";

afterEach(() => cleanup());

function make(id: number): Irrigation {
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
  };
}

function setup(items: Irrigation[], overrides: { loading?: boolean; error?: string | null } = {}) {
  const irrigations: UseIrrigationsResult = {
    items,
    plots: [{ id: 1, name: "Parcela Norte" } as UseIrrigationsResult["plots"][number]],
    loading: overrides.loading ?? false,
    error: overrides.error ?? null,
    reload: vi.fn(),
  };
  const filters: UseIrrigationFiltersResult = {
    filters: EMPTY_FILTERS,
    update: vi.fn(),
    reset: vi.fn(),
    filtered: items,
    summary: summarize(items),
    counts: countByStatus(items),
    days: groupByDay(items),
    hasFilters: false,
    total: items.length,
  };
  const mutations: IrrigationMutationsResult = {
    busy: false,
    fieldErrors: {},
    clearFieldErrors: vi.fn(),
    create: vi.fn(),
    correct: vi.fn(),
    annul: vi.fn(),
  };
  render(
    <IrrigationsWorkspace
      isStaff
      irrigations={irrigations}
      filters={filters}
      mutations={mutations}
    />,
  );
  return { irrigations, filters, mutations };
}

describe("IrrigationsWorkspace", () => {
  it("muestra el vacío real con la acción de registrar", () => {
    setup([]);
    expect(screen.getByText("Aún no hay riegos registrados")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Registrar riego/ }).length).toBeGreaterThan(0);
  });

  it("carga de 20 en 20 sin perder el contexto del día", () => {
    const items = Array.from({ length: 25 }, (_, index) => make(index + 1));
    setup(items);

    // Table has header row + 20 data rows = 21 rows total
    
    expect(screen.getAllByRole("row")).toHaveLength(21);

    fireEvent.click(screen.getByRole("button", { name: "Ver 5 registros anteriores" }));

    // After clicking "Mostrar más", should have 25 data rows + header = 26 rows
    expect(screen.getAllByRole("row")).toHaveLength(26);
    expect(screen.queryByRole("button", { name: /Mostrar más/ })).not.toBeInTheDocument();
  });

  it("muestra el error con opción de reintentar", () => {
    const { irrigations } = setup([], { error: "Sin conexión" });
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(irrigations.reload).toHaveBeenCalledOnce();
    expect(screen.getByText("Sin conexión")).toBeInTheDocument();
  });
});
