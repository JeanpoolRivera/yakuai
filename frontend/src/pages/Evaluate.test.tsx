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
afterEach(()=>{cleanup();vi.clearAllMocks();});
async function evaluateRiega():Promise<void> {
 api.listPlots.mockResolvedValue(plots);
 api.listEvaluations.mockResolvedValue([]);
 api.evaluatePlot.mockResolvedValue(evaluations[0]);
 render(<MemoryRouter><Evaluate/></MemoryRouter>);
 await screen.findByRole("option",{name:/El Molino/});
 fireEvent.change(screen.getByLabelText(/Parcela/),{target:{value:"1"}});
 fireEvent.click(screen.getByRole("button",{name:"Evaluar riego"}));
 await screen.findByRole("button",{name:"Ya regué"});
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
  expect(await screen.findByText(/2,250/)).toBeInTheDocument();
 });
 const incompleteBase = {
  id:10,plot_id:1,evaluated_at:new Date().toISOString(),stage:null,
  inputs_snapshot:{},min_liters:null,max_liters:null,confidence:null,
  next_at:null,is_critical:false,
 };
 async function renderAndSelect():Promise<void> {
  render(<MemoryRouter><Evaluate/></MemoryRouter>);
  await screen.findByRole("option",{name:/El Molino/});
  fireEvent.change(screen.getByLabelText(/Parcela/),{target:{value:"1"}});
 }
 it("orienta a sensores cuando falta humedad válida",async()=>{
  api.listPlots.mockResolvedValue(plots);
  api.listEvaluations.mockResolvedValue([]);
  api.evaluatePlot.mockRejectedValue(new ApiError("Faltan datos.",422,{},{...incompleteBase,result:"incompleta",reason:"sin_humedad_valida"}));
  await renderAndSelect();
  fireEvent.click(screen.getByRole("button",{name:"Evaluar riego"}));
  const link = await screen.findByRole("link",{name:/Ir a sensores/});
  expect(link).toHaveAttribute("href","/sensores");
  expect(screen.getByText(/ahora mismo/)).toBeInTheDocument();
 });
 it("orienta a clima cuando falta pronóstico vigente",async()=>{
  api.listPlots.mockResolvedValue(plots);
  api.listEvaluations.mockResolvedValue([]);
  api.evaluatePlot.mockRejectedValue(new ApiError("Faltan datos.",422,{},{...incompleteBase,result:"incompleta",reason:"sin_clima_valido"}));
  await renderAndSelect();
  fireEvent.click(screen.getByRole("button",{name:"Evaluar riego"}));
  const link = await screen.findByRole("link",{name:/Ir a clima/});
  expect(link).toHaveAttribute("href","/clima");
 });
});
