import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Evaluate } from "./Evaluate";
import { ApiError } from "../api/client";
import { plots, evaluations, irrigations } from "../test/fixtures";

const api = vi.hoisted(() => ({
  listPlots: vi.fn(), listEvaluations: vi.fn(), listIrrigations: vi.fn(),
  evaluatePlot: vi.fn(), createIrrigation: vi.fn(), getEvaluationMessage: vi.fn(), refreshWeather: vi.fn(),
}));
vi.mock("../api/endpoints", () => api);
const auth = vi.hoisted(() => ({ role: "tecnico" }));
vi.mock("../app/auth-context", () => ({ useAuth: () => auth }));
afterEach(() => { cleanup(); vi.clearAllMocks(); localStorage.clear(); document.documentElement.classList.remove("field-mode"); auth.role = "tecnico"; });

async function selectPlot(id = 1): Promise<void> {
  const select = await screen.findByLabelText("Selecciona una parcela");
  fireEvent.change(select, { target: { value: String(id) } });
  await waitFor(() => expect(screen.getByRole("button", { name: "Actualizar" })).toBeEnabled());
}
async function evaluatePlot(): Promise<void> {
  fireEvent.click(screen.getByRole("button", { name: "Evaluar ahora" }));
  await screen.findByRole("heading", { name: "Es momento de regar" });
  await waitFor(() => expect(api.listEvaluations).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(screen.getByRole("button", { name: "Actualizar" })).toBeEnabled());
}
async function setup(result = evaluations[0]): Promise<void> {
  api.listPlots.mockResolvedValue(plots);
  api.listEvaluations.mockResolvedValue([]);
  api.refreshWeather.mockResolvedValue({});
  api.evaluatePlot.mockResolvedValue(result);
  render(<MemoryRouter><Evaluate /></MemoryRouter>);
  await selectPlot();
}

describe("Evaluación de riego", () => {
  it("registra el volumen aplicado y bloquea otro riego reciente", async () => {
    api.listIrrigations.mockResolvedValue(irrigations);
    api.createIrrigation.mockResolvedValue({ id: 2 });
    await setup();
    await evaluatePlot();
    fireEvent.change(screen.getByLabelText("Litros aplicados"), { target: { value: "1600" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar riego" }));
    await waitFor(() => expect(api.listIrrigations).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.getByRole("button", { name: "Registrar riego" })).toBeEnabled());
    expect(api.createIrrigation).not.toHaveBeenCalled();
  });

  it("registra el riego cuando no hay otro vigente reciente", async () => {
    api.listIrrigations.mockResolvedValue([]);
    api.createIrrigation.mockResolvedValue({ id: 2 });
    await setup();
    await evaluatePlot();
    fireEvent.change(screen.getByLabelText("Litros aplicados"), { target: { value: "1600" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar riego" }));
    await waitFor(() => expect(api.createIrrigation).toHaveBeenCalledWith(expect.objectContaining({ plot_id: 1, applied_liters: 1600 })));
    await screen.findByText("Riego registrado correctamente.");
  });

  it("preselecciona la parcela recibida por navegación", async () => {
    api.listPlots.mockResolvedValue(plots);
    api.listEvaluations.mockResolvedValue([]);
    render(<MemoryRouter initialEntries={[{ pathname: "/", state: { plotId: 2 } }]}><Evaluate /></MemoryRouter>);
    expect(await screen.findByLabelText("Selecciona una parcela")).toHaveValue("2");
    await waitFor(() => expect(screen.getByRole("button", { name: "Actualizar" })).toBeEnabled());
  });

  it("orienta al personal a sensores cuando falta humedad válida", async () => {
    const incomplete = { ...evaluations[0], result: "incompleta", reason: "sin_humedad_valida" };
    await setup();
    api.evaluatePlot.mockRejectedValue(new ApiError("Faltan datos.", 422, {}, incomplete));
    fireEvent.click(screen.getByRole("button", { name: "Evaluar ahora" }));
    expect(await screen.findByRole("link", { name: "Revisar sensores" })).toHaveAttribute("href", "/sensores");
    await waitFor(() => expect(screen.getByRole("button", { name: "Evaluar ahora" })).toBeEnabled());
  });

  it("descarta la evaluación cuando cambia la parcela", async () => {
    await setup();
    await evaluatePlot();
    fireEvent.change(screen.getByLabelText("Selecciona una parcela"), { target: { value: "2" } });
    expect(screen.queryByRole("heading", { name: "Es momento de regar" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Evaluar ahora" })).toBeEnabled();
    await waitFor(() => expect(screen.getByRole("button", { name: "Actualizar" })).toBeEnabled());
  });

  it("muestra el historial reciente de la parcela", async () => {
    api.listPlots.mockResolvedValue(plots);
    api.listEvaluations.mockResolvedValue([evaluations[0]]);
    render(<MemoryRouter><Evaluate /></MemoryRouter>);
    await selectPlot();
    await waitFor(() => expect(api.listEvaluations).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.getByRole("button", { name: "Actualizar" })).toBeEnabled());
    expect(screen.getByText("Evaluaciones recientes")).toBeInTheDocument();
  });

  it("oculta al agricultor las acciones exclusivas del personal", async () => {
    auth.role = "agricultor";
    await setup({ ...evaluations[0], result: "incompleta", reason: "sin_humedad_valida" });
    fireEvent.click(screen.getByRole("button", { name: "Evaluar ahora" }));
    await screen.findByText("Contacta a tu técnico para actualizar los datos de esta parcela.");
    await waitFor(() => expect(screen.getByRole("button", { name: "Evaluar ahora" })).toBeEnabled());
    expect(screen.queryByRole("link", { name: "Revisar sensores" })).not.toBeInTheDocument();
  });
});