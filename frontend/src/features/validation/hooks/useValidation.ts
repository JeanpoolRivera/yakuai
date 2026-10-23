import { useRef, useState } from "react";
import { runValidation } from "@/api/endpoints";
import type { ValidationReport } from "@/api/types";
import { friendlyError } from "@/api/client";
import { toastError } from "@/lib/toast";

export function useValidation() {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const runningRef = useRef(false);

  async function run(): Promise<void> {
    if (runningRef.current) return;
    runningRef.current = true;
    setLoading(true);
    setError(null);
    try {
      setReport(await runValidation());
    } catch (err) {
      const msg = friendlyError(err, "No se pudo correr la validación.");
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
      runningRef.current = false;
    }
  }

  return { report, loading, error, run };
}