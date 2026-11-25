import { describe, expect, it } from "vitest";
import type { AlertItem, Plot } from "@/api/types";
import { alertSeverityRank, alertTypeLabel, plotLabel, toneColor, toneOf } from "./utils";

const alert = (tipo: string, plot_id: number | null = 4): AlertItem => ({ tipo, plot_id, mensaje: "" });

describe("utilidades de alertas", () => {
  it("clasifica tonos y orden de severidad", () => {
    expect(toneOf(alert("humedad_critica"))).toBe("critica");
    expect(toneOf(alert("sensor_anomalo"))).toBe("sensor");
    expect(toneOf(alert("evaluacion_incompleta"))).toBe("incompleta");
    expect(alertSeverityRank(alert("humedad_critica"))).toBe(0);
    expect(alertSeverityRank(alert("sensor_sin_datos"))).toBe(1);
    expect(alertSeverityRank(alert("evaluacion_incompleta"))).toBe(2);
    expect(alertSeverityRank(alert("otro"))).toBe(3);
  });

  it("prioriza nombre de parcela y traduce etiquetas conocidas", () => {
    const plot = { name: "Parcela Norte" } as Plot;
    expect(plotLabel({ ...alert("sensor_anomalo"), plot })).toBe("Parcela Norte");
    expect(plotLabel(alert("sensor_anomalo"))).toBe("Parcela #4");
    expect(plotLabel(alert("sensor_anomalo", null))).toBeNull();
    expect(alertTypeLabel("sensor_sin_datos")).toBe("Sensor sin datos");
    expect(alertTypeLabel("tipo_nuevo")).toBe("tipo nuevo");
    expect(toneColor("sensor")).toBe("warning");
  });
});
