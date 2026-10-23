import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { ApiError } from "@/api/client";
import { useIrrigationMutations } from "./useIrrigationMutations";

const api = vi.hoisted(() => ({
  createIrrigation: vi.fn(),
  correctIrrigation: vi.fn(),
  voidIrrigation: vi.fn(),
}));

const toast = vi.hoisted(() => ({
  toastOk: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/api/endpoints", () => api);
vi.mock("@/lib/toast", () => toast);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const input = {
  plot_id: 1,
  occurred_at: "2026-09-12T06:30:00",
  applied_liters: 3000,
  recommended_liters: null,
};

describe("useIrrigationMutations", () => {
  it("registra, avisa y recarga", async () => {
    api.createIrrigation.mockResolvedValue({ id: 1 });
    const onDone = vi.fn();
    const { result } = renderHook(() => useIrrigationMutations(onDone));

    let ok = false;
    await act(async () => {
      ok = await result.current.create(input);
    });

    expect(ok).toBe(true);
    expect(api.createIrrigation).toHaveBeenCalledWith(input);
    expect(toast.toastOk).toHaveBeenCalledOnce();
    expect(onDone).toHaveBeenCalledOnce();
    expect(result.current.busy).toBe(false);
  });

  it("muestra errores de validación del backend", async () => {
    api.createIrrigation.mockRejectedValue(
      new ApiError("Datos inválidos", 422, { applied_liters: ["Debe ser numérico"] }),
    );
    const { result } = renderHook(() => useIrrigationMutations());

    let ok = true;
    await act(async () => {
      ok = await result.current.create(input);
    });

    expect(ok).toBe(false);
    expect(result.current.fieldErrors).toEqual({ applied_liters: ["Debe ser numérico"] });
    expect(toast.toastError).toHaveBeenCalledWith("Revisa los campos marcados.");

    act(() => result.current.clearFieldErrors());
    expect(result.current.fieldErrors).toEqual({});
  });

  it("muestra los errores de validación al corregir o anular", async () => {
    api.correctIrrigation.mockRejectedValueOnce(
      new ApiError("Datos inválidos", 422, { motivo: ["El motivo es obligatorio"] }),
    );
    api.voidIrrigation.mockRejectedValueOnce(
      new ApiError("Datos inválidos", 422, { motivo: ["El motivo es obligatorio"] }),
    );
    const { result } = renderHook(() => useIrrigationMutations());

    await act(async () => {
      expect(await result.current.correct(1, 2800, "")).toBe(false);
    });
    expect(result.current.fieldErrors).toEqual({ motivo: ["El motivo es obligatorio"] });

    await act(async () => {
      expect(await result.current.annul(1, "")).toBe(false);
    });
    expect(result.current.fieldErrors).toEqual({ motivo: ["El motivo es obligatorio"] });
  });

  it("corrige y anula con motivo", async () => {
    api.correctIrrigation.mockResolvedValue({ id: 2 });
    api.voidIrrigation.mockResolvedValue({ id: 1 });
    const { result } = renderHook(() => useIrrigationMutations());

    await act(async () => {
      expect(await result.current.correct(1, 2800, "Medí mal")).toBe(true);
      expect(await result.current.annul(1, "No se regó")).toBe(true);
    });

    expect(api.correctIrrigation).toHaveBeenCalledWith(1, 2800, "Medí mal");
    expect(api.voidIrrigation).toHaveBeenCalledWith(1, "No se regó");
    expect(toast.toastOk).toHaveBeenCalledTimes(2);
  });
});
