import {describe,it,expect,vi,afterEach} from "vitest";
import {render,screen,fireEvent,cleanup,waitFor} from "@testing-library/react";
import {Validation} from "./Validation";
const api = vi.hoisted(()=>({runValidation:vi.fn()}));
vi.mock("../api/endpoints",()=>api);
afterEach(()=>{cleanup();vi.clearAllMocks();});
const report = {
 total:2,
 passed:1,
 cases:[
  {caso:"Humedad suficiente no riega",esperado:"riega",obtenido:"riega",ok:true,detalle:"humedad_suficiente"},
  {caso:"Bajo umbral riega",esperado:"no",obtenido:"riega",ok:false,detalle:"bajo_umbral 100-150 L"},
 ],
};
describe("Validación del motor",()=>{
 it("ejecuta una sola vez y explica en lenguaje claro",async()=>{
  api.runValidation.mockResolvedValue(report);
  render(<Validation/>);
  fireEvent.click(screen.getAllByRole("button",{name:"Ejecutar validación"})[0]);
  fireEvent.click(screen.getAllByRole("button",{name:"Ejecutar validación"})[0]);
  await waitFor(()=>expect(api.runValidation).toHaveBeenCalledTimes(1));
  expect(await screen.findByText("Con fallos")).toBeInTheDocument();
  expect(screen.getByText("Todo bien")).toBeInTheDocument();
  expect(screen.getByText("La tierra aún tiene agua suficiente.")).toBeInTheDocument();
  expect(screen.getByText("La humedad bajó del umbral del cultivo. 100-150 L")).toBeInTheDocument();
 });
 it("filtra correctos y fallos",async()=>{
  api.runValidation.mockResolvedValue(report);
  render(<Validation/>);
  fireEvent.click(screen.getAllByRole("button",{name:"Ejecutar validación"})[0]);
  await screen.findByText("Con fallos");
  fireEvent.click(screen.getByRole("button",{name:"Fallos"}));
  expect(screen.getByText("Bajo umbral riega")).toBeInTheDocument();
  expect(screen.queryByText("Humedad suficiente no riega")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Correctos"}));
  expect(screen.getByText("Humedad suficiente no riega")).toBeInTheDocument();
  expect(screen.queryByText("Bajo umbral riega")).not.toBeInTheDocument();
 });
});
