import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Irrigation } from "@/api/types";
import { fmtNum } from "@/lib/format";
import { IrrigationDetail } from "./IrrigationDetail";

afterEach(() => cleanup());

function make(overrides: Partial<Irrigation> = {}): Irrigation {
  return {
    id: 2,
    plot_id: 1,
    evaluation_id: null,
    supersedes_id: 1,
    occurred_at: new Date(2026, 8, 12, 6, 30).toISOString(),
    recommended_liters: "3000",
    applied_liters: "2800",
    origin: "manual",
    note: "Ajusté el contador",
    status: "activo",
    plot: { id: 1, name: "Parcela Norte" } as Irrigation["plot"],
    ...overrides,
  };
}

const previous = make({ id: 1, supersedes_id: null, status: "corregido", note: null });

describe("IrrigationDetail", () => {
  it("muestra el detalle, la comparación y la trazabilidad", () => {
    const onOpenRelated = vi.fn();
    const onCorrect = vi.fn();
    render(
      <IrrigationDetail
        item={make()}
        items={[previous, make()]}
        open
        onOpenChange={vi.fn()}
        onOpenRelated={onOpenRelated}
        onCorrect={onCorrect}
        onAnnul={vi.fn()}
      />,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Parcela Norte");
    expect(dialog).toHaveTextContent("Registro #2");
    expect(dialog).toHaveTextContent(`${fmtNum(2800)} L`);
    expect(dialog).toHaveTextContent(`${fmtNum(3000)} L`);
    expect(dialog).toHaveTextContent("Ajusté el contador");
    expect(dialog).toHaveTextContent("Manual");
    expect(dialog).toHaveTextContent("Trazabilidad");
    expect(dialog).toHaveTextContent(/Corrige al registro del/);

    fireEvent.click(screen.getByRole("button", { name: "Abrir registro anterior" }));
    expect(onOpenRelated).toHaveBeenCalledWith(previous);

    fireEvent.click(screen.getByRole("button", { name: /Corregir/ }));
    expect(onCorrect).toHaveBeenCalledOnce();
  });

  it("no ofrece acciones de edición para un registro anulado", () => {
    render(
      <IrrigationDetail
        item={make({ status: "anulado", supersedes_id: null, note: "No se regó" })}
        items={[]}
        open
        onOpenChange={vi.fn()}
        onOpenRelated={vi.fn()}
        onCorrect={vi.fn()}
        onAnnul={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("button", { name: "Cerrar" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Corregir/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Anular/ })).not.toBeInTheDocument();
    expect(screen.getByText("Motivo de anulación")).toBeInTheDocument();
  });

  it("no renderiza nada sin registro seleccionado", () => {
    const { container } = render(
      <IrrigationDetail
        item={null}
        items={[]}
        open={false}
        onOpenChange={vi.fn()}
        onOpenRelated={vi.fn()}
        onCorrect={vi.fn()}
        onAnnul={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
