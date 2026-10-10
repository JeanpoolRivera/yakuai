import {describe,it,expect,vi,afterEach} from "vitest";
import {render,screen,fireEvent,cleanup} from "@testing-library/react";
import {Plots} from "./Plots";
import {farmers,crops,soils} from "../test/fixtures";
const api = vi.hoisted(()=>({
 listPlots:vi.fn(),
 listFarmers:vi.fn(),
 listCrops:vi.fn(),
 listSoils:vi.fn(),
 createPlot:vi.fn(),
 updatePlot:vi.fn(),
}));
vi.mock("../api/endpoints",()=>api);
vi.mock("../components/PlotMap",()=>({PlotMap:()=><div data-testid="plot-map"/>}));
afterEach(()=>{
 cleanup();
 vi.clearAllMocks();
 Object.defineProperty(navigator,"geolocation",{value:undefined,configurable:true});
});
function mockLoaded():void {
 api.listPlots.mockResolvedValue([]);
 api.listFarmers.mockResolvedValue(farmers);
 api.listCrops.mockResolvedValue(crops);
 api.listSoils.mockResolvedValue(soils);
}
async function openWizard():Promise<void> {
 render(<Plots/>);
 await screen.findByText("Aún no hay parcelas");
 fireEvent.click(screen.getAllByRole("button",{name:"Nueva parcela"})[0]);
 await screen.findByRole("dialog",{name:"Nueva parcela"});
}
describe("Asistente de parcelas",()=>{
 it("bloquea el avance sin agricultor ni área válida",async()=>{
  mockLoaded();
  await openWizard();
  fireEvent.click(screen.getByRole("button",{name:"Continuar"}));
  expect(await screen.findByText(/Paso 1 de 3/)).toBeInTheDocument();
 });
 it("avanza con agricultor, usa geolocalización y valida el área",async()=>{
  mockLoaded();
  await openWizard();
  fireEvent.change(screen.getByLabelText(/Agricultor/),{target:{value:"1"}});
  fireEvent.change(screen.getByLabelText(/Nombre de la parcela/),{target:{value:"Parcela prueba"}});
  fireEvent.click(screen.getByRole("button",{name:"Continuar"}));
  expect(await screen.findByText(/Paso 2 de 3/)).toBeInTheDocument();
  const position = {coords:{latitude:-12.07,longitude:-75.28},timestamp:Date.now()} as unknown as GeolocationPosition;
  Object.defineProperty(navigator,"geolocation",{value:{getCurrentPosition:(ok: PositionCallback)=>ok(position)},configurable:true});
  fireEvent.click(screen.getByRole("button",{name:/mi ubicación/}));
  expect(screen.getByLabelText(/Latitud/)).toHaveValue("-12.07");
  expect(screen.getByLabelText(/Longitud/)).toHaveValue("-75.28");
  fireEvent.click(screen.getByRole("button",{name:"Continuar"}));
  expect(screen.getByText(/Paso 2 de 3/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/Área/),{target:{value:"150"}});
  fireEvent.click(screen.getByRole("button",{name:"Continuar"}));
  expect(await screen.findByText(/Paso 3 de 3/)).toBeInTheDocument();
 });
});
