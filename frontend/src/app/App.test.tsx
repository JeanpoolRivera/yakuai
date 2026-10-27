import {describe,it,expect,vi,afterEach} from "vitest";
import {render,screen,cleanup} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {App} from "./App";
const auth = vi.hoisted(()=>({session:null as null|{user:{role:string}},role:null as string|null,ready:true,displayName:"Persona de prueba",signOut:vi.fn()}));
vi.mock("./auth-context",()=>({useAuth:()=>auth}));
vi.mock("../pages/Dashboard",()=>({Dashboard:()=> <h1>Dashboard de prueba</h1>}));
vi.mock("../pages/Hoy",()=>({Hoy:()=> <h1>Mi campo de prueba</h1>}));
vi.mock("../pages/Login",()=>({Login:()=> <h1>Ingreso de prueba</h1>}));
afterEach(()=>cleanup());
describe("Navegación por rol",()=>{
 it("protege la ruta inicial cuando no existe sesión",()=>{
  auth.session=null;auth.role=null;
  render(<MemoryRouter initialEntries={["/"]}><App/></MemoryRouter>);
  expect(screen.getByRole("heading",{name:"Ingreso de prueba"})).toBeInTheDocument();
 });
  it("incluye el dashboard dentro de la navegación del equipo",async()=>{
   auth.role="admin";auth.session={user:{role:"admin"}};
   render(<MemoryRouter initialEntries={["/"]}><App/></MemoryRouter>);
   expect(await screen.findByRole("heading",{name:"Dashboard de prueba"})).toBeInTheDocument();
   expect(screen.getByRole("link",{name:"Resumen"})).toHaveAttribute("aria-current","page");
   expect(screen.getByRole("navigation",{name:"Secciones"})).toBeInTheDocument();
   expect(screen.getAllByText("Administrador")[0]).toBeInTheDocument();
  });
  it("muestra la etiqueta del rol técnico en el equipo",async()=>{
   auth.role="tecnico";auth.session={user:{role:"tecnico"}};
   render(<MemoryRouter initialEntries={["/"]}><App/></MemoryRouter>);
   expect(await screen.findByRole("heading",{name:"Dashboard de prueba"})).toBeInTheDocument();
   expect(screen.getAllByText("Técnico")[0]).toBeInTheDocument();
  });
 it("mantiene la vista y navegación específicas del agricultor",async()=>{
  auth.role="agricultor";auth.session={user:{role:"agricultor"}};
  render(<MemoryRouter initialEntries={["/"]}><App/></MemoryRouter>);
   expect(await screen.findByRole("heading",{name:"Mi campo de prueba"})).toBeInTheDocument();
   expect(screen.getAllByRole("navigation",{name:"Navegación agricultor"})[0]).toBeInTheDocument();
   expect(screen.getAllByText(/Agricultor/)[0]).toBeInTheDocument();
   expect(screen.queryByRole("link",{name:"Cultivos y suelos"})).not.toBeInTheDocument();
 });
  it("impide acceder a páginas del equipo desde el rol agricultor",async()=>{
   auth.role="agricultor";auth.session={user:{role:"agricultor"}};
   render(<MemoryRouter initialEntries={["/sensores"]}><App/></MemoryRouter>);
   expect(await screen.findByRole("heading",{name:"Mi campo de prueba"})).toBeInTheDocument();
  });
  it("muestra vista restringida para un rol desconocido",()=>{
   auth.role="soporte";auth.session={user:{role:"soporte"}};
   render(<MemoryRouter initialEntries={["/parcelas"]}><App/></MemoryRouter>);
   expect(screen.getByText("Sesión no reconocida")).toBeInTheDocument();
   expect(screen.queryByRole("navigation",{name:"Secciones"})).not.toBeInTheDocument();
  });
});
