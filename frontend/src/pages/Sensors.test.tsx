import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Sensors } from "./Sensors";
import { plots, sensors } from "../test/fixtures";

const api = vi.hoisted(() => ({ listSensors: vi.fn(), listPlots: vi.fn(), createSensor: vi.fn(), createMeasurement: vi.fn() }));
vi.mock("../api/endpoints", () => api);
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function renderSensors(records = sensors): void {
  api.listSensors.mockResolvedValue(records);
  api.listPlots.mockResolvedValue(plots);
  render(<Sensors />);
}

describe("Sensores", () => {
  it("registra un sensor de humedad con referencias de calibración", async () => {
    renderSensors([]);
    await screen.findByRole("heading", { name: "Sensores" });
    fireEvent.click(screen.getAllByRole("button", { name: "Registrar sensor" })[0]);
    const dialog = await screen.findByRole("dialog", { name: "Registrar sensor" });
    expect(within(dialog).getByLabelText(/Seco ref/)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/Mojado ref/)).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText("Tipo de sensor"), { target: { value: "lluvia" } });
    expect(within(dialog).queryByLabelText(/Seco ref/)).not.toBeInTheDocument();
  });

  it("rechaza lecturas fuera de rango sin enviar datos", async () => {
    renderSensors([{ ...sensors[0], id: 11, type: "humedad" }]);
    await screen.findByText("Dispositivos");
    fireEvent.click(screen.getAllByRole("button", { name: /Registrar lectura/ })[0]);
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Valor crudo"), { target: { value: "2000" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar lectura" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(/0–1023/);
    expect(api.createMeasurement).not.toHaveBeenCalled();
  });

  it("guarda una lectura válida con su sensor", async () => {
    api.createMeasurement.mockResolvedValue({ id: 1, quality: "ok", norm_value: 52.86 });
    renderSensors([{ ...sensors[0], id: 11, type: "humedad" }]);
    await screen.findByText("Dispositivos");
    fireEvent.click(screen.getAllByRole("button", { name: /Registrar lectura/ })[0]);
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Valor crudo"), { target: { value: "650" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar lectura" }));
    await waitFor(() => expect(api.createMeasurement).toHaveBeenCalledWith(expect.objectContaining({ sensor_id: 11, raw_value: 650, origin: "manual" })));
  });

  it("filtra el inventario por parcela y muestra detalle de una lectura", async () => {
    const records = [{ ...sensors[0], id: 21, plot_id: plots[0].id, latest_measurement: { id: 7, measured_at: new Date().toISOString(), raw_value: "650", norm_value: "52.86", quality: "ok" } }, { ...sensors[1], id: 22, plot_id: plots[1].id }];
    renderSensors(records);
    await screen.findByText("Dispositivos");
    fireEvent.change(screen.getByLabelText("Filtrar por parcela"), { target: { value: String(plots[0].id) } });
    expect(screen.getAllByText(/#21/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/#22/)).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Detalle" })[0]);
    const dialog = await screen.findByRole("dialog", { name: "Sensor #21" });
    expect(within(dialog).getByText("53 %")).toBeInTheDocument();
    expect(within(dialog).getByText(/Medido el/)).toBeInTheDocument();
  });
});