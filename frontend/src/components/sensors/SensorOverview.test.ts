import {describe,it,expect} from "vitest";
import type {Sensor} from "../../api/types";
import {sensorValue} from "./SensorOverview";
const base={id:1,plot_id:1,type:"humedad",model:"YL-69",pin:"A0",dry_ref:1020,wet_ref:320,status:"ok",is_active:true} as Sensor;
const measurement={id:1,sensor_id:1,plot_id:1,measured_at:new Date().toISOString(),raw_value:"650",norm_value:"52.86",quality:"ok",origin:"sensor"} as const;
describe("Lecturas comprensibles y válidas",()=>{
 it("no convierte un valor crudo de suelo en porcentaje",()=>expect(sensorValue({...base,latest_measurement:{...measurement,norm_value:null}})).toBe("Sin dato válido"));
 it("muestra el porcentaje normalizado",()=>expect(sensorValue({...base,latest_measurement:measurement})).toBe("52.9 %"));
 it("no presenta lluvia inválida como ausencia de lluvia",()=>expect(sensorValue({...base,type:"lluvia",latest_measurement:{...measurement,norm_value:"4"}})).toBe("Lectura no válida"));
 it("no presenta datos en cuarentena como mediciones válidas",()=>expect(sensorValue({...base,latest_measurement:{...measurement,quality:"anomalo"}})).toBe("Lectura no válida"));
});
