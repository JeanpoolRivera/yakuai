import { useCallback, useEffect, useRef, useState } from "react";

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
  onSuccess?: (data: unknown) => void;
  onError?: (error: unknown) => void;
}

export function useAsync<T>(
  asyncFn: () => Promise<T>,
  options: UseAsyncOptions = {},
): AsyncState<T> & { execute: () => Promise<void>; reset: () => void } {
  const { immediate = true, onSuccess, onError } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AsyncStatus>("idle");
  const mountedRef = useRef(true);
  const asyncFnRef = useRef(asyncFn);
  asyncFnRef.current = asyncFn;

  const execute = useCallback(async () => {
    if (!mountedRef.current) return;
    setStatus("loading");
    setError(null);
    try {
      const result = await asyncFnRef.current();
      if (mountedRef.current) {
        setData(result);
        setStatus("success");
        onSuccess?.(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        setError(msg);
        setStatus("error");
        onError?.(err);
      }
    }
  }, [onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setStatus("idle");
  }, []);

  useEffect(() => {
    if (immediate) {
      void execute();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [execute, immediate]);

  return {
    data,
    error,
    status,
    loading: status === "loading",
    isIdle: status === "idle",
    isSuccess: status === "success",
    isError: status === "error",
    execute,
    reset,
  };
}

export function useAsyncCallback<T, Args extends unknown[]>(
  asyncFn: (...args: Args) => Promise<T>,
  options: UseAsyncOptions = {},
): AsyncState<T> & { execute: (...args: Args) => Promise<void>; reset: () => void } {
  const { onSuccess, onError } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AsyncStatus>("idle");
  const mountedRef = useRef(true);
  const asyncFnRef = useRef(asyncFn);
  asyncFnRef.current = asyncFn;

  const execute = useCallback(async (...args: Args) => {
    if (!mountedRef.current) return;
    setStatus("loading");
    setError(null);
    try {
      const result = await asyncFnRef.current(...args);
      if (mountedRef.current) {
        setData(result);
        setStatus("success");
        onSuccess?.(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        setError(msg);
        setStatus("error");
        onError?.(err);
      }
    }
  }, [onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setStatus("idle");
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    error,
    status,
    loading: status === "loading",
    isIdle: status === "idle",
    isSuccess: status === "success",
    isError: status === "error",
    execute,
    reset,
  };
}