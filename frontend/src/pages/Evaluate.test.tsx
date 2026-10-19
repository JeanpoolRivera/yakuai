import {describe,it,expect,vi,afterEach} from "vitest";
import {render,screen,fireEvent,cleanup,waitFor} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {Evaluate} from "./Evaluate";
import {ApiError} from "../api/client";
import {plots,evaluations,irrigations} from "../test/fixtures";
const api = vi.hoisted(()=>({
 listPlots:vi.fn(),
 listEvaluations:vi.fn(),
 listIrrigations:vi.fn(),
 evaluatePlot:vi.fn(),
 createIrrigation:vi.fn(),
 getEvaluationMessage:vi.fn(),
 refreshWeather:vi.fn().mockResolvedValue({}),
}));
vi.mock("../api/endpoints",()=>api);
const auth = vi.hoisted(() => ({role:"tecnico"}));
vi.mock("../app/auth",()=>({useAuth:()=>auth}));
afterEach(()=>{cleanup();vi.clearAllMocks();});
async function evaluateRiega():Promise<HTMLElement> {
 api.listPlots.mockResolvedValue(plots);
 api.listEvaluations.mockResolvedValue([]);
 api.evaluatePlot.mockResolvedValue(evaluations[0]);
 const {container} = render(<MemoryRouter><Evaluate/></MemoryRouter>);
 await screen.findByRole("button",{name:"Seleccionar El Molino"});
 fireEvent.click(screen.getByRole("button",{name:"Seleccionar El Molino"}));
 fireEvent.click(screen.getByRole("button",{name:"Evaluar esta parcela"}));
 await screen.findByRole("button",{name:"Ya regué"});
 return container;
}
describe("Confirmar riego",()=>{
 it("bloquea cuando hay un riego activo en las últimas 24 horas",async()=>{
  api.listIrrigations.mockResolvedValue(irrigations);
  await evaluateRiega();
  fireEvent.click(screen.getByRole("button",{name:"Ya regué"}));
  await waitFor(()=>expect(api.listIrrigations).toHaveBeenCalledWith(1));
  expect(api.createIrrigation).not.toHaveBeenCalled();
 });
 it("registra cuando no hay riego reciente",async()=>{
  api.listIrrigations.mockResolvedValue([]);
  api.createIrrigation.mockResolvedValue({id:2});
  await evaluateRiega();
  fireEvent.click(screen.getByRole("button",{name:"Ya regué"}));
  await waitFor(()=>expect(api.createIrrigation).toHaveBeenCalledTimes(1));
  expect(api.createIrrigation).toHaveBeenCalledWith(expect.objectContaining({plot_id:1,applied_liters:1600}));
 });
 it("preselecciona la parcela indicada por navegación",async()=>{
  api.listPlots.mockResolvedValue(plots);
  api.listEvaluations.mockResolvedValue([]);
  render(<MemoryRouter initialEntries={[{pathname:"/",state:{plotId:2}}]}><Evaluate/></MemoryRouter>);
  expect(await screen.findByRole("button",{name:"Seleccionar La Esperanza"})).toHaveAttribute("aria-pressed","true");
 });
});

describe("Datos del plan",()=>{
 it("muestra litros exactos del plan, no el rango",async()=>{
  await evaluateRiega();
  expect(screen.getByText("1,600")).toBeInTheDocument();
  expect(screen.queryByText(/1400–1800/)).not.toBeInTheDocument();
 });
 it("muestra el horario del plan",async()=>{
  await evaluateRiega();
  expect(screen.getByText(/05:30/)).toBeInTheDocument();
 });
 it("muestra la duración del plan",async()=>{
  await evaluateRiega();
  expect(screen.getByText(/1 h 47 min/)).toBeInTheDocument();
 });
 it("muestra la lluvia en las estadísticas",async()=>{
  await evaluateRiega();
  expect(screen.getByText(/2 mm/)).toBeInTheDocument();
 });
});

describe("Orientación cuando faltan datos",()=>{
 const incompleteBase = {
  id:10,plot_id:1,evaluated_at:new Date().toISOString(),stage:null,
  inputs_snapshot:{},min_liters:null,max_liters:null,confidence:null,
  next_at:null,is_critical:false,
 };
 async function renderAndSelect():Promise<void> {
  render(<MemoryRouter><Evaluate/></MemoryRouter>);
  await screen.findByRole("button",{name:"Seleccionar El Molino"});
  fireEvent.click(screen.getByRole("button",{name:"Seleccionar El Molino"}));
 }
 it("orienta a sensores cuando falta humedad válida (técnico)",async()=>{
  api.listPlots.mockResolvedValue(plots);
  api.listEvaluations.mockResolvedValue([]);
  api.evaluatePlot.mockRejectedValue(new ApiError("Faltan datos.",422,{},{...incompleteBase,result:"incompleta",reason:"sin_humedad_valida"}));
  await renderAndSelect();
  fireEvent.click(screen.getByRole("button",{name:"Evaluar esta parcela"}));
  const link = await screen.findByRole("link",{name:/Ir a sensores/});
  expect(link).toHaveAttribute("href","/sensores");
 });
 it("orienta a clima cuando falta pronóstico vigente (técnico)",async()=>{
  api.listPlots.mockResolvedValue(plots);
  api.listEvaluations.mockResolvedValue([]);
  api.evaluatePlot.mockRejectedValue(new ApiError("Faltan datos.",422,{},{...incompleteBase,result:"incompleta",reason:"sin_clima_valido"}));
  await renderAndSelect();
  fireEvent.click(screen.getByRole("button",{name:"Evaluar esta parcela"}));
  const link = await screen.findByRole("link",{name:/Ir a clima/});
  expect(link).toHaveAttribute("href","/clima");
 });
});

