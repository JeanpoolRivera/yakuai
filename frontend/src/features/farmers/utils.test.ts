import { describe, expect, it } from "vitest";
import type { Farmer } from "@/api/types";
import { filterFarmers, initial, twoInitials, validateFarmer, waLink } from "./utils";

const farmers = [
  { id: 1, name: "María Quispe", phone: "+51 987 654 321" },
  { id: 2, name: "Juan Pérez", phone: null },
] as Farmer[];

describe("utilidades de agricultores", () => {
  it("genera iniciales y enlace de WhatsApp normalizado", () => {
    expect(twoInitials("  María   Quispe ")).toBe("MQ");
    expect(twoInitials("Juan")).toBe("J");
    expect(initial("  ")).toBe("?");
    expect(waLink("+51 (987) 654-321")).toBe("https://wa.me/51987654321");
  });

  it("valida nombre y teléfono opcional", () => {
    expect(validateFarmer("A", "")).toBe("El nombre debe tener al menos 2 letras.");
    expect(validateFarmer("María", "abc")).toBe("Teléfono inválido.");
    expect(validateFarmer("María", "")).toBeNull();
    expect(validateFarmer("María", "+51 987-654-321")).toBeNull();
  });

  it("busca por nombre o teléfono ignorando mayúsculas", () => {
    expect(filterFarmers(farmers, "  MARÍA ").map((farmer) => farmer.id)).toEqual([1]);
    expect(filterFarmers(farmers, "987 654").map((farmer) => farmer.id)).toEqual([1]);
    expect(filterFarmers(farmers, "  ")).toBe(farmers);
  });
});
