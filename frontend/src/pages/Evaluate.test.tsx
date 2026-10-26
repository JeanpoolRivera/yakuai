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
}));
vi.mock("../api/endpoints",()=>api);
const auth = vi.hoisted(() => ({role:"tecnico"}));
vi.mock("../app/auth",()=>({useAuth:()=>auth}));
afterEach(()=>{cleanup();vi.clearAllMocks();localStorage.clear();document.documentElement.classList.remove("field-mode");});
async function evaluateRiega():Promise<void> {
 api.listPlots.mockResolvedValue(plots);
 api.listEvaluations.mockResolvedValue([]);
 api.evaluatePlot.mockResolvedValue(evaluations[0]);
 render(<MemoryRouter><Evaluate/></MemoryRouter>);
 await screen.findByRole("button",{name:"Seleccionar El Molino"});
 fireEvent.click(screen.getByRole("button",{name:"Seleccionar El Molino"}));
 fireEvent.click(screen.getByRole("button",{name:/Obtener recomendación/}));
 await screen.findByRole("button",{name:"Ya regué"});
}
async function submitAppliedWater():Promise<void> {
  fireEvent.click(screen.getByRole("button",{name:"Ya regué"}));
  await screen.findByRole("dialog",{name:"Registrar riego aplicado"});
  fireEvent.change(screen.getByLabelText(/Cantidad que aplicaste/),{target:{value:"1600"}});
  fireEvent.click(screen.getByRole("button",{name:"Registrar cantidad"}));
}

describe("Confirmar riego",()=>{
 it("bloquea cuando hay un riego activo en las últimas 24 horas",async()=>{
  api.listIrrigations.mockResolvedValue(irrigations);
  await evaluateRiega();
  await submitAppliedWater();
  await waitFor(()=>expect(api.listIrrigations).toHaveBeenCalledWith(1));
  expect(api.createIrrigation).not.toHaveBeenCalled();
 });
 it("registra cuando no hay riego reciente",async()=>{
  api.listIrrigations.mockResolvedValue([]);
  api.createIrrigation.mockResolvedValue({id:2});
  await evaluateRiega();
  await submitAppliedWater();
  await waitFor(()=>expect(api.createIrrigation).toHaveBeenCalledTimes(1));
  expect(api.createIrrigation).toHaveBeenCalledWith(expect.objectContaining({plot_id:1,applied_liters:1600}));
 });
 it("preselecciona la parcela indicada por navegación",async()=>{
  api.listPlots.mockResolvedValue(plots);
  api.listEvaluations.mockResolvedValue([]);
  render(<MemoryRouter initialEntries={[{pathname:"/",state:{plotId:2}}]}><Evaluate/></MemoryRouter>);
  expect(await screen.findByRole("button",{name:"Seleccionar La Esperanza"})).toHaveAttribute("aria-pressed","true");
 });
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
 it("orienta a sensores cuando falta humedad válida",async()=>{
  api.listPlots.mockResolvedValue(plots);
  api.listEvaluations.mockResolvedValue([]);
  api.evaluatePlot.mockRejectedValue(new ApiError("Faltan datos.",422,{},{...incompleteBase,result:"incompleta",reason:"sin_humedad_valida"}));
  await renderAndSelect();
  fireEvent.click(screen.getByRole("button",{name:/Obtener recomendación/}));
  const link = await screen.findByRole("link",{name:/Ir a sensores/});
  expect(link).toHaveAttribute("href","/sensores");
  expect(screen.getByText(/ahora mismo/)).toBeInTheDocument();
 });
 it("orienta a clima cuando falta pronóstico vigente",async()=>{
  api.listPlots.mockResolvedValue(plots);
  api.listEvaluations.mockResolvedValue([]);
  api.evaluatePlot.mockRejectedValue(new ApiError("Faltan datos.",422,{},{...incompleteBase,result:"incompleta",reason:"sin_clima_valido"}));
  await renderAndSelect();
  fireEvent.click(screen.getByRole("button",{name:/Obtener recomendación/}));
  const link = await screen.findByRole("link",{name:/Ir a clima/});
  expect(link).toHaveAttribute("href","/clima");
 });
});

