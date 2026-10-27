import { StrictMode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { setToken } from "../api/client";
import { App } from "./App";
import { AuthProvider } from "./auth";

afterEach(() => {
  cleanup();
  setToken("");
  localStorage.clear();
});

describe("arranque de sesión", () => {
  it("renderiza el formulario real de acceso sin sesión", async () => {
    setToken("");
    localStorage.clear();

    render(
      <StrictMode>
        <MemoryRouter initialEntries={["/login"]}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      </StrictMode>,
    );

    expect(await screen.findByRole("heading", { name: "Entra a tu campo" })).toBeVisible();
    expect(screen.getByLabelText("Correo de cuenta")).toBeVisible();
    expect(screen.getByLabelText("PIN o contraseña")).toBeVisible();
  });
});