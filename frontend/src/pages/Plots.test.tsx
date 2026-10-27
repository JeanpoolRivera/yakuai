import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Plots } from "./Plots";
import { farmers, crops, soils } from "../test/fixtures";

const api = vi.hoisted(() => ({
  listPlots: vi.fn(),
  listFarmers: vi.fn(),
  listCrops: vi.fn(),
  listSoils: vi.fn(),
  createPlot: vi.fn(),
  updatePlot: vi.fn(),
}));

vi.mock("../api/endpoints", () => api);
vi.mock("../components/shadcn/plot-map", () => ({
  PlotMap: (props: {
    initialBasemap?: string;
    mapClassName?: string;
    focus?: { lat: number; lng: number } | null;
    onDraw?: (result: { ring: [number, number][]; lat: number; lng: number; areaM2: number }) => void;
  }) => (
    <div data-testid="plot-map" data-initial-basemap={props.initialBasemap} data-map-height={props.mapClassName} data-has-location={String(Boolean(props.focus))}>
      {props.onDraw ? (
        <button
          type="button"
          onClick={() => props.onDraw?.({
            ring: [[-75.29, -12.05], [-75.28, -12.05], [-75.28, -12.04], [-75.29, -12.04]],
            lat: -12.045,
            lng: -75.285,
            areaM2: 432.16,
          })}
        >
          Simular dibujo de contorno
        </button>
      ) : null}
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
}

async function openWizard(): Promise<void> {
  render(<Plots />);
  await screen.findByText("Aún no hay parcelas");
  fireEvent.click(screen.getAllByRole("button", { name: "Registrar parcela" })[0]);
  await screen.findByRole("dialog", { name: "Registrar parcela" });
}

describe("Asistente de parcelas", () => {
  it("bloquea el avance cuando falta el nombre requerido", async () => {
    mockLoaded();
    await openWizard();

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByLabelText(/Paso 1 de 3/)).toBeInTheDocument();
    expect(screen.getAllByTestId("plot-map")).toHaveLength(1);
    expect(screen.getByTestId("plot-map")).toHaveAttribute("data-initial-basemap", "satellite");
    expect(screen.getByTestId("plot-map")).toHaveAttribute("data-map-height", expect.stringContaining("500px"));
  });

  it("transfiere el área y la ubicación del contorno a la revisión y al registro", async () => {
    mockLoaded();
    api.createPlot.mockResolvedValue({ id: 99 });
    await openWizard();

    expect(screen.getByLabelText("Latitud")).toHaveValue(null);
    expect(screen.getByLabelText("Longitud")).toHaveValue(null);
    expect(screen.getByTestId("plot-map")).toHaveAttribute("data-has-location", "false");
    fireEvent.change(screen.getByLabelText(/Nombre de la parcela/), { target: { value: "Parcela prueba" } });
    fireEvent.click(screen.getByRole("button", { name: "Simular dibujo de contorno" }));
    expect(screen.getByLabelText("Latitud")).toHaveValue(-12.045);
    expect(screen.getByLabelText("Longitud")).toHaveValue(-75.285);

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByLabelText(/Paso 2 de 3/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Fecha de siembra/), { target: { value: "2026-10-25" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByLabelText(/Paso 3 de 3/)).toBeInTheDocument();

    expect(screen.getByLabelText(/Área/)).toHaveValue(432.16);
    expect(screen.getByText("Calculada desde el contorno")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Crear parcela" }));

    await waitFor(() => {
      expect(api.createPlot).toHaveBeenCalledWith(expect.objectContaining({
        name: "Parcela prueba",
        latitude: -12.045,
        longitude: -75.285,
        area_m2: 432.16,
        area_origin: "dibujo",
        boundary: [[[-75.29, -12.05], [-75.28, -12.05], [-75.28, -12.04], [-75.29, -12.04]]],
        crop_id: Number(crops[0].id),
        soil_texture_code: soils[0].code,
      }));
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getAllByTestId("plot-map")).toHaveLength(1);
  });
});


