import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { Irrigation } from "@/api/types";
import { groupByDay } from "../utils";
import { IrrigationLedger } from "./IrrigationLedger";

afterEach(() => cleanup());

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

describe("IrrigationLedger", () => {
it("renderiza tabla con encabezados y filas", () => {
    const items = [
      make({ id: 1, applied_liters: "320", recommended_liters: "300" }),
      make({ id: 2, applied_liters: "480", recommended_liters: "500" }),
      make({
        id: 3,
        applied_liters: "360",
        recommended_liters: "500",
        status: "anulado",
        occurred_at: new Date(2026, 8, 11, 8, 0).toISOString(),
      }),
    ];
    render(<IrrigationLedger days={groupByDay(items, now)} onOpen={vi.fn()} irrigations={items} />);

    // Tabla presente
    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();

    // Encabezados
    expect(within(table).getByRole("columnheader", { name: "Fecha" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "Parcela" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "Recomendado" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "Aplicado" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "Diferencia" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "Estado" })).toBeInTheDocument();

    // Filas de datos (header + 3 data rows)
    expect(within(table).getAllByRole("row")).toHaveLength(4);
    expect(within(table).getAllByRole("cell", { name: "Parcela Norte" })).toHaveLength(3);
    expect(within(table).getByText("Anulado")).toBeInTheDocument();
    // 320 vs 300 = +6.6% -> Cumplido (dentro de 10%)
    // 480 vs 500 = -4% -> Cumplido
    // 360 vs 500 pero status anulado -> celda de estado muestra "Anulado"
    expect(within(table).getAllByRole("cell", { name: "Cumplido" })).toHaveLength(2);
    expect(within(table).getByText("Anulado")).toBeInTheDocument();
  });

  it("abre el detalle al hacer clic en una fila", () => {
    const onOpen = vi.fn();
    const item = make({ id: 7 });
    render(<IrrigationLedger days={groupByDay([item], now)} onOpen={onOpen} irrigations={[item]} />);

    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    // First row is header, second is data row
    fireEvent.click(rows[1]);
    expect(onOpen).toHaveBeenCalledWith(item);
  });

  it("muestra 'Sin recomendación' cuando no hay recomendación", () => {
    const item = make({ recommended_liters: null, applied_liters: "320" });
    render(<IrrigationLedger days={groupByDay([item], now)} onOpen={vi.fn()} irrigations={[item]} />);

    const table = screen.getByRole("table");
    expect(within(table).getByText("Sin recomendación")).toBeInTheDocument();
    // "—" aparece en Recomendado y Diferencia (2 celdas; Aplicado sí tiene 320 L)
    expect(within(table).getAllByRole("cell", { name: "—" })).toHaveLength(2);
  });

  it("muestra KPIs: gráfico 7 días y cumplimiento", () => {
    const items = [
      make({ id: 1, applied_liters: "320", recommended_liters: "300" }),
      make({ id: 2, applied_liters: "480", recommended_liters: "500" }),
    ];
    render(<IrrigationLedger days={groupByDay(items, now)} onOpen={vi.fn()} irrigations={items} />);

    // KPI cards
    expect(screen.getByText("Últimos 7 días")).toBeInTheDocument();
    expect(screen.getByText("Cumplimiento")).toBeInTheDocument();
    expect(screen.getByText(/100 %/)).toBeInTheDocument(); // 100% cumplimiento
  });
});

describe("IrrigationLedger (escritorio - matchMedia)", () => {
  it("renderiza tabla también en desktop (matchMedia true)", () => {
    const mockViewport = (desktop: boolean) => {
      window.matchMedia = ((query: string) => ({
        matches: desktop && query.includes("min-width"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })) as unknown as typeof window.matchMedia;
    };

    mockViewport(true);
    const items = [
      make({ id: 1, applied_liters: "320", recommended_liters: "300" }),
      make({ recommended_liters: null, applied_liters: "400" }),
    ];
    render(<IrrigationLedger days={groupByDay(items, now)} onOpen={vi.fn()} irrigations={items} />);

    // En desktop también renderiza tabla (no lista)
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Sin recomendación")).toBeInTheDocument();
    expect(screen.getByText(/100 %/)).toBeInTheDocument(); // cumplimiento
  });
});