import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Badge } from "./badge";

afterEach(() => cleanup());

describe("Badge", () => {
  it("usa el par accesible del veredicto", () => {
    render(<Badge tone="riega">Riega</Badge>);
    const badge = screen.getByText("Riega");
    expect(badge).toHaveClass("bg-verdict-riega-bg", "text-verdict-riega-text");
  });

  it("marca el punto decorativo como aria-hidden", () => {
    const { container } = render(
      <Badge tone="success" dot>
        Correcto
      </Badge>,
    );
    const dot = container.querySelector("span[aria-hidden='true']");
    expect(dot).toHaveClass("bg-current");
  });
});
