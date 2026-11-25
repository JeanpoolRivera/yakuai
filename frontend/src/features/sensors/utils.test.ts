import { describe, expect, it } from "vitest";
import { deviceIcon, rangeMessage, sensorValue, stateLabel, stateTone } from "./utils";

describe("utilidades de sensores", () => {
  it("valida límites de lecturas de sensores", () => {
    expect(rangeMessage("humedad", 1023)).toBeNull();
    expect(rangeMessage("humedad", 1023.5)).toContain("0–1023");
    expect(rangeMessage("aire_temp", -10)).toBeNull();
    expect(rangeMessage("aire_temp", 60.1)).toContain("-10 a 60");
    expect(rangeMessage("aire_hr", 100)).toBeNull();
    expect(rangeMessage("lluvia", 0.5)).toContain("0 o 1");
    expect(rangeMessage("caudal", 61)).toContain("0–60");
    expect(rangeMessage("humedad", Number.NaN)).toBe("Escribe un valor numérico.");
  });

  it("resume icono, estado y tono según el tipo y disponibilidad", () => {
    expect(deviceIcon("humedad")).toBe("droplet");
    expect(deviceIcon("lluvia")).toBe("cloud");
    expect(deviceIcon("aire_temp")).toBe("thermometer");
    expect(deviceIcon("otro")).toBe("radio");
    expect(stateLabel({ is_active: false, status: "ok" })).toBe("Inactivo");
    expect(stateLabel({ is_active: true, status: "anomalo" })).toBe("En revisión");
    expect(stateTone({ is_active: true, status: "ok" })).toBe("good");
    expect(stateTone({ is_active: true, status: "sin_datos" })).toBe("neutral");
  });

  it("prioriza el valor normalizado y usa fallback para la lectura", () => {
    expect(sensorValue({ latest_measurement: { value: 52.5, raw_value: 600 } })).toBe("52.5");
    expect(sensorValue({ latest_measurement: { raw_value: 600 } })).toBe("600");
    expect(sensorValue({ latest_measurement: null })).toBe("—");
  });
});
