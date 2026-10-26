import {describe,it,expect,vi,afterEach} from "vitest";
import {render,screen,fireEvent,cleanup,within} from "@testing-library/react";
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
  await screen.findAllByText("Maíz choclo");
  expect(screen.getAllByText("Papa")[0]).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Buscar en catálogos"),{target:{value:"maíz"}});
  expect(screen.getAllByText("Maíz choclo").length).toBeGreaterThan(0);
  expect(within(screen.getByRole("navigation",{name:"Seleccionar cultivo"})).queryAllByText("Papa")).toHaveLength(0);
  fireEvent.change(screen.getByLabelText("Buscar en catálogos"),{target:{value:"inexistente"}});
  expect(screen.getAllByText("Sin coincidencias").length).toBeGreaterThan(0);
  fireEvent.change(screen.getByLabelText("Buscar en catálogos"),{target:{value:""}});
  expect((await screen.findAllByText("Papa")).length).toBeGreaterThan(0);
 });
 it("explica los parámetros y expande etapas",async()=>{
  api.listCrops.mockResolvedValue(crops);
  api.listSoils.mockResolvedValue(soils);
  render(<Catalogs/>);
  await screen.findAllByText("Papa");
  expect(screen.getByText(/Coeficiente de cultivo por etapa/)).toBeInTheDocument();
  expect(screen.getAllByText("Inicio")[0]).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:/Suelos/}));
  expect(screen.getByText(/El agua útil se calcula como capacidad de campo/)).toBeInTheDocument();
 });
});
