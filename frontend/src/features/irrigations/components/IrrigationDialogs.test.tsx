import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Irrigation } from "@/api/types";
import { IrrigationAnnulDialog } from "./IrrigationAnnulDialog";
import { IrrigationCorrectDialog } from "./IrrigationCorrectDialog";
import { IrrigationCreateDialog } from "./IrrigationCreateDialog";

afterEach(() => cleanup());

function make(overrides: Partial<Irrigation> = {}): Irrigation {
  return {
    id: 2,
    plot_id: 1,
    evaluation_id: null,
    supersedes_id: null,
    occurred_at: new Date(2026, 8, 12, 6, 30).toISOString(),
    recommended_liters: "1600",
    applied_liters: "1600",
    origin: "manual",
    note: null,
    status: "activo",
    plot: { id: 1, name: "Parcela Norte" } as Irrigation["plot"],
    ...overrides,
  };
}

describe("diálogos de riego", () => {
  it("bloquea el registro si no hay parcelas", () => {
    render(
      <IrrigationCreateDialog
        open
        plots={[]}
        busy={false}
        fieldErrors={{}}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText(/No hay parcelas disponibles/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });

  it("valida y envía la corrección", async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(
      <IrrigationCorrectDialog
        item={make()}
        busy={false}
        fieldErrors={{}}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Agua aplicada corregida/), { target: { value: "2800" } });
    fireEvent.change(screen.getByLabelText(/Motivo/), { target: { value: "Medí mal" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar corrección" }));

    expect(onSubmit).toHaveBeenCalledWith(2, 2800, "Medí mal");
  });

  it("exige motivo y confirma la anulación en dos pasos", async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();
    render(
      <IrrigationAnnulDialog
        item={make()}
        busy={false}
        fieldErrors={{}}
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

    const next = screen.getByRole("button", { name: "Continuar" });
    expect(next).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Motivo de anulación/), { target: { value: "No se regó" } });
    fireEvent.click(next);
    expect(screen.getByText(/No se puede deshacer/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Anular registro" }));
    expect(onSubmit).toHaveBeenCalledWith(2, "No se regó");
  });
});
