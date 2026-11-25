import { describe, expect, it } from "vitest";
import { hintFor, passwordStrength, validateEmail, validateSecret } from "./utils";

describe("utilidades de autenticación", () => {
  it("selecciona ayudas según el error sin revelar detalles para el bloqueo", () => {
    expect(hintFor(429, "PIN incorrecto")).toBeNull();
    expect(hintFor(401, "Cuenta inactiva")).toBe("Pide a tu administrador que active tu cuenta.");
    expect(hintFor(401, "PIN incorrecto")).toBe("Verifica los 4 dígitos con tu técnico si lo olvidaste.");
    expect(hintFor(401, "Credenciales inválidas")).toBe("Verifica tu correo y contraseña e inténtalo de nuevo.");
  });

  it("clasifica fortaleza por longitud y variedad", () => {
    expect(passwordStrength("")).toEqual({ score: 0, label: "", color: "" });
    expect(passwordStrength("abc").label).toBe("Débil");
    expect(passwordStrength("Abcdefg1").label).toBe("Media");
    expect(passwordStrength("Abcdefghij1!")).toEqual({ score: 5, label: "Fuerte", color: "#15803d" });
  });

  it("valida correo y secreto requerido", () => {
    expect(validateEmail("  ")).toBe("Escribe tu correo.");
    expect(validateEmail("no-es-correo")).toBe("Escribe un correo válido.");
    expect(validateEmail("persona@ejemplo.pe")).toBe("");
    expect(validateSecret("")).toBe("Escribe tu contraseña o PIN.");
    expect(validateSecret("1234")).toBe("");
  });
});
