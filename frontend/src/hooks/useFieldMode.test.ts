import { describe, it, expect, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { FIELD_MODE_CLASS, FIELD_MODE_STORAGE_KEY, useFieldMode } from "./useFieldMode";

afterEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove(FIELD_MODE_CLASS);
});

describe("useFieldMode", () => {
  it("activa el modo campo y persiste la preferencia", () => {
    const { result } = renderHook(() => useFieldMode());

    expect(result.current.enabled).toBe(false);
    expect(document.documentElement).not.toHaveClass(FIELD_MODE_CLASS);

    act(() => result.current.toggle());

    expect(result.current.enabled).toBe(true);
    expect(document.documentElement).toHaveClass(FIELD_MODE_CLASS);
    expect(localStorage.getItem(FIELD_MODE_STORAGE_KEY)).toBe("1");
  });

  it("restaura la preferencia guardada al montar", () => {
    localStorage.setItem(FIELD_MODE_STORAGE_KEY, "1");

    const { result } = renderHook(() => useFieldMode());

    expect(result.current.enabled).toBe(true);
    expect(document.documentElement).toHaveClass(FIELD_MODE_CLASS);
  });

  it("retira la clase del documento al desmontar", () => {
    localStorage.setItem(FIELD_MODE_STORAGE_KEY, "1");

    const { unmount } = renderHook(() => useFieldMode());
    expect(document.documentElement).toHaveClass(FIELD_MODE_CLASS);

    unmount();
    expect(document.documentElement).not.toHaveClass(FIELD_MODE_CLASS);
  });
});
