import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { ApiError } from "@/api/client";
import { useIrrigations } from "./useIrrigations";

const api = vi.hoisted(() => ({
  listIrrigations: vi.fn(),
  listPlots: vi.fn(),
}));

vi.mock("@/api/endpoints", () => api);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const plot = { id: 1, name: "Parcela Norte" };

describe("useIrrigations", () => {
  it("carga riegos y parcelas en paralelo", async () => {
    api.listIrrigations.mockResolvedValue([{ id: 1, plot_id: 1, status: "activo" }]);
    api.listPlots.mockResolvedValue([plot]);

    const { result } = renderHook(() => useIrrigations());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.plots).toEqual([plot]);
    expect(result.current.error).toBeNull();
    expect(api.listIrrigations).toHaveBeenCalledTimes(1);
    expect(api.listPlots).toHaveBeenCalledTimes(1);
  });

  it("expone el error y permite reintentar", async () => {
    api.listIrrigations.mockRejectedValueOnce(new ApiError("Servidor no disponible", 500));
    api.listPlots.mockResolvedValue([]);

    const { result } = renderHook(() => useIrrigations());

    await waitFor(() => expect(result.current.error).toBe("Servidor no disponible"));
    expect(result.current.loading).toBe(false);

    api.listIrrigations.mockResolvedValueOnce([]);
    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.error).toBeNull();
    expect(api.listIrrigations).toHaveBeenCalledTimes(2);
  });
});
