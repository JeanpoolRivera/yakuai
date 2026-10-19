import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { SoilMoistureMeter } from "./SoilMoistureMeter";

afterEach(() => cleanup());

describe("SoilMoistureMeter", () => {
  it("muestra estado adecuado por encima del umbral", () => {
    render(<SoilMoistureMeter actual={27.5} threshold={24} pmp={15} />);
    expect(screen.getByRole("progressbar", { name: "Humedad 27.5 por ciento, Adecuado" })).toBeInTheDocument();
    expect(screen.getByText("Adecuado")).toBeInTheDocument();
    expect(screen.getByText("Umbral 24.0%")).toBeInTheDocument();
    expect(screen.getByText("PMP 15.0%")).toBeInTheDocument();
  });

  it("muestra bajo umbral cuando la humedad supera el PMP", () => {
    render(<SoilMoistureMeter actual={20} threshold={24} pmp={15} />);
    expect(screen.getByRole("progressbar", { name: "Humedad 20.0 por ciento, Bajo umbral" })).toBeInTheDocument();
    expect(screen.getByText("Bajo umbral")).toBeInTheDocument();
  });

  it("muestra estado crítico en o bajo el PMP", () => {
    render(<SoilMoistureMeter actual={10} threshold={24} pmp={15} />);
    expect(screen.getByRole("progressbar", { name: "Humedad 10.0 por ciento, Crítico" })).toBeInTheDocument();
    expect(screen.getByText("Crítico")).toBeInTheDocument();
  });

  it("no anuncia progreso cuando falta la lectura", () => {
    render(<SoilMoistureMeter actual={null} threshold={24} pmp={15} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("oculta PMP y umbral en modo agricultor", () => {
    render(<SoilMoistureMeter actual={27.5} threshold={24} pmp={15} showTechnical={false} />);
    expect(screen.getByText("Adecuado")).toBeInTheDocument();
    expect(screen.queryByText(/Umbral/)).not.toBeInTheDocument();
    expect(screen.queryByText(/PMP/)).not.toBeInTheDocument();
  });
});
