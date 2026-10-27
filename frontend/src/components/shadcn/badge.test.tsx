import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Badge } from "./badge";
import { badgeVariants } from "./badge-utils";

afterEach(() => cleanup());

describe("Badge de compatibilidad", () => {
  it("traduce variantes antiguas a los tonos canónicos", () => {
    render(<Badge variant="verdictRiega">Regar</Badge>);
    expect(screen.getByText("Regar")).toHaveClass("bg-verdict-riega-bg", "text-verdict-riega-text");
  });

  it("mantiene el generador de clases público sobre los mismos tokens", () => {
    expect(badgeVariants({ variant: "warning" })).toContain("bg-warning-bg");
  });
});
