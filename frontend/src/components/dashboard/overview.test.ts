import { describe, it, expect } from "vitest";
import { evaluationDays, summarize } from "./overview";
import type { DashboardData } from "./overview";
import type { Evaluation, Irrigation, Plot, Sensor } from "../../api/types";
const now = new Date("2026-10-12T17:00:00Z");
const plot = {id:1,farmer_id:1,name:"El Molino",status:"activa"} as Plot;
const evaluation = {id:1,plot_id:1,evaluated_at:"2026-10-12T15:00:00Z",result:"riega",next_at:"2026-10-13T15:00:00Z",is_critical:true} as Evaluation;
function data(patch:Partial<DashboardData>={}):DashboardData{return {plots:[plot],farmers:[],sensors:[],evaluations:[evaluation],irrigations:[],...patch};}
describe("Métricas del panel técnico",()=>{
  it("cuenta parcelas únicas y conserva la última evaluación",()=>{
    const result=summarize(data({evaluations:[{...evaluation,id:2,result:'no',is_critical:false,evaluated_at:'2026-10-12T16:00:00Z'},evaluation]}),now);
    expect(result.evaluatedToday).toBe(1);expect(result.priorities).toHaveLength(0);
  });
  it("no cuenta correcciones ni anulaciones en el agua registrada",()=>{
    const base={id:1,plot_id:1,occurred_at:'2026-10-12T16:00:00Z',applied_liters:'1000'} as Irrigation;
    const result=summarize(data({irrigations:[{...base,status:'corregido'},{...base,id:2,status:'anulado'},{...base,id:3,status:'activo',applied_liters:'800'}]}),now);
    expect(result.litersToday).toBe(800);expect(result.irrigationCount).toBe(1);
  });
  it("suprime el riego pendiente cuando tiene un registro activo vinculado",()=>{
    expect(summarize(data({irrigations:[{status:'activo',evaluation_id:1} as Irrigation]}),now).priorities).toHaveLength(0);
  });
  it("muestra reevaluación en vez de criticidad actual para un resultado vencido",()=>{
    const result=summarize(data({evaluations:[{...evaluation,next_at:'2026-10-12T16:00:00Z'}]}),now);
    expect(result.priorities[0].title).toBe('Actualizar evaluación');expect(result.priorities[0].severity).toBe('neutral');
  });
  it("agrupa sensores por parcela y excluye dispositivos inactivos de salud",()=>{
    const sensor={id:1,plot_id:1,status:'sin_datos',is_active:true} as Sensor;
    const result=summarize(data({evaluations:[],sensors:[sensor,{...sensor,id:2},{...sensor,id:3,is_active:false,status:'ok'}]}),now);
    expect(result.sensors).toHaveLength(2);expect(result.sensorCounts.ok).toBe(0);
    expect(result.priorities.filter(p=>p.to==='/sensores')).toHaveLength(1);expect(result.affected).toBe(1);
  });
  it("ignora parcelas pausadas al generar prioridades",()=>{
    expect(summarize(data({plots:[{...plot,status:'pausada'}]}),now).priorities).toHaveLength(0);
  });
  it("no inventa parcelas sin evaluar si falló esa fuente",()=>{
    expect(summarize(data({evaluations:null}),now).priorities).toHaveLength(0);
  });
  it("separa el día de Lima del día UTC y rellena días sin actividad",()=>{
    const days=evaluationDays([{...evaluation,evaluated_at:'2026-10-12T02:00:00Z'}],7,now);
    expect(days).toHaveLength(7);expect(days.at(-1)?.total).toBe(0);expect(days.at(-2)?.total).toBe(1);
  });
  it("las evaluaciones futuras no inflan indicadores",()=>{
    const future={...evaluation,evaluated_at:'2026-10-12T20:00:00Z'};
    expect(evaluationDays([future],7,now).at(-1)?.total).toBe(0);
    expect(summarize(data({evaluations:[future]}),now).evaluatedToday).toBe(0);
  });
});
