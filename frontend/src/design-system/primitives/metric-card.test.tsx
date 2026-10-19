import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MetricCard } from "./metric-card";

afterEach(() => cleanup());

describe("MetricCard", () => {
  it("muestra etiqueta, valor y nota", () => {
    render(<MetricCard label="ET₀" value="4.6 mm/d" hint="Hargreaves" />);
    expect(screen.getByText("ET₀")).toBeInTheDocument();
    expect(screen.getByText("4.6 mm/d")).toBeInTheDocument();
    expect(screen.getByText("Hargreaves")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("abre una explicación al pulsar cuando recibe info", () => {
    render(<MetricCard label="ET₀" value="4.6 mm/d" info="Agua que se evapora según el clima." />);
    const trigger = screen.getByRole("button", { name: "ET₀: qué significa" });
    expect(screen.queryByText("Agua que se evapora según el clima.")).not.toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.getByText("Agua que se evapora según el clima.")).toBeInTheDocument();
  });
});
