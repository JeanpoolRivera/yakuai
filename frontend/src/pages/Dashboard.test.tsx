import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Dashboard } from "./Dashboard";
import { plots, evaluations, sensors, farmers } from "../test/fixtures";
const api=vi.hoisted(()=>({listPlots:vi.fn(),listFarmers:vi.fn(),listSensors:vi.fn(),listEvaluations:vi.fn(),listIrrigations:vi.fn()}));
vi.mock('../api/endpoints',()=>api);
afterEach(()=>{cleanup();vi.clearAllMocks();});
function setup(){api.listPlots.mockResolvedValue(plots);api.listFarmers.mockResolvedValue(farmers);api.listSensors.mockResolvedValue(sensors);api.listEvaluations.mockResolvedValue(evaluations.map(e=>({...e,evaluated_at:new Date().toISOString(),next_at:new Date(Date.now()+3600000).toISOString()})));api.listIrrigations.mockResolvedValue([]);render(<MemoryRouter><Dashboard/></MemoryRouter>);}
describe('Resumen del técnico',()=>{
  it('presenta indicadores globales y destinos de intervención',async()=>{
    setup();expect(await screen.findByRole('link',{name:'Revisar: El Molino'})).toHaveAttribute('href','/evaluar');
    expect(screen.getByRole('link',{name:'Ver sensores: Los Sauces'})).toHaveAttribute('href','/sensores');
    expect(screen.getByRole('heading',{name:'Red de sensores'})).toBeInTheDocument();
    expect(screen.getByRole('heading',{name:'Actividad de evaluación'})).toBeInTheDocument();
  });
  it('filtra por nombre de agricultor y permite limpiar búsquedas',async()=>{
    setup();await screen.findByRole('link',{name:'Revisar: El Molino'});
    fireEvent.change(screen.getByRole('searchbox'),{target:{value:'inexistente'}});
    expect(screen.getByText('No hay coincidencias')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Limpiar filtros'}));
    expect(screen.getByRole('link',{name:'Revisar: El Molino'})).toBeInTheDocument();
  });
  it('filtra prioridades de datos sin seleccionar una parcela',async()=>{
    setup();await screen.findByRole('link',{name:'Revisar: El Molino'});
    fireEvent.click(screen.getByRole('button',{name:'Datos'}));
    expect(screen.queryByRole('link',{name:'Revisar: El Molino'})).not.toBeInTheDocument();
    expect(screen.getByRole('link',{name:'Ver sensores: Los Sauces'})).toBeInTheDocument();
  });
  it('cambia el período del gráfico',async()=>{
    setup();await screen.findByRole('heading',{name:'Actividad de evaluación'});
    fireEvent.change(screen.getByRole('combobox',{name:'Período del gráfico'}),{target:{value:'14'}});
    expect(within(screen.getByLabelText('Evaluaciones por día')).getAllByRole('button')).toHaveLength(14);
  });
  it('una fuente fallida no borra las demás ni muestra cero como salud',async()=>{
    setup();await screen.findByRole('link',{name:'Revisar: El Molino'});
    api.listSensors.mockRejectedValue(new Error('Sin conexión'));
    fireEvent.click(screen.getByRole('button',{name:'Actualizar resumen'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('carga anterior');
    expect(screen.getByRole('link',{name:/Parcelas activas/})).toBeInTheDocument();
  });
  it('muestra fuentes incompletas en la primera carga fallida',async()=>{
    api.listPlots.mockResolvedValue(plots);api.listFarmers.mockResolvedValue(farmers);api.listSensors.mockRejectedValue(new Error('Sin conexión'));api.listEvaluations.mockResolvedValue(evaluations);api.listIrrigations.mockResolvedValue([]);
    render(<MemoryRouter><Dashboard/></MemoryRouter>);
    expect(await screen.findByText('Información incompleta')).toBeInTheDocument();
    expect(screen.getByText('No se pudo consultar el estado de los sensores.')).toBeInTheDocument();
  });
});
