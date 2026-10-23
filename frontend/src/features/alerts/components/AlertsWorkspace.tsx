import { useState } from 'react';
import { Link } from "react-router-dom";
import { ArrowRight, Bell, Check, Droplet, Info, Radio, TriangleAlert } from 'lucide-react';
import { Badge } from "@/components/shadcn/badge";
import { FilterTabs } from "@/components/shadcn/filter-tabs";
import { PageHead } from "@/components/shadcn/page-head";
import { PaginationControls } from "@/components/shadcn/PaginationControls";
import { SearchInput } from "@/components/shadcn/search-input";
import { Stat } from "@/components/shadcn/Stat";
import { colors } from "@/lib/theme";
import { useCollection } from "@/hooks/useCollection";
import { useAlerts } from "../hooks/useAlerts";
import { ALERTS_COPY as C } from "../copy";
import { toneOf, plotLabel, ALERT_HELP, alertTypeLabel } from "../utils";
import type { AlertItem } from "@/api/types";

type Tab = "todas" | "criticas" | "sensores";

export function AlertsWorkspace(): React.JSX.Element {
  const { alerts, loading, error, load, criticas, sensores } = useAlerts();
  const [tab, setTab] = useState<Tab>("todas");

  const coll = useCollection(alerts, {
    perPage: 10,
    search: (a, q) => {
      const withPlot = a as AlertItem & { plot?: { name?: string } };
      return `${a.mensaje} ${a.plot_id ?? ""} ${withPlot.plot?.name ?? ""}`.toLowerCase().includes(q);
    },
    filter: tab === "todas" ? undefined : tab === "criticas" ? (a) => a.tipo.includes("critica") : (a) => a.tipo.startsWith("sensor"),
  });

  const shown = coll.items;

  return (
    <div>
      <PageHead eyebrow={C.eyebrow} title={C.title} desc={C.description} crumbs={C.crumbs} />
      {loading ? (
        <div className="flex items-center justify-center gap-3 py-10 text-sm text-neutral-600" role="status" aria-live="polite">
          <span>Cargando alertas…</span>
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-md border border-danger-100 bg-danger-50 p-4 text-sm text-danger-600">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1 text-neutral-800">
            {error}{" "}
            <button className="font-medium text-primary-700 hover:underline" onClick={() => void load()}>
              {C.retry}
            </button>
          </div>
        </div>
      ) : (
        <section aria-label="Lista de alertas" className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat value={String(alerts.length)} label={C.stats.total} icon={<Bell className="h-[18px] w-[18px]" aria-hidden="true" />} sub="Estado actual del campo" />
            <Stat value={String(criticas.length)} label={C.stats.critica} icon={<Droplet className="h-[18px] w-[18px]" aria-hidden="true" />} tone={criticas.length ? "bad" : "ok"} sub="Parcelas que requieren atención" />
            <Stat value={String(sensores.length)} label={C.stats.sensores} icon={<Radio className="h-[18px] w-[18px]" aria-hidden="true" />} tone={sensores.length ? "warn" : "ok"} sub="Disponibilidad y calidad de los datos" />
          </div>

          <div className="grid gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-neutral-800">{C.helpTitle}</h2>
              <p className="mt-1 text-sm text-neutral-600">{C.helpDesc}</p>
            </div>
            {criticas.length > 0 ? (
              <div className="flex items-start gap-3 rounded-md border border-warning-100 bg-warning-50 p-4 text-sm text-warning-600">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1 text-neutral-800">{C.criticalBanner(criticas.length)}</div>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <FilterTabs<Tab>
                label="Filtrar alertas"
                value={tab}
                onChange={(v) => { setTab(v); coll.setPage(1); }}
                options={[
                  { value: "todas", label: `Todas (${alerts.length})` },
                  { value: "criticas", label: `Críticas (${criticas.length})` },
                  { value: "sensores", label: `Sensores (${sensores.length})` },
                ]}
              />
              <SearchInput value={coll.query} onChange={coll.setQuery} placeholder={C.search} label={C.searchLabel} className="min-w-[200px] flex-1" />
            </div>
            <span className="text-xs text-neutral-500" aria-live="polite">{coll.total} {coll.total === 1 ? "alerta" : "alertas"}</span>
            {shown.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-10 text-center">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-neutral-100 text-neutral-500">
                  <Check className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="text-base font-semibold text-neutral-800">{coll.query ? C.noMatch : tab === "todas" ? C.noAlerts : C.noTab}</p>
                <p className="max-w-[52ch] text-sm text-neutral-500">{coll.query ? C.emptyHint.search : tab === "todas" ? C.emptyHint.none : C.emptyHint.tab}</p>
              </div>
            ) : (
              <>
                <div className="alert-grid grid gap-4">
                  {shown.map((a, i) => {
                    const label = plotLabel(a);
                    const tone = toneOf(a);
                    const critical = a.tipo.includes("critica");
                    return (
                      <article key={`${a.tipo}-${a.plot_id}-${i}`} className="alert-tile flex gap-3 rounded-lg border border-l-4 border-neutral-200 bg-white p-4 shadow-card" style={{ borderLeftColor: critical ? colors.danger[500] : tone === "sensor" ? colors.warning[500] : colors.neutral[400] }}>
                        <span aria-hidden="true" className={critical ? "text-danger-600" : tone === "sensor" ? "text-warning-600" : "text-info-600"}>
                          {a.tipo.startsWith("sensor") ? <Radio className="h-5 w-5" /> : critical ? <TriangleAlert className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-neutral-800">{a.mensaje}</p>
                          {ALERT_HELP[a.tipo] ? <p className="mt-1 text-xs text-neutral-500">{ALERT_HELP[a.tipo].hint}</p> : null}
                          {label ? <p className="mt-1 text-xs text-neutral-500">{label}</p> : null}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <Badge variant={critical ? "destructive" : tone === "sensor" ? "warning" : "secondary"}>{alertTypeLabel(a.tipo)}</Badge>
                          {a.plot_id !== null ? (
                            <Link to="/evaluar" state={{ plotId: a.plot_id }} className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15">
                              {C.goPlot} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </Link>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
                {coll.total > 10 ? (
                  <PaginationControls page={coll.page} pages={coll.pages} onPageChange={coll.setPage} count={C.pageLabel(coll.total)} />
                ) : null}
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
