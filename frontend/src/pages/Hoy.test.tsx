import {describe,it,expect,vi,afterEach} from "vitest";
import {render,screen,fireEvent,cleanup} from "@testing-library/react";
import {MemoryRouter,Route,Routes,useLocation} from "react-router-dom";
import {Hoy} from "./Hoy";
import {plots,evaluations,sensors} from "../test/fixtures";
const api = vi.hoisted(()=>({
 listPlots:vi.fn(),
 listEvaluations:vi.fn(),
 listSensors:vi.fn(),
}));
vi.mock("../api/endpoints",()=>api);
afterEach(()=>{cleanup();vi.clearAllMocks();});
function mockLoaded():void {
 api.listPlots.mockResolvedValue(plots);
 api.listEvaluations.mockResolvedValue(evaluations);
 api.listSensors.mockResolvedValue(sensors);
}
function StateProbe():React.JSX.Element {
 const location = useLocation();
 const state = location.state as {plotId?: unknown} | null;
 return <p>{`plot:${typeof state?.plotId === "number" ? state.plotId : "none"}`}</p>;
}
describe("Hoy",()=>{
 it("muestra héroe, cifras y última recomendación con antigüedad",async()=>{
  mockLoaded();
  render(<MemoryRouter><Hoy/></MemoryRouter>);
  expect(await screen.findByText("1 parcela tiene recomendación de riego")).toBeInTheDocument();
  expect(screen.getByText("El Molino")).toBeInTheDocument();
  expect(screen.getByText("La Esperanza")).toBeInTheDocument();
  expect(screen.getByText("Los Sauces")).toBeInTheDocument();
  expect(screen.getAllByText(/ahora mismo/)).toHaveLength(3);
  expect(screen.getByText("Sensores operativos")).toBeInTheDocument();
  expect(screen.getByText(/2 de 3/)).toBeInTheDocument();
 });
 it("filtra por estado y busca por nombre",async()=>{
  mockLoaded();
  render(<MemoryRouter><Hoy/></MemoryRouter>);
  await screen.findByText("El Molino");
  fireEvent.click(screen.getByRole("button",{name:/Piden riego/}));
  expect(screen.getByText("El Molino")).toBeInTheDocument();
  expect(screen.queryByText("La Esperanza")).not.toBeInTheDocument();
  expect(screen.queryByText("Los Sauces")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:/Todas/}));
  fireEvent.change(screen.getByLabelText(/Buscar parcela/),{target:{value:"sauces"}});
  expect(screen.getByText("Los Sauces")).toBeInTheDocument();
  expect(screen.queryByText("El Molino")).not.toBeInTheDocument();
 });
 it("navega a evaluar con la parcela preseleccionada",async()=>{
  mockLoaded();
  render(<MemoryRouter initialEntries={["/"]}><Routes><Route path="/" element={<Hoy/>}/><Route path="/evaluar" element={<StateProbe/>}/></Routes></MemoryRouter>);
  await screen.findByText("El Molino");
  fireEvent.change(screen.getByLabelText(/Buscar parcela/),{target:{value:"molino"}});
  fireEvent.click(screen.getByRole("link",{name:/Ver qué hacer/}));
  expect(await screen.findByText("plot:1")).toBeInTheDocument();
 });
});
