import type { Evaluation } from "@/api/types";

export function latestPerPlot(all: Evaluation[]): Evaluation[] {
  const seen = new Map<number, Evaluation>();
  const sorted = [...all].sort((a, b) => (a.evaluated_at < b.evaluated_at ? 1 : -1));
  for (const e of sorted) {
    if (!seen.has(e.plot_id)) seen.set(e.plot_id, e);
  }
  return [...seen.values()];
}

export function cardBg(tone: string): string {
  const map: Record<string, string> = {
    critica: "border-danger-100 bg-danger-50",
    riega: "border-warning-100 bg-white",
    no: "border-success-100 bg-white",
    espera: "border-info-100 bg-white",
    incompleta: "border-neutral-200 bg-white",
  };
  return map[tone] ?? map.incompleta;
}

export function cardBarColor(tone: string): string {
  const map: Record<string, string> = {
    critica: "#dc2626",
    riega: "#d97706",
    no: "#16a34a",
    espera: "#2563eb",
    incompleta: "#a3a3a3",
  };
  return map[tone] ?? map.incompleta;
}

export function filterEvaluations(evals: Evaluation[], search: string, filter: string): Evaluation[] {
  let out = [...evals];
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    out = out.filter((e) => (e.plot?.name ?? "").toLowerCase().includes(q));
  }
  if (filter !== "todas") {
    out = out.filter((e) => e.result === filter);
  }
  return out;
}

export function sortEvaluations(evals: Evaluation[], sort: "reciente" | "antiguo"): Evaluation[] {
  return [...evals].sort((a, b) => {
    const diff = a.evaluated_at < b.evaluated_at ? 1 : -1;
    return sort === "reciente" ? diff : -diff;
  });
}

export function countByResult(evals: Evaluation[]): Record<string, number> {
  return {
    todas: evals.length,
    riega: evals.filter((e) => e.result === "riega").length,
    no: evals.filter((e) => e.result === "no").length,
    espera: evals.filter((e) => e.result === "espera").length,
    incompleta: evals.filter((e) => e.result === "incompleta").length,
  };
}