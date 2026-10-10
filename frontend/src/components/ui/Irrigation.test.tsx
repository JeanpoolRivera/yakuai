import {describe,it,expect,afterEach} from "vitest";
import {render,screen,cleanup} from "@testing-library/react";
import {SoilMeter} from "./Irrigation";
afterEach(()=>cleanup());
describe("SoilMeter",()=>{
 it("muestra estado adecuado por encima del umbral",()=>{
  render(<SoilMeter actual={25} umbral={21.75} critico={12}/>);
  expect(screen.getByRole("progressbar",{name:"Humedad 25.0 por ciento, Adecuado"})).toBeInTheDocument();
  expect(screen.getByText("Umbral 21.8%")).toBeInTheDocument();
 });
 it("muestra bajo umbral cerca del límite",()=>{
  render(<SoilMeter actual={20} umbral={21.75} critico={12}/>);
  expect(screen.getByRole("progressbar",{name:"Humedad 20.0 por ciento, Bajo umbral"})).toBeInTheDocument();
 });
 it("muestra estado crítico por debajo del punto de marchitez",()=>{
  render(<SoilMeter actual={10} umbral={21.75} critico={12}/>);
  expect(screen.getByRole("progressbar",{name:"Humedad 10.0 por ciento, Crítico — regar hoy"})).toBeInTheDocument();
  expect(screen.getByText("PMP 12.0%")).toBeInTheDocument();
 });
 it("muestra mensaje cuando faltan datos",()=>{
  render(<SoilMeter actual={null} umbral={21.75} critico={12}/>);
  expect(screen.getByText("Sin dato de humedad")).toBeInTheDocument();
 });
});
