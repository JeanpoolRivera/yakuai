import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import type { Plot } from "@/api/types";
import { plots } from "@/test/fixtures";
import { PlotSelector } from "./PlotSelector";

afterEach(() => cleanup());

const plotList = plots as unknown as Plot[];

function setup(overrides: Partial<React.ComponentProps<typeof PlotSelector>> = {}) {
  const onSelect = vi.fn();
  const onEvaluate = vi.fn();
  render(
    <PlotSelector
      plots={plotList}
      selectedId={1}
      onSelect={onSelect}
      onEvaluate={onEvaluate}
      showFarmerBadge
      {...overrides}
    />,
  );
  return { onSelect, onEvaluate };
}

describe("PlotSelector", () => {
  it("marca la parcela activa y muestra el agricultor al técnico", () => {
    setup();
    expect(screen.getByRole("button", { name: "Seleccionar El Molino" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Seleccionar La Esperanza" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getAllByText("Agricultor de demostración")).toHaveLength(3);
    expect(screen.getByText("Goteo")).toBeInTheDocument();
  });

  it("selecciona una parcela y dispara la evaluación", () => {
    const { onSelect, onEvaluate } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Seleccionar La Esperanza" }));
    expect(onSelect).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByRole("button", { name: "Evaluar esta parcela" }));
    expect(onEvaluate).toHaveBeenCalledTimes(1);
  });

  it("filtra por nombre o cultivo y permite limpiar la búsqueda", () => {
    setup();
    const search = screen.getByRole("searchbox", { name: "Buscar parcela o cultivo" });
    fireEvent.change(search, { target: { value: "sauces" } });
    expect(screen.getByRole("button", { name: "Seleccionar Los Sauces" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Seleccionar El Molino" })).not.toBeInTheDocument();
    fireEvent.change(search, { target: { value: "zzz" } });
    expect(screen.getByText("No encontramos esa parcela")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver todas las parcelas" }));
    expect(screen.getByRole("button", { name: "Seleccionar El Molino" })).toBeInTheDocument();
  });

  it("bloquea la evaluación sin parcelas", () => {
    setup({ plots: [], selectedId: null });
    expect(screen.getByText("Sin parcelas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Evaluar esta parcela" })).toBeDisabled();
  });

  it("en móvil abre la lista en una hoja inferior y la cierra al elegir", async () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes("max-width: 1023px"),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;

    try {
      const { onSelect } = setup();
      fireEvent.click(screen.getByRole("button", { name: "Cambiar parcela" }));
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Elegir parcela" })).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Seleccionar La Esperanza" }));
      expect(onSelect).toHaveBeenCalledWith(2);
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    } finally {
      window.matchMedia = original;
    }
  });
});
