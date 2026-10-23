import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { IrrigationHeader } from "./IrrigationHeader";

afterEach(() => cleanup());

describe("IrrigationHeader", () => {
  it("usa el copy de staff y expone la acción principal", () => {
    const onCreate = vi.fn();
    render(<IrrigationHeader isStaff onCreate={onCreate} />);

    expect(screen.getByRole("heading", { level: 1, name: "Historial de riego" })).toBeInTheDocument();
    expect(screen.getByText("Operación")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /Modo campo/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Registrar riego/ }));
    expect(onCreate).toHaveBeenCalledOnce();
  });

  it("usa el copy de agricultor", () => {
    render(<IrrigationHeader isStaff={false} onCreate={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 1, name: "Mis riegos" })).toBeInTheDocument();
    expect(screen.getByText("Tu campo")).toBeInTheDocument();
    expect(screen.queryByText("Historial de riego")).not.toBeInTheDocument();
  });
});
