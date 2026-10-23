import { useEffect, useMemo, useRef, useState } from "react";
import { listEvaluations, listFarmers, listIrrigations, listPlots, listSensors } from '@/api/endpoints';
import type { DashboardData } from '@/components/dashboard/overview';
import { summarize, evaluationDays } from '@/components/dashboard/overview';
import { friendlyError } from "@/api/client";

export function useDashboard() {
  const [data, setData] = useState<DashboardData>({ plots: null, farmers: null, sensors: null, evaluations: null, irrigations: null });
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string[]>([]);
  const [updated, setUpdated] = useState<Date | null>(null);
  const request = useRef(0);

  async function load(): Promise<void> {
    const id = ++request.current;
    setLoading(true);
    const results = await Promise.allSettled([listPlots(), listFarmers(), listSensors(), listEvaluations(), listIrrigations()]);
    if (id !== request.current) return;
    const errors: string[] = [];
    const patch: Partial<DashboardData> = {};
    const keys = ["plots", "farmers", "sensors", "evaluations", "irrigations"] as const;
    const names: Record<string, string> = { plots: "parcelas", farmers: "agricultores", sensors: "sensores", evaluations: "evaluaciones", irrigations: "riegos" };
    results.forEach((result, i) => {
      if (result.status === "fulfilled") Object.assign(patch, { [keys[i]]: result.value });
      else errors.push(`${names[keys[i]]}: ${friendlyError(result.reason, "No disponible")}`);
    });
    setData((prev) => ({ ...prev, ...patch }));
    setFailed(errors);
    setUpdated(new Date());
    setLoading(false);
  }

  useEffect(() => {
    void load();
    return () => { request.current++; };
  }, []);

  const now = useMemo(() => updated ?? new Date(), [updated]);
  const overview = useMemo(() => summarize(data, now), [data, now]);
  const chart = useMemo(() => evaluationDays(data.evaluations ?? [], 7, now), [data.evaluations, now]);

  return { data, loading, failed, updated, load, now, overview, chart };
}
