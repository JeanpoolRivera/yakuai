import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(process.cwd(), "src/styles/globals.css"), "utf8");

describe("modo campo", () => {
  it("escala la tipografía raíz al 122%", () => {
    expect(css).toMatch(/html\.field-mode\s*\{[^}]*font-size:\s*122%/s);
  });

  it("amplía los objetivos táctiles del design system", () => {
    expect(css).toMatch(/--target-sm:\s*2\.75rem/);
    expect(css).toMatch(/--target-md:\s*3rem/);
    expect(css).toMatch(/--target-lg:\s*3\.5rem/);
    expect(css).toMatch(/--target-icon:\s*2\.75rem/);
    expect(css).toMatch(/html\.field-mode\s*\{[^}]*--target-sm:\s*52px/s);
    expect(css).toMatch(/html\.field-mode\s*\{[^}]*--target-md:\s*57px/s);
    expect(css).toMatch(/html\.field-mode\s*\{[^}]*--target-lg:\s*66px/s);
    expect(css).toMatch(/html\.field-mode\s*\{[^}]*--target-icon:\s*52px/s);
  });

  it("respeta prefers-reduced-motion", () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
  });
});
