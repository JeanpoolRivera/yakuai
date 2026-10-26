import {describe,it,expect,vi,afterEach} from "vitest";
import {render,screen,fireEvent,cleanup} from "@testing-library/react";
import {Validation} from "./Validation";
const api = vi.hoisted(()=>({runValidation:vi.fn()}));
vi.mock("../api/endpoints",()=>api);
afterEach(()=>{cleanup();vi.clearAllMocks();});
const report = {
 total:2,
 passed:1,
 cases:[
  {caso:"Humedad suficiente no riega",esperado:"no",obtenido:"no",ok:true,detalle:"humedad_suficiente"},
  {caso:"Bajo umbral riega",esperado:"no",obtenido:"riega",ok:false,detalle:"bajo_umbral 100-150 L"},
 ],
};
describe("Validación del motor",()=>{
 it("ejecuta una sola vez y explica en lenguaje claro",async()=>{
  let resolveReport!: (value: typeof report) => void;
  api.runValidation.mockReturnValue(new Promise((resolve) => { resolveReport = resolve; }));
  render(<Validation/>);
  fireEvent.click(screen.getAllByRole("button",{name:"Ejecutar validación"})[0]);
  const runningButton = screen.getByRole("button",{name:/Revisando los 10 casos/});
  expect(runningButton).toBeDisabled();
  fireEvent.click(runningButton);
  expect(api.runValidation).toHaveBeenCalledTimes(1);
  resolveReport(report);
  expect(await screen.findByText("Hay respuestas que revisar")).toBeInTheDocument();
  expect(screen.getByText("casos correctos")).toBeInTheDocument();
  expect(screen.getByText("Bajo umbral riega")).toBeInTheDocument();
  expect(screen.getByText("No coincide")).toBeInTheDocument();
 });
 it("muestra los casos con fallos y permite consultar los correctos",async()=>{
  api.runValidation.mockResolvedValue(report);
  render(<Validation/>);
  fireEvent.click(screen.getAllByRole("button",{name:"Ejecutar validación"})[0]);
  expect(await screen.findByText("Hay respuestas que revisar")).toBeInTheDocument();
  expect(screen.getByText("Bajo umbral riega")).toBeInTheDocument();
  fireEvent.click(screen.getByText("Casos correctos"));
  expect(screen.getByText("Humedad suficiente no riega")).toBeInTheDocument();
 });
});
