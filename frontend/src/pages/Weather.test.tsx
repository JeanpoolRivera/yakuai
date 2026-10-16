import {describe,it,expect,vi,afterEach} from "vitest";
import {render,screen,fireEvent,cleanup} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {Weather} from "./Weather";
import {plots} from "../test/fixtures";
const api = vi.hoisted(()=>({
 listPlots:vi.fn(),
 getWeather:vi.fn(),
 refreshWeather:vi.fn(),
}));
vi.mock("../api/endpoints",()=>api);
afterEach(()=>{cleanup();vi.clearAllMocks();});
const live = {
 id:1,plot_id:1,fetched_at:new Date().toISOString(),issued_at:null,
 period_from:new Date().toISOString(),period_to:new Date().toISOString(),
 temp_max:"25",temp_min:"12",rain_mm:"10",rain_prob:"0.8",raw_json:{},origin:"owm",
};
async function selectPlot():Promise<void> {
 render(<MemoryRouter><Weather/></MemoryRouter>);
 await screen.findByRole("option",{name:/El Molino/});
 fireEvent.change(screen.getByLabelText("Parcela"),{target:{value:"1"}});
}
describe("Clima",()=>{
 it("muestra vigencia OWM y actualiza en vivo con un clic",async()=>{
  api.listPlots.mockResolvedValue(plots);
  api.getWeather.mockResolvedValue(live);
  api.refreshWeather.mockResolvedValue({...live,id:2});
  await selectPlot();
  expect(await screen.findByText(/Vigente/)).toBeInTheDocument();
  expect(screen.getByText(/Fuente: OpenWeather/)).toBeInTheDocument();
  expect(screen.getByText(/10\.0/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Actualizar pronóstico"}));
  expect(api.refreshWeather).toHaveBeenCalledWith(1);
  expect(await screen.findByText(/OpenWeather/)).toBeInTheDocument();
 });
 it("advierte cuando el pronóstico está vencido",async()=>{
  api.listPlots.mockResolvedValue(plots);
  api.getWeather.mockResolvedValue({...live,fetched_at:new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()});
  await selectPlot();
  expect(await screen.findByText(/Vencido/)).toBeInTheDocument();
  expect(screen.getByText(/Pronóstico vencido/)).toBeInTheDocument();
 });
});


describe("Estados de consulta del clima",()=>{
 it("distingue un error de consulta de la ausencia de pronóstico",async()=>{
  api.listPlots.mockResolvedValue(plots);
  api.getWeather.mockRejectedValue(new Error("No hay conexión"));
  await selectPlot();
  expect(await screen.findByRole("button",{name:"Reintentar"})).toBeInTheDocument();
  expect(screen.queryByText("Aún no hay un pronóstico")).not.toBeInTheDocument();
 });
});

describe("Contexto de navegación",()=>{
 it("consulta la parcela recibida desde la evaluación",async()=>{
  api.listPlots.mockResolvedValue(plots);
  api.getWeather.mockResolvedValue({...live,plot_id:2});
  render(<MemoryRouter initialEntries={[{pathname:"/clima",state:{plotId:2}}]}><Weather/></MemoryRouter>);
  await screen.findByText("Vigente");
  expect(screen.getByLabelText("Parcela")).toHaveValue("2");
  expect(api.getWeather).toHaveBeenCalledWith(2);
 });
});
