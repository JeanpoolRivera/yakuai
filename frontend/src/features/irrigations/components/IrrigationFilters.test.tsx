import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Plot } from "@/api/types";
import { EMPTY_FILTERS } from "../utils";
import { IrrigationFilters } from "./IrrigationFilters";

afterEach(() => cleanup());

const plots = [
  { id: 1, name: "Parcela Norte" },
  { id: 2, name: "Parcela Sur" },
] as Plot[];

const counts = { todos: 7, activo: 4, corregido: 2, anulado: 1 };

function renderFilters(overrides: Partial<React.ComponentProps<typeof IrrigationFilters>> = {}) {
  const props: React.ComponentProps<typeof IrrigationFilters> = {
    filters: EMPTY_FILTERS,
    counts,
    plots,
    isStaff: true,
    hasFilters: false,
    total: 7,
    onChange: vi.fn(),
    onReset: vi.fn(),
    ...overrides,
  };
  render(<IrrigationFilters {...props} />);
  return props;
}

describe("IrrigationFilters", () => {
  it("muestra contadores y filtra por estado", () => {
    const props = renderFilters();

    expect(screen.getByRole("button", { name: /Vigentes 4/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Anulados 1/ }));
    expect(props.onChange).toHaveBeenCalledWith({ status: "anulado" });
  });

  it("muestra el filtro de parcela solo para staff y sin abrir Más filtros", () => {
    const { unmount } = render(
      <IrrigationFilters
        filters={EMPTY_FILTERS}
        counts={counts}
        plots={plots}
        isStaff
        hasFilters={false}
        total={7}
        onChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Parcela")).toBeInTheDocument();
    unmount();

    renderFilters({ isStaff: false });
    expect(screen.queryByLabelText("Parcela")).not.toBeInTheDocument();
  });

  it("cambia período, parcela y rango de fechas", () => {
    const props = renderFilters();

    fireEvent.click(screen.getByRole("button", { name: "30 días" }));
    expect(props.onChange).toHaveBeenCalledWith({ period: "30d", from: null, to: null });

    fireEvent.change(screen.getByLabelText("Parcela"), { target: { value: "2" } });
    expect(props.onChange).toHaveBeenCalledWith({ plotId: 2 });

    fireEvent.click(screen.getByRole("button", { name: /Más filtros/ }));
    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "2026-09-01" } });
    expect(props.onChange).toHaveBeenCalledWith({ from: "2026-09-01", period: "todo" });

    fireEvent.change(screen.getByLabelText("Hasta"), { target: { value: "2026-09-30" } });
    expect(props.onChange).toHaveBeenCalledWith({ to: "2026-09-30", period: "todo" });
  });

  it("permite limpiar filtros solo cuando hay filtros activos", () => {
    const props = renderFilters({ hasFilters: true });
    const clear = screen.getByRole("button", { name: /Limpiar filtros/ });
    fireEvent.click(clear);
    expect(props.onReset).toHaveBeenCalledOnce();
  });

  it("muestra el total de resultados", () => {
    renderFilters({ total: 3 });
    expect(screen.getByText("3 registros")).toBeInTheDocument();
  });
});
