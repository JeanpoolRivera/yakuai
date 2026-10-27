import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

export type AsyncStatus = "idle" | "loading" | "success" | "error";

export interface AsyncState<T> {
  data: T | null;
  error: string | null;
  status: AsyncStatus;
  loading: boolean;
  isIdle: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export interface UseAsyncOptions {
  immediate?: boolean;
  refreshKey?: unknown;
  onSuccess?: (data: unknown) => void;
  onError?: (error: unknown) => void;
}

function toAsyncState<T>(data: T | null, error: string | null, status: AsyncStatus): AsyncState<T> {
  return {
    data,
    error,
    status,
    loading: status === "loading",
    isIdle: status === "idle",
    isSuccess: status === "success",
    isError: status === "error",
  };
}

export function useAsync<T>(
  asyncFn: () => Promise<T>,
  options: UseAsyncOptions = {},
): AsyncState<T> & { execute: () => Promise<void>; refresh: () => Promise<void>; reset: () => void; setData: Dispatch<SetStateAction<T | null>> } {
  const { immediate = true, refreshKey, onSuccess, onError } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AsyncStatus>(immediate ? "loading" : "idle");
  const mountedRef = useRef(false);
  const requestId = useRef(0);
  const asyncFnRef = useRef(asyncFn);

  useEffect(() => {
    asyncFnRef.current = asyncFn;
  }, [asyncFn]);

  const execute = useCallback(async () => {
    if (!mountedRef.current) return;
    const currentRequest = ++requestId.current;
    setStatus("loading");
    setError(null);
    try {
      const result = await asyncFnRef.current();
      if (mountedRef.current && currentRequest === requestId.current) {
        setData(result);
        setStatus("success");
        onSuccess?.(result);
      }
    } catch (err) {
      if (mountedRef.current && currentRequest === requestId.current) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        setError(message);
        setStatus("error");
        onError?.(err);
      }
    }
  }, [onSuccess, onError]);

  const refresh = useCallback(async () => {
    if (!mountedRef.current) return;
    const currentRequest = ++requestId.current;
    setError(null);
    try {
      const result = await asyncFnRef.current();
      if (mountedRef.current && currentRequest === requestId.current) {
        setData(result);
        setStatus("success");
        onSuccess?.(result);
      }
    } catch (err) {
      if (mountedRef.current && currentRequest === requestId.current) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        setError(message);
        setStatus("error");
        onError?.(err);
      }
    }
  }, [onSuccess, onError]);

  const reset = useCallback(() => {
    requestId.current += 1;
    setData(null);
    setError(null);
    setStatus("idle");
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) void execute();
    return () => {
      mountedRef.current = false;
      requestId.current += 1;
    };
  }, [execute, immediate, refreshKey]);

  return { ...toAsyncState(data, error, status), execute, refresh, reset, setData };
}

export function useAsyncCallback<T, Args extends unknown[]>(
  asyncFn: (...args: Args) => Promise<T>,
  options: UseAsyncOptions = {},
): AsyncState<T> & { execute: (...args: Args) => Promise<void>; reset: () => void } {
  const { onSuccess, onError } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AsyncStatus>("idle");
  const mountedRef = useRef(false);
  const requestId = useRef(0);
  const asyncFnRef = useRef(asyncFn);

  useEffect(() => {
    asyncFnRef.current = asyncFn;
  }, [asyncFn]);

  const execute = useCallback(async (...args: Args) => {
    if (!mountedRef.current) return;
    const currentRequest = ++requestId.current;
    setStatus("loading");
    setError(null);
    try {
      const result = await asyncFnRef.current(...args);
      if (mountedRef.current && currentRequest === requestId.current) {
        setData(result);
        setStatus("success");
        onSuccess?.(result);
      }
    } catch (err) {
      if (mountedRef.current && currentRequest === requestId.current) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        setError(message);
        setStatus("error");
        onError?.(err);
      }
    }
  }, [onSuccess, onError]);

  const reset = useCallback(() => {
    requestId.current += 1;
    setData(null);
    setError(null);
    setStatus("idle");
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestId.current += 1;
    };
  }, []);

  return { ...toAsyncState(data, error, status), execute, reset };
}
