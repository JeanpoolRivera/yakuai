import { useCallback, useEffect, useLayoutEffect, useState } from "react";

export const FIELD_MODE_STORAGE_KEY = "yakuai-field-mode";
export const FIELD_MODE_CLASS = "field-mode";

function readStored(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(FIELD_MODE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function applyClass(enabled: boolean): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle(FIELD_MODE_CLASS, enabled);
}

function persist(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FIELD_MODE_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    return;
  }
}

export interface UseFieldModeResult {
  enabled: boolean;
  toggle: () => void;
}

export function useFieldMode(): UseFieldModeResult {
  const [enabled, setEnabled] = useState<boolean>(readStored);

  useLayoutEffect(() => {
    applyClass(enabled);
    persist(enabled);
    return () => {
      applyClass(false);
    };
  }, [enabled]);

  useEffect(() => {
    const onStorage = (event: StorageEvent): void => {
      if (event.key === FIELD_MODE_STORAGE_KEY) setEnabled(event.newValue === "1");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback(() => setEnabled((value) => !value), []);

  return { enabled, toggle };
}
