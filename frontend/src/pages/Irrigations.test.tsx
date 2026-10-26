import {describe,it,expect,vi,afterEach} from "vitest";
import {render,screen,fireEvent,cleanup,waitFor,within} from "@testing-library/react";
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
const auth = vi.hoisted(() => ({role:"tecnico"}));
vi.mock("../app/auth",()=>({useAuth:()=>auth}));
afterEach(()=>{cleanup();vi.clearAllMocks();});
const old = {...irrigations[0],id:2,occurred_at:new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),recommended_liters:"3000",applied_liters:"3000",note:"Riego de enero"};
function mockLoaded():void {
 api.listIrrigations.mockResolvedValue([irrigations[0],old]);
 api.listPlots.mockResolvedValue(plots);
}
describe("Riegos",()=>{
 it("filtra por período y limpia el filtro",async()=>{
  mockLoaded();
  render(<Irrigations/>);
  await screen.findAllByRole("button",{name:/Abrir registro de/});
  const cutoff = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0,10);
  fireEvent.click(screen.getByRole("button",{name:/Filtrar/}));
  fireEvent.change(screen.getByLabelText("Hasta"),{target:{value:cutoff}});
  expect(screen.getAllByRole("button",{name:/Abrir registro de/})).toHaveLength(1);
  fireEvent.click(screen.getByRole("button",{name:/Limpiar/}));
  expect(screen.getAllByRole("button",{name:/Abrir registro de/})).toHaveLength(2);
  expect(screen.queryByRole("button",{name:/Limpiar/})).not.toBeInTheDocument();
 });
 it("anota un riego",async()=>{
  mockLoaded();
  api.createIrrigation.mockResolvedValue({id:3});
  render(<Irrigations/>);
  await screen.findAllByRole("button",{name:/Abrir registro de/});
  fireEvent.click(screen.getByRole("button",{name:"Registrar riego"}));
  await screen.findByRole("dialog",{name:"Registrar riego"});
  fireEvent.change(within(screen.getByRole("dialog")).getByLabelText(/Parcela/),{target:{value:"1"}});
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
  await screen.findAllByRole("button",{name:/Abrir registro de/});
  fireEvent.click(screen.getAllByRole("button",{name:/Abrir registro de/})[0]);
  fireEvent.click(await screen.findByRole("button",{name:"Corregir registro"}));
  await screen.findByRole("dialog",{name:/Corregir riego/});
  fireEvent.change(screen.getByLabelText(/Motivo/),{target:{value:"Medí mal el contador"}});
  fireEvent.click(screen.getByRole("button",{name:"Guardar corrección"}));
  await waitFor(()=>expect(api.correctIrrigation).toHaveBeenCalledWith(1,1600,"Medí mal el contador"));
  fireEvent.click(screen.getAllByRole("button",{name:/Abrir registro de/})[0]);
  fireEvent.click(await screen.findByRole("button",{name:"Anular riego"}));
  await screen.findByRole("dialog",{name:/Anular riego/});
  fireEvent.change(screen.getByLabelText(/Motivo de anulación/),{target:{value:"No se regó"}});
  fireEvent.click(screen.getByRole("button",{name:"Continuar"}));
  fireEvent.click(await screen.findByRole("button",{name:"Anular registro"}));
  await waitFor(()=>expect(api.voidIrrigation).toHaveBeenCalledWith(1,"No se regó"));
 });
});
