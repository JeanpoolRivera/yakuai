import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "./sheet";

afterEach(() => cleanup());

describe("Sheet", () => {
  it("abre una hoja inferior modal con título y cierre accesible", () => {
    const onOpenChange = vi.fn();
    render(
      <Sheet open onOpenChange={onOpenChange}>
        <SheetContent side="bottom">
          <SheetTitle>Elegir parcela</SheetTitle>
          <SheetDescription>Selecciona una parcela para evaluar.</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    const sheet = screen.getByRole("dialog");
    expect(sheet).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Elegir parcela" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
