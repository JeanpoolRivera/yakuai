import { useMemo, useState } from "react";
import { listEvaluations, listFarmers, listIrrigations, listPlots, listSensors } from "@/api/endpoints";
import type { DashboardData } from "@/components/dashboard/overview";
import { summarize, evaluationDays } from "@/components/dashboard/overview";
import { friendlyError } from "@/api/client";
import { useAsync } from "@/hooks/useAsync";

type DashboardSnapshot = { data: DashboardData; failed: string[]; updated: Date };
const EMPTY_DASHBOARD: DashboardData = { plots: null, farmers: null, sensors: null, evaluations: null, irrigations: null };

export function useDashboard() {
  const [initialNow] = useState(() => new Date());
  const { data: snapshot, loading, execute } = useAsync<DashboardSnapshot>(async () => {
    const results = await Promise.allSettled([listPlots(), listFarmers(), listSensors(), listEvaluations(), listIrrigations()]);
    const values: Partial<DashboardData> = {};
    const failed: string[] = [];
    const keys = ["plots", "farmers", "sensors", "evaluations", "irrigations"] as const;
    const names: Record<(typeof keys)[number], string> = { plots: "parcelas", farmers: "agricultores", sensors: "sensores", evaluations: "evaluaciones", irrigations: "riegos" };
    results.forEach((result, index) => {
      const key = keys[index];
      if (result.status === "fulfilled") Object.assign(values, { [key]: result.value });
      else failed.push(`${names[key]}: ${friendlyError(result.reason, "No disponible")}`);
    });
    return { data: { ...EMPTY_DASHBOARD, ...values }, failed, updated: new Date() };
  });

  const data = snapshot?.data ?? EMPTY_DASHBOARD;
  const failed = snapshot?.failed ?? [];
  const updated = snapshot?.updated ?? null;
  const now = updated ?? initialNow;
  const overview = useMemo(() => summarize(data, now), [data, now]);
  const chart = useMemo(() => evaluationDays(data.evaluations ?? [], 7, now), [data.evaluations, now]);

  return { data, loading, failed, updated, load: execute, now, overview, chart };
}
