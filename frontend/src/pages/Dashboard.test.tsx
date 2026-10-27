import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Dashboard } from "./Dashboard";
import { plots, evaluations, sensors, farmers } from "../test/fixtures";

const api = vi.hoisted(() => ({ listPlots: vi.fn(), listFarmers: vi.fn(), listSensors: vi.fn(), listEvaluations: vi.fn(), listIrrigations: vi.fn() }));
vi.mock("../api/endpoints", () => api);
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function setup(): void {
  api.listPlots.mockResolvedValue(plots);
  api.listFarmers.mockResolvedValue(farmers);
  api.listSensors.mockResolvedValue(sensors);
  api.listEvaluations.mockResolvedValue(evaluations.map((item) => ({ ...item, evaluated_at: new Date().toISOString(), next_at: new Date(Date.now() + 3600000).toISOString() })));
  api.listIrrigations.mockResolvedValue([]);
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
}

describe("Resumen del técnico", () => {
  it("presenta indicadores, prioridades y acceso a sensores", async () => {
    setup();
    const indicators = await screen.findByRole("region", { name: "Indicadores del campo" });
    expect(within(indicators).getByText("Parcelas activas")).toBeInTheDocument();
    expect(within(indicators).getByText("Evaluadas hoy")).toBeInTheDocument();
    expect(within(indicators).getByText("Parcelas por revisar")).toBeInTheDocument();
    expect(within(indicators).getByText("Agua aplicada hoy")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Prioridades de hoy" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Gestionar sensores/ })).toHaveAttribute("href", "/sensores");
  });

  it("mantiene los indicadores disponibles e informa cuando una fuente falla", async () => {
    setup();
    await screen.findByRole("region", { name: "Indicadores del campo" });
    api.listSensors.mockRejectedValue(new Error("Sin conexión"));
    // La actualización se activa con el único botón del encabezado.
    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("sensores"));
    expect(screen.getByText("Parcelas activas")).toBeInTheDocument();
  });

  it("muestra las fuentes no disponibles al fallar la primera carga", async () => {
    api.listPlots.mockResolvedValue(plots);
    api.listFarmers.mockResolvedValue(farmers);
    api.listSensors.mockRejectedValue(new Error("Sin conexión"));
    api.listEvaluations.mockResolvedValue(evaluations);
    api.listIrrigations.mockResolvedValue([]);
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("sensores"));
    expect(screen.getByRole("heading", { name: "Prioridades de hoy" })).toBeInTheDocument();
  });
});