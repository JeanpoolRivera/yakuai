import {describe,it,expect} from "vitest";
import {centroidOf,ringAreaM2} from "./geo";
import type {Ring} from "./geo";
const square: Ring = [[-75.2843,-12.0677],[-75.2833,-12.0677],[-75.2833,-12.0667],[-75.2843,-12.0667]];
describe("geo",()=>{
 it("calcula el área de un anillo cercano a Chupaca",()=>{
  const area = ringAreaM2(square);
  expect(area).toBeGreaterThan(11000);
  expect(area).toBeLessThan(13000);
 });
 it("el área no depende del orden de los vértices",()=>{
  expect(ringAreaM2([...square].reverse())).toBeCloseTo(ringAreaM2(square),4);
 });
 it("retorna cero sin un polígono válido",()=>{
  expect(ringAreaM2([])).toBe(0);
  expect(ringAreaM2([[-75.28,-12.06],[-75.27,-12.06]])).toBe(0);
 });
 it("calcula el centroide del anillo",()=>{
  const center = centroidOf(square);
  expect(center?.lat).toBeCloseTo(-12.0672,4);
  expect(center?.lng).toBeCloseTo(-75.2838,4);
  expect(centroidOf([])).toBeNull();
 });
});