describe("Cambio de parcela",()=>{
 it("descarta el resultado al elegir otra parcela",async()=>{
  await evaluateRiega();
  fireEvent.click(screen.getByRole("button",{name:"Seleccionar La Esperanza"}));
  expect(screen.queryByRole("button",{name:"Ya regué"})).not.toBeInTheDocument();
  expect(screen.getByRole("button",{name:/Obtener recomendación/})).not.toBeDisabled();
  expect(screen.queryByRole("heading",{name:"Evaluaciones anteriores"})).not.toBeInTheDocument();
 });
});


describe("Selección e historial",()=>{
 it("muestra el historial de la parcela en un panel plegable",async()=>{
  api.listPlots.mockResolvedValue(plots);
  api.listEvaluations.mockResolvedValue([evaluations[0]]);
  render(<MemoryRouter><Evaluate/></MemoryRouter>);
  const plot=await screen.findByRole("button",{name:"Seleccionar El Molino"});
  fireEvent.click(plot);
  await waitFor(()=>expect(api.listEvaluations).toHaveBeenCalledWith(1));
  expect(screen.queryByText("1,400–1,800 litros")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Ver historial"}));
  expect(await screen.findByText("1,400–1,800 litros")).toBeInTheDocument();
 });
});

describe("Permisos en orientación de evaluación",()=>{
 it("orienta al agricultor sin ofrecer rutas exclusivas del técnico",async()=>{
  auth.role="agricultor";
  api.listPlots.mockResolvedValue(plots);
  api.listEvaluations.mockResolvedValue([]);
  api.evaluatePlot.mockRejectedValue(new ApiError("Faltan datos",422,{}, {...evaluations[0],result:"incompleta",reason:"sin_humedad_valida"}));
  render(<MemoryRouter><Evaluate/></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button",{name:"Seleccionar El Molino"}));
  fireEvent.click(screen.getByRole("button",{name:/Obtener recomendación/}));
  expect(await screen.findByText(/Contacta a tu técnico/)).toBeInTheDocument();
  expect(screen.queryByRole("link",{name:/Ir a sensores/})).not.toBeInTheDocument();
  auth.role="tecnico";
 });
});

describe("Cálculo del técnico",()=>{
 it("muestra los recuadros del cálculo solo al técnico",async()=>{
  api.listPlots.mockResolvedValue(plots);
  api.listEvaluations.mockResolvedValue([]);
  api.evaluatePlot.mockResolvedValue(evaluations[0]);
  render(<MemoryRouter><Evaluate/></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button",{name:"Seleccionar El Molino"}));
  fireEvent.click(screen.getByRole("button",{name:/Obtener recomendación/}));
  await screen.findByRole("button",{name:"Ya regué"});
  expect(screen.getByText("Consultar el cálculo y los datos utilizados")).toBeInTheDocument();
  expect(screen.getByText("ET₀")).toBeInTheDocument();
 });
 it("oculta el cálculo al agricultor",async()=>{
  auth.role="agricultor";
  api.listPlots.mockResolvedValue(plots);
  api.listEvaluations.mockResolvedValue([]);
  api.evaluatePlot.mockResolvedValue(evaluations[0]);
  render(<MemoryRouter><Evaluate/></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button",{name:"Seleccionar El Molino"}));
  fireEvent.click(screen.getByRole("button",{name:/Obtener recomendación/}));
  await screen.findByRole("button",{name:"Ya regué"});
  expect(screen.queryByText("Consultar el cálculo y los datos utilizados")).not.toBeInTheDocument();
  auth.role="tecnico";
 });
});

describe("Modo campo",()=>{
 it("alterna la escala desde el encabezado y conserva la preferencia",async()=>{
  api.listPlots.mockResolvedValue(plots);
  api.listEvaluations.mockResolvedValue([]);
  render(<MemoryRouter><Evaluate/></MemoryRouter>);
  const toggle=await screen.findByRole("switch",{name:"Modo campo"});
  expect(toggle).toHaveAttribute("aria-checked","false");
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-checked","true");
  expect(document.documentElement).toHaveClass("field-mode");
  expect(localStorage.getItem("yakuai-field-mode")).toBe("1");
 });
});
