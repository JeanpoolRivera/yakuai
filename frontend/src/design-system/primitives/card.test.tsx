import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";

afterEach(() => cleanup());

describe("Card", () => {
  it("compone título, descripción y contenido con tokens de superficie", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Resumen del día</CardTitle>
          <CardDescription>3 parcelas activas</CardDescription>
        </CardHeader>
        <CardContent>Sin alertas críticas</CardContent>
      </Card>,
    );
    expect(screen.getByRole("heading", { level: 3, name: "Resumen del día" })).toBeInTheDocument();
    expect(screen.getByText("3 parcelas activas")).toBeInTheDocument();
    expect(screen.getByText("Sin alertas críticas")).toBeInTheDocument();
  });

  it("expone la superficie con borde del design system", () => {
    const { container } = render(<Card>Contenido</Card>);
    expect(container.firstChild).toHaveClass("border-border", "bg-white");
  });
});
