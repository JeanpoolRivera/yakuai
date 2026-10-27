import {describe,it,expect,vi,afterEach} from "vitest";
import {render,screen,fireEvent,cleanup} from "@testing-library/react";
import {MemoryRouter,Route,Routes,useLocation} from "react-router-dom";
import {Alerts} from "./Alerts";
const api = vi.hoisted(()=>({listAlerts:vi.fn()}));
const auth = vi.hoisted(()=>({role:"tecnico"}));
vi.mock("../app/auth-context",()=>({useAuth:()=>auth}));
vi.mock("../api/endpoints",()=>api);
afterEach(()=>{cleanup();vi.clearAllMocks();});
const alerts = [
 {tipo:"humedad_critica",mensaje:"Parcela El Molino: humedad crítica, revisión prioritaria.",plot_id:1},
 {tipo:"sensor_sin_datos",mensaje:"Sensor #1 (humedad) de El Molino: sin_datos.",plot_id:1},
 {tipo:"sensor_anomalo",mensaje:"Sensor #2 (humedad) de La Esperanza: anomalo.",plot_id:2},
 {tipo:"evaluacion_incompleta",mensaje:"Parcela Los Sauces: sin_clima_valido.",plot_id:3},
 {tipo:"aviso_general",mensaje:"Aviso de prueba sin parcela.",plot_id:null},
];
function StateProbe():React.JSX.Element {
 const location = useLocation();
 const state = location.state as {plotId?: unknown} | null;
 return <p>{`plot:${typeof state?.plotId === "number" ? state.plotId : "none"}`}</p>;
}
describe("Alertas",()=>{
 it("explica cada tipo y ofrece ir a la parcela",async()=>{
  api.listAlerts.mockResolvedValue(alerts);
  render(<MemoryRouter><Alerts/></MemoryRouter>);
  await screen.findByText(/humedad crítica, revisión prioritaria/);
  expect(screen.getByText(/Evalúa la parcela y riega hoy mismo/)).toBeInTheDocument();
  expect(screen.getByText(/Revisa su conexión o registra una lectura manual/)).toBeInTheDocument();
  expect(screen.getByText(/Complétalos y vuelve a evaluar/)).toBeInTheDocument();
  expect(screen.getAllByRole("link",{name:/Revisar parcela/})).toHaveLength(4);
 });
 it("filtra por prioridad y busca por mensaje",async()=>{
  api.listAlerts.mockResolvedValue(alerts);
  render(<MemoryRouter><Alerts/></MemoryRouter>);
  await screen.findByText(/humedad crítica, revisión prioritaria/);
  fireEvent.click(screen.getByRole("button",{name:/Críticas/}));
  expect(screen.getByText(/humedad crítica, revisión prioritaria/)).toBeInTheDocument();
  expect(screen.queryByText(/sin_datos/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:/Todas/}));
  fireEvent.change(screen.getByLabelText("Buscar alertas"),{target:{value:"esperanza"}});
  expect(screen.getByText(/La Esperanza: anomalo/)).toBeInTheDocument();
  expect(screen.queryByText(/humedad crítica, revisión prioritaria/)).not.toBeInTheDocument();
 });
 it("navega a evaluar con la parcela de la alerta",async()=>{
  api.listAlerts.mockResolvedValue(alerts);
  render(<MemoryRouter initialEntries={["/alertas"]}><Routes><Route path="/alertas" element={<Alerts/>}/><Route path="/evaluar" element={<StateProbe/>}/></Routes></MemoryRouter>);
  await screen.findByText(/humedad crítica, revisión prioritaria/);
  fireEvent.click(screen.getAllByRole("link",{name:/Revisar parcela/})[0]);
  expect(await screen.findByText("plot:1")).toBeInTheDocument();
 });
});
