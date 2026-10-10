import {describe,it,expect,vi,afterEach} from "vitest";
import {render,screen,fireEvent,cleanup} from "@testing-library/react";
import {Catalogs} from "./Catalogs";
import {crops,soils} from "../test/fixtures";
const api = vi.hoisted(()=>({listCrops:vi.fn(),listSoils:vi.fn()}));
vi.mock("../api/endpoints",()=>api);
afterEach(()=>{cleanup();vi.clearAllMocks();});
const crops2 = [...crops,{...crops[0],id:2,code:"maiz",name:"Maíz choclo",scientific_name:"Zea mays"}];
describe("Catálogos",()=>{
 it("filtra cultivos y suelos en tiempo real",async()=>{
  api.listCrops.mockResolvedValue(crops2);
  api.listSoils.mockResolvedValue(soils);
  render(<Catalogs/>);
  await screen.findByText("Maíz choclo");
  expect(screen.getByText("Papa")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Buscar en catálogos"),{target:{value:"maíz"}});
  expect(screen.getByText("Maíz choclo")).toBeInTheDocument();
  expect(screen.queryByText("Papa")).not.toBeInTheDocument();
  expect(screen.getByText("Sin coincidencias")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Buscar en catálogos"),{target:{value:""}});
  expect(await screen.findByText("Papa")).toBeInTheDocument();
 });
 it("explica los parámetros y expande etapas",async()=>{
  api.listCrops.mockResolvedValue(crops);
  api.listSoils.mockResolvedValue(soils);
  render(<Catalogs/>);
  await screen.findByText("Papa");
  expect(screen.getByText(/Coeficiente de cultivo/)).toBeInTheDocument();
  expect(screen.getByText("Inicio")).toBeInTheDocument();
  expect(screen.getByText(/pendientes de validación local/)).toBeInTheDocument();
 });
});
