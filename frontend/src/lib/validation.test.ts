import { describe, expect, it } from "vitest";
import {
  isValidEmail,
  isValidFarmerName,
  isValidFourDigitPin,
  isValidPeruvianPhone,
  isValidPlotName,
  isValidRecoveryCode,
} from "./validation";

describe("validadores de datos", () => {
  it("acepta correos con formato válido y rechaza partes incompletas", () => {
    expect(isValidEmail(" persona+riego@ejemplo.pe ")).toBe(true);
    expect(isValidEmail("persona@localhost")).toBe(false);
    expect(isValidEmail("a..b@ejemplo.pe")).toBe(false);
    expect(isValidEmail("@ejemplo.pe")).toBe(false);
  });

  it("valida nombres de agricultor y parcela con límites y caracteres permitidos", () => {
    expect(isValidFarmerName(" María-José O’Neil ")).toBe(true);
    expect(isValidFarmerName("A")).toBe(false);
    expect(isValidFarmerName("Juan 2")).toBe(false);
    expect(isValidPlotName("Parcela 2 - Norte")).toBe(true);
    expect(isValidPlotName("<script>")).toBe(false);
  });

  it("valida teléfono peruano, PIN y código de recuperación por longitud", () => {
    expect(isValidPeruvianPhone("987654321")).toBe(true);
    expect(isValidPeruvianPhone("+51987654321")).toBe(false);
    expect(isValidFourDigitPin("0427")).toBe(true);
    expect(isValidFourDigitPin("427")).toBe(false);
    expect(isValidRecoveryCode("012345")).toBe(true);
    expect(isValidRecoveryCode("12345a")).toBe(false);
  });
});
