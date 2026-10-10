import {describe,it,expect,vi,afterEach} from "vitest";
import {render,screen,cleanup} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {Dashboard} from "./Dashboard";
import {plots,sensors,evaluations} from "../test/fixtures";
const api = vi.hoisted(()=>({
 listPlots:vi.fn(),
 listSensors:vi.fn(),
 listAlerts:vi.fn(),
 listEvaluations:vi.fn(),
 getMetricsSummary:vi.fn(),
}));
vi.mock("../api/endpoints",()=>api);
afterEach(()=>{cleanup();vi.clearAllMocks();});
function mockLoaded(alerts:unknown[]):void {
 api.listPlots.mockResolvedValue(plots);
 api.listSensors.mockResolvedValue(sensors);
 api.listAlerts.mockResolvedValue(alerts);
 api.listEvaluations.mockResolvedValue(evaluations);
 api.getMetricsSummary.mockResolvedValue({evaluations_riega:1});
}
describe("Panel técnico",()=>{
 it("enlaza cada KPI a su módulo y muestra frescura",async()=>{
  mockLoaded([
   {tipo:"sensor_sin_datos",mensaje:"Sensor callado.",plot_id:1},
   {tipo:"humedad_critica",mensaje:"Humedad crítica.",plot_id:2},
  ]);
  render(<MemoryRouter><Dashboard/></MemoryRouter>);
  await screen.findByText("Parcelas en seguimiento");
  expect(screen.getByRole("link",{name:/Parcelas en seguimiento/})).toHaveAttribute("href","/parcelas");
  expect(screen.getByRole("link",{name:/Necesitan riego/})).toHaveAttribute("href","/evaluar");
  expect(screen.getByRole("link",{name:/Sensores operativos/})).toHaveAttribute("href","/sensores");
  expect(screen.getByRole("link",{name:/Alertas por revisar/})).toHaveAttribute("href","/alertas");
  expect(screen.getByText(/Actualizado ahora mismo/)).toBeInTheDocument();
 });
 it("prioriza las alertas críticas",async()=>{
  mockLoaded([
   {tipo:"sensor_sin_datos",mensaje:"Sensor callado.",plot_id:1},
   {tipo:"humedad_critica",mensaje:"Humedad crítica.",plot_id:2},
  ]);
  render(<MemoryRouter><Dashboard/></MemoryRouter>);
  await screen.findByText("Parcelas en seguimiento");
  const items = screen.getAllByText(/Sensor callado\.|Humedad crítica\./);
  expect(items[0]).toHaveTextContent("Humedad crítica.");
 });
 it("muestra todo al día sin alertas",async()=>{
  mockLoaded([]);
  render(<MemoryRouter><Dashboard/></MemoryRouter>);
  expect(await screen.findByText("Todo al día")).toBeInTheDocument();
 });
});