describe("Resultado sin riego",()=>{
 it("no muestra botón Ya regué cuando el resultado es no regar",async()=>{
  api.listPlots.mockResolvedValue(plots);
  api.listEvaluations.mockResolvedValue([]);
  api.evaluatePlot.mockResolvedValue(evaluations[1]);
  render(<MemoryRouter><Evaluate/></MemoryRouter>);
  await screen.findByRole("button",{name:"Seleccionar La Esperanza"});
  fireEvent.click(screen.getByRole("button",{name:"Seleccionar La Esperanza"}));
  fireEvent.click(screen.getByRole("button",{name:"Evaluar riego"}));
  await screen.findByText(/No riegues/i);
  expect(screen.queryByRole("button",{name:"Ya regué"})).not.toBeInTheDocument();
 });
});

describe("Separación por rol",()=>{
 it("agricultor no ve el detalle técnico",async()=>{
  auth.role="agricultor";
  await evaluateRiega();
  expect(screen.queryByText(/Ver cálculo técnico/)).not.toBeInTheDocument();
  auth.role="tecnico";
 });
 it("técnico ve el detalle técnico",async()=>{
  await evaluateRiega();
  expect(screen.getByText(/Ver cálculo técnico/)).toBeInTheDocument();
 });
 it("agricultor no ve el historial",async()=>{
  auth.role="agricultor";
  api.listPlots.mockResolvedValue(plots);
  api.listEvaluations.mockResolvedValue([evaluations[0]]);
  api.evaluatePlot.mockResolvedValue(evaluations[0]);
  render(<MemoryRouter><Evaluate/></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button",{name:"Seleccionar El Molino"}));
  fireEvent.click(screen.getByRole("button",{name:"Evaluar riego"}));
  await screen.findByRole("button",{name:"Ya regué"});
  expect(screen.queryByText(/Historial reciente/)).not.toBeInTheDocument();
  auth.role="tecnico";
 });
 it("técnico ve el historial",async()=>{
  api.listPlots.mockResolvedValue(plots);
  api.listEvaluations.mockResolvedValue([evaluations[0]]);
  api.evaluatePlot.mockResolvedValue(evaluations[0]);
  render(<MemoryRouter><Evaluate/></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button",{name:"Seleccionar El Molino"}));
  fireEvent.click(screen.getByRole("button",{name:"Evaluar riego"}));
  await screen.findByRole("button",{name:"Ya regué"});
  expect(screen.getByText(/Historial reciente/)).toBeInTheDocument();
 });
 it("agricultor ve Contacta a tu técnico en datos incompletos",async()=>{
  auth.role="agricultor";
  api.listPlots.mockResolvedValue(plots);
  api.listEvaluations.mockResolvedValue([]);
  api.evaluatePlot.mockRejectedValue(new ApiError("Faltan datos",422,{}, {...evaluations[0],result:"incompleta",reason:"sin_humedad_valida"}));
  render(<MemoryRouter><Evaluate/></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button",{name:"Seleccionar El Molino"}));
  fireEvent.click(screen.getByRole("button",{name:"Evaluar esta parcela"}));
  expect(await screen.findByText(/Contacta a tu técnico/)).toBeInTheDocument();
  expect(screen.queryByRole("link",{name:/Ir a sensores/})).not.toBeInTheDocument();
  auth.role="tecnico";
 });
});

describe("Diseño del hero",()=>{
 it("muestra la cabecera jerarquizada: eyebrow de parcela y veredicto como heading",async()=>{
  await evaluateRiega();
  expect(screen.getByText(/El Molino · Papa · 1,500 m²/)).toBeInTheDocument();
  expect(screen.getByRole("heading",{name:"Toca regar"})).toBeInTheDocument();
 });
 it("marca data-verdict en la tarjeta para el tinte de cabecera",async()=>{
  const container = await evaluateRiega();
  expect(container.querySelector("article.eval-hero")).toHaveAttribute("data-verdict","riega");
 });
 it("usa sentence case en el veredicto, no mayúsculas",async()=>{
  await evaluateRiega();
  const title = screen.getByRole("heading",{name:"Toca regar"});
  expect(title).toHaveClass("eval-hero-title");
  expect(title.textContent).toBe("Toca regar");
 });
});
