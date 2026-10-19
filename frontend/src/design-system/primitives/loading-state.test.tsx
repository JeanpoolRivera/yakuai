import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { LoadingState } from "./loading-state";

afterEach(() => cleanup());

describe("LoadingState", () => {
  it("se anuncia como estado y permite personalizar el texto", () => {
    render(<LoadingState text="Cargando parcelas…" />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("Cargando parcelas…");
  });
});
