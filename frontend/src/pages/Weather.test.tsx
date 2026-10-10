import {describe,it,expect,vi,afterEach} from "vitest";
import {render,screen,fireEvent,cleanup} from "@testing-library/react";
import {Weather} from "./Weather";
import {plots} from "../test/fixtures";
const api = vi.hoisted(()=>({
 listPlots:vi.fn(),
 getWeather:vi.fn(),
 refreshWeather:vi.fn(),
}));
vi.mock("../api/endpoints",()=>api);
afterEach(()=>{cleanup();vi.clearAllMocks();});
const fresh = {
 id:1,plot_id:1,fetched_at:new Date().toISOString(),issued_at:null,
 period_from:new Date().toISOString(),period_to:new Date().toISOString(),
 temp_max:"25",temp_min:"12",rain_mm:"10",rain_prob:"0.8",raw_json:{},origin:"demo",
};
async function selectPlot():Promise<void> {
 render(<Weather/>);
 await screen.findByRole("option",{name:/El Molino/});
 fireEvent.change(screen.getByLabelText("Parcela"),{target:{value:"1"}});
}
describe("Clima",()=>{
 it("muestra vigencia y prellena el formulario",async()=>{
  api.listPlots.mockResolvedValue(plots);
  api.getWeather.mockResolvedValue(fresh);
  await selectPlot();
  expect(await screen.findByText(/Vigente/)).toBeInTheDocument();
  expect(screen.getByText("demo")).toBeInTheDocument();
  expect(screen.getByText(/10\.0/)).toBeInTheDocument();
  expect(screen.getByLabelText("Lluvia (mm)")).toHaveValue("10");
  expect(screen.getByLabelText("Probabilidad (0–1)")).toHaveValue("0.8");
 });
 it("advierte cuando el pronóstico está vencido",async()=>{
  api.listPlots.mockResolvedValue(plots);
  api.getWeather.mockResolvedValue({...fresh,fetched_at:new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()});
  await selectPlot();
  expect(await screen.findByText(/Vencido/)).toBeInTheDocument();
  expect(screen.getByText(/Pronóstico vencido/)).toBeInTheDocument();
 });
 it("valida rangos antes de guardar",async()=>{
  api.listPlots.mockResolvedValue(plots);
  api.getWeather.mockResolvedValue(fresh);
  api.refreshWeather.mockResolvedValue(fresh);
  await selectPlot();
  await screen.findByText(/Vigente/);
  const save = screen.getByRole("button",{name:"Guardar pronóstico"});
  fireEvent.change(screen.getByLabelText("Lluvia (mm)"),{target:{value:"-5"}});
  fireEvent.click(save);
  expect(api.refreshWeather).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Lluvia (mm)"),{target:{value:"10"}});
  fireEvent.change(screen.getByLabelText("Probabilidad (0–1)"),{target:{value:"2"}});
  fireEvent.click(save);
  expect(api.refreshWeather).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Probabilidad (0–1)"),{target:{value:"0.8"}});
  fireEvent.change(screen.getByLabelText(/Mínima/),{target:{value:"30"}});
  fireEvent.click(save);
  expect(api.refreshWeather).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText(/Mínima/),{target:{value:"12"}});
  fireEvent.click(save);
  expect(api.refreshWeather).toHaveBeenCalledTimes(1);
  expect(api.refreshWeather).toHaveBeenCalledWith(1,{rain_mm:10,rain_prob:0.8,temp_max:25,temp_min:12});
 });
});
