import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SearchInput } from "./search-input";

afterEach(() => cleanup());

describe("SearchInput", () => {
  it("propaga el texto escrito y expone una etiqueta accesible", () => {
    const onChange = vi.fn();
    render(<SearchInput label="Buscar parcelas" value="" onChange={onChange} />);
    const input = screen.getByRole("searchbox", { name: "Buscar parcelas" });
    fireEvent.change(input, { target: { value: "maíz" } });
    expect(onChange).toHaveBeenCalledWith("maíz");
  });

  it("limpia con el botón y con la tecla Escape", () => {
    const onChange = vi.fn();
    render(<SearchInput label="Buscar parcelas" value="maíz" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));
    expect(onChange).toHaveBeenCalledWith("");
    fireEvent.keyDown(screen.getByRole("searchbox", { name: "Buscar parcelas" }), { key: "Escape" });
    expect(onChange).toHaveBeenCalledWith("");
  });
});
