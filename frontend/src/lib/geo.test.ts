import { describe, expect, it } from "vitest";
import { centroidOf, isValidRing, ringAreaM2 } from "./geo";
import type { Ring } from "./geo";

const square: Ring = [[-75.2843, -12.0677], [-75.2833, -12.0677], [-75.2833, -12.0667], [-75.2843, -12.0667]];

describe("geo", () => {
  it("calcula el área de un anillo cercano a Chupaca", () => {
    const area = ringAreaM2(square);
    expect(area).toBeGreaterThan(11_000);
    expect(area).toBeLessThan(13_000);
  });

  it("el área no depende del orden de los vértices", () => {
    expect(ringAreaM2([...square].reverse())).toBeCloseTo(ringAreaM2(square), 4);
  });

  it("retorna cero sin un polígono válido", () => {
    expect(ringAreaM2([])).toBe(0);
    expect(ringAreaM2([[-75.28, -12.06], [-75.27, -12.06]])).toBe(0);
  });

  it("calcula un centroide ponderado por el área, no el promedio simple de vértices", () => {
    const polygon: Ring = [[10, 20], [10.00004, 20], [10.00004, 20.00001], [10, 20.00003]];
    const center = centroidOf(polygon);
    expect(center?.lng).toBeCloseTo(10.00001667, 7);
    expect(center?.lat).toBeCloseTo(20.00001083, 7);
    expect(centroidOf(square)?.lat).toBeCloseTo(-12.0672, 4);
    expect(centroidOf(square)?.lng).toBeCloseTo(-75.2838, 4);
    expect(centroidOf([])).toBeNull();
  });

  it("rechaza contornos cruzados o con vértices repetidos", () => {
    expect(isValidRing(square)).toBe(true);
    expect(isValidRing([[0, 0], [0.0001, 0.0001], [0, 0.0001], [0.0001, 0]])).toBe(false);
    expect(isValidRing([[0, 0], [0.0001, 0], [0.0001, 0], [0, 0.0001]])).toBe(false);
  });
});

