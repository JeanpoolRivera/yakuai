import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { FieldModeToggle } from "./field-mode-toggle";
import { FIELD_MODE_CLASS, FIELD_MODE_STORAGE_KEY } from "@/hooks/useFieldMode";

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.classList.remove(FIELD_MODE_CLASS);
});

describe("FieldModeToggle", () => {
  it("expone un switch accesible y alterna el modo campo", () => {
    render(<FieldModeToggle />);
    const toggle = screen.getByRole("switch", { name: "Modo campo" });

    expect(toggle).toHaveAttribute("aria-checked", "false");
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(document.documentElement).toHaveClass(FIELD_MODE_CLASS);
    expect(localStorage.getItem(FIELD_MODE_STORAGE_KEY)).toBe("1");
  });

  it("mantiene el objetivo táctil y el estado persistido", () => {
    localStorage.setItem(FIELD_MODE_STORAGE_KEY, "1");
    render(<FieldModeToggle />);

    const toggle = screen.getByRole("switch", { name: "Modo campo" });
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(toggle).toHaveClass("min-h-[var(--target-sm)]");
  });
});
