import {describe,it,expect,vi,afterEach} from "vitest";
import {render,screen,fireEvent,cleanup,waitFor,within} from "@testing-library/react";
import {Sensors} from "./Sensors";
import {sensors,plots} from "../test/fixtures";
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
  expect(screen.getByText(/YF-S201: rango/)).toBeInTheDocument();
  expect(screen.queryByLabelText(/Seco ref/)).not.toBeInTheDocument();
  fireEvent.change(type,{target:{value:"aire_temp"}});
  expect(screen.getByText(/DHT11: temperatura/)).toBeInTheDocument();
  fireEvent.change(type,{target:{value:"aire_hr"}});
  expect(screen.getByText(/DHT11: temperatura/)).toBeInTheDocument();
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
  await screen.findByRole("region",{name:"Dispositivos"});
 }
 it("bloquea valores fuera de rango por tipo",async()=>{
  await openReadingForm();
  fireEvent.click(screen.getByRole("button",{name:"Registrar lectura"}));
  const sensor = screen.getByRole("combobox",{name:/^Sensor/});
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
  fireEvent.click(screen.getByRole("button",{name:"Registrar lectura"}));
  api.createMeasurement.mockResolvedValue({id:1,quality:"ok",norm_value:52.86});
  fireEvent.change(screen.getByRole("combobox",{name:/^Sensor/}),{target:{value:"11"}});
  fireEvent.change(screen.getByLabelText(/Valor crudo/),{target:{value:"650"}});
  fireEvent.click(screen.getByRole("button",{name:"Guardar lectura"}));
  await waitFor(()=>expect(api.createMeasurement).toHaveBeenCalledTimes(1));
  expect(api.createMeasurement).toHaveBeenCalledWith(expect.objectContaining({sensor_id:11,raw_value:650,origin:"manual"}));
 });
 it("muestra la última lectura con su antigüedad",async()=>{
  api.listSensors.mockResolvedValue([{...sensors[0],id:21,latest_measurement:{id:7,measured_at:new Date().toISOString(),raw_value:"650",norm_value:"52.86",quality:"ok"}}]);
  api.listPlots.mockResolvedValue([]);
  render(<Sensors/>);
  await screen.findByRole("region",{name:"Dispositivos"});
  fireEvent.click(within(screen.getByRole("region",{name:"Dispositivos"})).getByRole("button",{name:"Ver sensor 21"}));
  expect(within(screen.getByRole("dialog")).getByText(/Última lectura/)).toBeInTheDocument();
  expect(within(screen.getByRole("dialog")).getByText(/52\.9/)).toBeInTheDocument();
  expect(within(screen.getByRole("dialog")).getByText(/ahora mismo/)).toBeInTheDocument();
 });
});



describe("Filtro de dispositivos",()=>{
 it("excluye los sensores inactivos de los operativos",async()=>{
  api.listSensors.mockResolvedValue([{...sensors[0],is_active:false}]);
  api.listPlots.mockResolvedValue([]);
  render(<Sensors/>);
  await screen.findAllByText("Inactivo");
  fireEvent.click(screen.getByText(/Administrar registros y equipos opcionales/));
  fireEvent.click(screen.getByRole("button",{name:"Operativos (0)"}));
  expect(screen.getByText("Sin coincidencias")).toBeInTheDocument();
 });
});

describe("Filtros combinados del inventario",()=>{
 it("combina parcela, estado y búsqueda",async()=>{
  api.listSensors.mockResolvedValue(sensors);
  api.listPlots.mockResolvedValue(plots);
  render(<Sensors/>);
  await screen.findByRole("region",{name:"Dispositivos"});
  fireEvent.click(screen.getByText(/Administrar registros y equipos opcionales/));
  const inventory = within(screen.getByRole("region",{name:"Registros de sensores"}));
  fireEvent.change(screen.getByLabelText("Filtrar por parcela"),{target:{value:"1"}});
  expect(inventory.getByRole("button",{name:"Ver sensor 1"})).toBeInTheDocument();
  expect(inventory.queryByRole("button",{name:"Ver sensor 2"})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Por revisar (1)"}));
  expect(screen.getByText("Sin coincidencias")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Limpiar filtros"}));
  fireEvent.change(screen.getByRole("searchbox",{name:"Buscar sensores"}),{target:{value:"Los Sauces"}});
  expect(inventory.getByRole("button",{name:"Ver sensor 3"})).toBeInTheDocument();
  expect(inventory.queryByRole("button",{name:"Ver sensor 1"})).not.toBeInTheDocument();
 });
});

describe("Monitoreo por parcela",()=>{
 it("muestra las dos variables de ambiente juntas sin mezclar parcelas",async()=>{
  const records=[
   {...sensors[0],id:31,type:"aire_temp",model:"DHT11",pin:"D4",latest_measurement:{measured_at:new Date().toISOString(),norm_value:"22.5",raw_value:"22.5",quality:"ok"}},
   {...sensors[0],id:32,type:"aire_hr",model:"DHT11",pin:"D4",latest_measurement:{measured_at:new Date().toISOString(),norm_value:"64",raw_value:"64",quality:"ok"}},
   {...sensors[1],id:33,type:"aire_temp",model:"DHT11",latest_measurement:{measured_at:new Date().toISOString(),norm_value:"18",raw_value:"18",quality:"ok"}}
  ];
  api.listSensors.mockResolvedValue(records);
  api.listPlots.mockResolvedValue(plots);
  render(<Sensors/>);
  const overview=within(await screen.findByRole("region",{name:"Dispositivos"}));
  expect(overview.getByRole("heading",{name:"Temperatura y humedad del aire"})).toBeInTheDocument();
  expect(overview.getByText("22.5 °C")).toBeInTheDocument();
  expect(overview.getByText("64.0 %")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Parcela"),{target:{value:"2"}});
  expect(overview.getByText("18.0 °C")).toBeInTheDocument();
  expect(overview.queryByText("64.0 %")).not.toBeInTheDocument();
 });
 it("configura la medición faltante en la parcela seleccionada",async()=>{
  api.listSensors.mockResolvedValue([]);
  api.listPlots.mockResolvedValue(plots);
  render(<Sensors/>);
  await screen.findByLabelText("Parcela");
  fireEvent.change(screen.getByLabelText("Parcela"),{target:{value:"2"}});
  const air=within(screen.getByRole("region",{name:"Humedad del aire"}));
  fireEvent.click(air.getByRole("button",{name:"Configurar"}));
  const dialog=within(screen.getByRole("dialog"));
  expect(dialog.getByLabelText(/Parcela/)).toHaveValue("2");
  expect(dialog.getByLabelText(/Tipo de sensor/)).toHaveValue("aire_hr");
 });
});
