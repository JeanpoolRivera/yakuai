import {describe,it,expect,vi,afterEach} from "vitest";
import {render,screen,fireEvent,cleanup,waitFor} from "@testing-library/react";
import {Farmers} from "./Farmers";
import {farmers} from "../test/fixtures";
const api = vi.hoisted(()=>({
 listFarmers:vi.fn(),
 createFarmer:vi.fn(),
 updateFarmer:vi.fn(),
}));
vi.mock("../api/endpoints",()=>api);
afterEach(()=>{cleanup();vi.clearAllMocks();});
const juana = {...farmers[0],id:2,name:"Juana Pérez",phone:"999888777",plots_count:1,is_active:true};
function mockLoaded():void {
 api.listFarmers.mockResolvedValue([farmers[0],juana]);
}
describe("Agricultores",()=>{
 it("muestra estado y WhatsApp solo con teléfono",async()=>{
  mockLoaded();
  render(<Farmers/>);
  expect(await screen.findByText("Juana Pérez")).toBeInTheDocument();
  expect(screen.getByText("Agricultor de demostración")).toBeInTheDocument();
  expect(screen.getByText("Sin teléfono registrado")).toBeInTheDocument();
  expect(screen.getAllByText("Activo")).toHaveLength(2);
  const wa = screen.getByRole("link",{name:/WhatsApp de Juana/});
  expect(wa).toHaveAttribute("href","https://wa.me/999888777");
  expect(screen.queryByRole("link",{name:/WhatsApp de Agricultor/})).not.toBeInTheDocument();
 });
 it("busca por nombre o teléfono",async()=>{
  mockLoaded();
  render(<Farmers/>);
  await screen.findByText("Juana Pérez");
  const search = screen.getByLabelText("Buscar agricultores");
  fireEvent.change(search,{target:{value:"juana"}});
  expect(screen.getByText("Juana Pérez")).toBeInTheDocument();
  expect(screen.queryByText("Agricultor de demostración")).not.toBeInTheDocument();
  fireEvent.change(search,{target:{value:"999888"}});
  expect(screen.getByText("Juana Pérez")).toBeInTheDocument();
 });
 it("registra con validación de nombre y estado",async()=>{
  mockLoaded();
  api.createFarmer.mockResolvedValue({id:3});
  render(<Farmers/>);
  await screen.findByText("Juana Pérez");
  fireEvent.click(screen.getByRole("button",{name:"Registrar agricultor"}));
  await screen.findByRole("dialog",{name:"Registrar agricultor"});
  fireEvent.click(screen.getByRole("button",{name:"Registrar"}));
  expect(api.createFarmer).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText(/Nombre completo/),{target:{value:"Pedro Castillo"}});
  fireEvent.change(screen.getByLabelText(/Teléfono/),{target:{value:"999111222"}});
  fireEvent.click(screen.getByRole("button",{name:"Registrar"}));
  await waitFor(()=>expect(api.createFarmer).toHaveBeenCalledWith({name:"Pedro Castillo",phone:"999111222",is_active:true}));
 });
 it("edita y cambia el estado",async()=>{
  mockLoaded();
  api.updateFarmer.mockResolvedValue({id:2});
  render(<Farmers/>);
  await screen.findByText("Juana Pérez");
  fireEvent.click(screen.getByRole("button",{name:"Editar a Juana Pérez"}));
  await screen.findByRole("dialog",{name:"Editar agricultor"});
  fireEvent.change(screen.getByLabelText("Estado"),{target:{value:"inactivo"}});
  fireEvent.click(screen.getByRole("button",{name:"Guardar cambios"}));
  await waitFor(()=>expect(api.updateFarmer).toHaveBeenCalledWith(2,{name:"Juana Pérez",phone:"999888777",is_active:false}));
 });
});
