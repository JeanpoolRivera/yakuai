import {describe,it,expect,vi,afterEach} from "vitest";
import {render,screen,fireEvent,cleanup,waitFor} from "@testing-library/react";
import {Sensors} from "./Sensors";
import {sensors} from "../test/fixtures";
const api = vi.hoisted(()=>({
 listSensors:vi.fn(),
 listPlots:vi.fn(),
 createSensor:vi.fn(),
 createMeasurement:vi.fn(),
}));
vi.mock("../api/endpoints",()=>api);
afterEach(()=>{cleanup();vi.clearAllMocks();});
async function openSensorForm():Promise<void> {
 api.listSensors.mockResolvedValue([]);
 api.listPlots.mockResolvedValue([]);
 render(<Sensors/>);
 await screen.findByText("Aún no hay sensores");
 fireEvent.click(screen.getAllByRole("button",{name:"Registrar sensor"})[0]);
}
describe("Registro de sensor por tipo",()=>{
 it("pide calibración solo para humedad",async()=>{
  await openSensorForm();
  expect(screen.getByText("Calibración en 2 puntos (seco / mojado)")).toBeInTheDocument();
  expect(screen.getByLabelText(/Seco ref/)).toBeInTheDocument();
  expect(screen.getByText(/YL-69 entrega/)).toBeInTheDocument();
 });
 it("no pide calibración para lluvia y explica FC-37",async()=>{
  await openSensorForm();
  fireEvent.change(screen.getByLabelText(/Tipo/),{target:{value:"lluvia"}});
  expect(screen.queryByLabelText(/Seco ref/)).not.toBeInTheDocument();
  expect(screen.getByText(/FC-37 solo avisa/)).toBeInTheDocument();
  expect(screen.queryByText(/YL-69 entrega/)).not.toBeInTheDocument();
 });
 it("muestra el rango propio de caudal y DHT11",async()=>{
  await openSensorForm();
  const type=screen.getByLabelText(/Tipo/);
  fireEvent.change(type,{target:{value:"caudal"}});
  expect(screen.getByText(/YF-S201/)).toBeInTheDocument();
  expect(screen.queryByLabelText(/Seco ref/)).not.toBeInTheDocument();
  fireEvent.change(type,{target:{value:"aire_temp"}});
  expect(screen.getByText(/DHT11/)).toBeInTheDocument();
  fireEvent.change(type,{target:{value:"aire_hr"}});
  expect(screen.getByText(/DHT11/)).toBeInTheDocument();
  expect(screen.queryByText(/YL-69 entrega/)).not.toBeInTheDocument();
 });
});
describe("Validación de rangos en lecturas",()=>{
 const mixed = [
  {...sensors[0],id:11,type:"humedad"},
  {...sensors[0],id:12,type:"lluvia"},
  {...sensors[0],id:13,type:"aire_temp"},
 ];
 async function openReadingForm():Promise<void> {
  api.listSensors.mockResolvedValue(mixed);
  api.listPlots.mockResolvedValue([]);
  render(<Sensors/>);
  await screen.findByText("Red de sensores");
 }
 it("bloquea valores fuera de rango por tipo",async()=>{
  await openReadingForm();
  const sensor = screen.getByLabelText(/Sensor/);
  const raw = screen.getByLabelText(/Valor crudo/);
  const save = screen.getByRole("button",{name:"Guardar lectura"});
  fireEvent.change(sensor,{target:{value:"11"}});
  fireEvent.change(raw,{target:{value:"2000"}});
  fireEvent.click(save);
  expect(api.createMeasurement).not.toHaveBeenCalled();
  fireEvent.change(sensor,{target:{value:"12"}});
  fireEvent.change(raw,{target:{value:"5"}});
  fireEvent.click(save);
  expect(api.createMeasurement).not.toHaveBeenCalled();
  fireEvent.change(sensor,{target:{value:"13"}});
  fireEvent.change(raw,{target:{value:"100"}});
  fireEvent.click(save);
  expect(api.createMeasurement).not.toHaveBeenCalled();
 });
 it("acepta valores dentro de rango",async()=>{
  await openReadingForm();
  api.createMeasurement.mockResolvedValue({id:1,quality:"ok",norm_value:52.86});
  fireEvent.change(screen.getByLabelText(/Sensor/),{target:{value:"11"}});
  fireEvent.change(screen.getByLabelText(/Valor crudo/),{target:{value:"650"}});
  fireEvent.click(screen.getByRole("button",{name:"Guardar lectura"}));
  await waitFor(()=>expect(api.createMeasurement).toHaveBeenCalledTimes(1));
  expect(api.createMeasurement).toHaveBeenCalledWith(expect.objectContaining({sensor_id:11,raw_value:650,origin:"manual"}));
 });
 it("muestra la última lectura con su antigüedad",async()=>{
  api.listSensors.mockResolvedValue([{...sensors[0],id:21,latest_measurement:{id:7,measured_at:new Date().toISOString(),raw_value:"650",norm_value:"52.86",quality:"ok"}}]);
  api.listPlots.mockResolvedValue([]);
  render(<Sensors/>);
  await screen.findByText("Red de sensores");
  expect(screen.getByText(/Última lectura/)).toBeInTheDocument();
  expect(screen.getByText(/52\.86/)).toBeInTheDocument();
  expect(screen.getByText(/ahora mismo/)).toBeInTheDocument();
 });
});
