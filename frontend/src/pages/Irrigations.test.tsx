import {describe,it,expect,vi,afterEach} from "vitest";
import {render,screen,fireEvent,cleanup,waitFor} from "@testing-library/react";
import {Irrigations} from "./Irrigations";
import {plots,irrigations} from "../test/fixtures";
const api = vi.hoisted(()=>({
 listIrrigations:vi.fn(),
 listPlots:vi.fn(),
 createIrrigation:vi.fn(),
 correctIrrigation:vi.fn(),
 voidIrrigation:vi.fn(),
}));
vi.mock("../api/endpoints",()=>api);
afterEach(()=>{cleanup();vi.clearAllMocks();});
const old = {...irrigations[0],id:2,occurred_at:"2026-01-05T06:30:00",recommended_liters:"3000",applied_liters:"3000",note:"Riego de enero"};
function mockLoaded():void {
 api.listIrrigations.mockResolvedValue([irrigations[0],old]);
 api.listPlots.mockResolvedValue(plots);
}
describe("Riegos",()=>{
 it("filtra por período y limpia el filtro",async()=>{
  mockLoaded();
  render(<Irrigations/>);
  await screen.findByText("Riego de enero");
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0,10);
  fireEvent.change(screen.getByLabelText("Hasta"),{target:{value:yesterday}});
  expect(await screen.findByText("Riego de enero")).toBeInTheDocument();
  expect(screen.queryByText("Registro de demostración")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Limpiar"}));
  expect(await screen.findByText("Registro de demostración")).toBeInTheDocument();
  expect(screen.queryByRole("button",{name:"Limpiar"})).not.toBeInTheDocument();
 });
 it("anota un riego",async()=>{
  mockLoaded();
  api.createIrrigation.mockResolvedValue({id:3});
  render(<Irrigations/>);
  await screen.findByText("Riego de enero");
  fireEvent.click(screen.getByRole("button",{name:"Anotar riego"}));
  await screen.findByRole("dialog",{name:"Anotar riego"});
  fireEvent.change(screen.getByLabelText(/Parcela/),{target:{value:"1"}});
  fireEvent.change(screen.getByLabelText(/Agua aplicada/),{target:{value:"4800"}});
  fireEvent.click(screen.getByRole("button",{name:"Guardar"}));
  await waitFor(()=>expect(api.createIrrigation).toHaveBeenCalledTimes(1));
  expect(api.createIrrigation).toHaveBeenCalledWith(expect.objectContaining({plot_id:1,applied_liters:4800}));
 });
 it("corrige y anula con motivo",async()=>{
  mockLoaded();
  api.correctIrrigation.mockResolvedValue({id:3});
  api.voidIrrigation.mockResolvedValue({id:1});
  render(<Irrigations/>);
  await screen.findByText("Riego de enero");
  fireEvent.click(screen.getAllByRole("button",{name:"Corregir"})[0]);
  await screen.findByRole("dialog",{name:/Corregir riego/});
  fireEvent.change(screen.getByLabelText(/Motivo/),{target:{value:"Medí mal el contador"}});
  fireEvent.click(screen.getByRole("button",{name:"Guardar corrección"}));
  await waitFor(()=>expect(api.correctIrrigation).toHaveBeenCalledWith(1,1600,"Medí mal el contador"));
  fireEvent.click(screen.getAllByRole("button",{name:"Anular"})[0]);
  await screen.findByRole("dialog",{name:/Anular riego/});
  fireEvent.change(screen.getByLabelText(/Motivo de anulación/),{target:{value:"No se regó"}});
  fireEvent.click(screen.getByRole("button",{name:"Continuar"}));
  fireEvent.click(await screen.findByRole("button",{name:"Anular registro"}));
  await waitFor(()=>expect(api.voidIrrigation).toHaveBeenCalledWith(1,"No se regó"));
 });
});
