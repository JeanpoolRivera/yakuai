import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { Plots } from "./Plots";
import { farmers, crops, soils } from "../test/fixtures";

type MockDrawResult = {
  ring: Array<[number, number]>;
  lat: number;
  lng: number;
  areaM2: number;
};

const { testRing, api } = vi.hoisted(() => ({
  testRing: [
    [-75.2833, -12.0667],
    [-75.28321, -12.0667],
    [-75.28321, -12.06661],
    [-75.2833, -12.06661],
  ] as Array<[number, number]>,
  api: {
    listPlots: vi.fn(),
    listFarmers: vi.fn(),
    listCrops: vi.fn(),
    listSoils: vi.fn(),
    createPlot: vi.fn(),
    updatePlot: vi.fn(),
  },
}));

vi.mock("@/api/endpoints", () => api);
vi.mock("@/components/shadcn/plot-map", () => ({
  PlotMap: (props: {
    onDraw?: (result: MockDrawResult) => void;
    onClearBoundary?: () => void;
  }) => (
    <div data-testid="plot-map">
      <button type="button" onClick={() => props.onDraw?.({ ring: [], lat: -12.07, lng: -75.28, areaM2: 0 })}>
        Fijar punto de prueba
      </button>
      <button type="button" onClick={() => props.onDraw?.({ ring: testRing, lat: -12.07, lng: -75.28, areaM2: 98 })}>
        Aplicar contorno de prueba
      </button>
      <button type="button" onClick={() => props.onClearBoundary?.()}>
        Limpiar contorno de prueba
      </button>
    </div>
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function mockLoaded(): void {
  api.listPlots.mockResolvedValue([]);
  api.listFarmers.mockResolvedValue(farmers);
  api.listCrops.mockResolvedValue(crops);
  api.listSoils.mockResolvedValue(soils);
  api.createPlot.mockResolvedValue({});
  api.updatePlot.mockResolvedValue({});
}

async function openWizard(): Promise<void> {
  render(<Plots />);
  await screen.findByText("Aún no hay parcelas");
  fireEvent.click(screen.getByRole("button", { name: "Registrar parcela" }));
  await screen.findByRole("dialog", { name: "Registrar parcela" });
}

describe("Registro de parcelas con mapa", () => {
  it("valida el nombre antes de avanzar", async () => {
    mockLoaded();
    await openWizard();

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(await screen.findByText("Completa el nombre, agricultor y ubicación.")).toBeInTheDocument();
  });

  it("conserva el punto fijo, guarda el contorno y calcula el área en el formulario", async () => {
    mockLoaded();
    await openWizard();

    fireEvent.change(screen.getByLabelText(/Nombre de la parcela/), { target: { value: "Parcela de prueba" } });
    fireEvent.click(screen.getByRole("button", { name: "Fijar punto de prueba" }));
    expect(screen.getByLabelText(/Latitud/)).toHaveValue("-12.07");
    expect(screen.getByLabelText(/Longitud/)).toHaveValue("-75.28");

    fireEvent.click(screen.getByRole("button", { name: "Aplicar contorno de prueba" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    fireEvent.change(screen.getByLabelText(/Fecha de siembra/), { target: { value: "2026-10-26" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByLabelText(/Área/)).toHaveValue(98);
    fireEvent.click(screen.getByRole("button", { name: "Crear parcela" }));

    await waitFor(() => expect(api.createPlot).toHaveBeenCalledWith(expect.objectContaining({
      name: "Parcela de prueba",
      latitude: -12.07,
      longitude: -75.28,
      boundary: [testRing],
      area_m2: 98,
      area_origin: "dibujo",
    })));
  });
});
