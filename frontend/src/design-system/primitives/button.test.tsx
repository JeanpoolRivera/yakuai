import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Button } from "./button";

afterEach(() => cleanup());

describe("Button", () => {
  it("dispara onClick y mantiene un objetivo táctil de 44px", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Guardar</Button>);
    const button = screen.getByRole("button", { name: "Guardar" });
    expect(button).toHaveClass("min-h-[var(--target-md)]");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("en estado loading se deshabilita y anuncia aria-busy", () => {
    render(<Button loading>Guardando</Button>);
    const button = screen.getByRole("button", { name: "Guardando" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("asChild cede el render a un único hijo sin inyectar el spinner", () => {
    render(
      <Button asChild>
        <a href="/sensores">Ir a sensores</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Ir a sensores" });
    expect(link).toHaveAttribute("href", "/sensores");
    expect(link).toHaveClass("min-h-[var(--target-md)]");
    expect(link.querySelector("svg")).toBeNull();
  });
});
