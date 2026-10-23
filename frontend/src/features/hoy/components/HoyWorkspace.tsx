import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, Droplet, Gauge, LoaderCircle, Map as MapIcon, Radio, RefreshCw, Search, Sprout } from "lucide-react";
import { Badge, badgeVariantForTone } from "@/components/shadcn/badge";
import { Banner, Empty, Loading } from "@/components/shadcn/feedback";
import { Button } from "@/components/shadcn/button";
import { FilterTabs } from "@/components/shadcn/filter-tabs";
import { SearchInput } from "@/components/shadcn/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import { SoilMeter } from "@/components/shadcn/soil-meter";
import { ageLabel, badgeToneForResult, fmtDateTime, fmtNum, resultLabel } from "@/lib/format";

import { cn } from "@/lib/utils";
import { useHoy } from '../hooks/useHoy';
import { HOY_COPY as C } from '../copy';
import { cardBg, cardBarColor, filterEvaluations, sortEvaluations, countByResult } from '../utils';


type Filter = "todas" | "riega" | "no" | "espera" | "incompleta";
type Sort = "reciente" | "antiguo";

export function HoyWorkspace(): React.JSX.Element {
  const { loading, error, plotCount, sensorsOk, sensorsTotal, latest, refreshing, load } = useHoy();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("todas");
  const [sort, setSort] = useState<Sort>("reciente");

  const counts = countByResult(latest);
  const filtered = useMemo(() => sortEvaluations(filterEvaluations(latest, search, filter), sort), [latest, search, filter, sort]);

  if (loading) return <Loading text={C.loading} />;
  if (error) return <div className="grid gap-4"><Banner kind="bad">{error} <Button variant="link" size="sm" onClick={() => void load()}>{C.retry}</Button></Banner></div>;
  if (plotCount === 0) return <Empty icon={<Sprout className="h-5 w-5" aria-hidden="true" />} title={C.noParcels} hint={C.noParcelsHint} />;

  const urgentes = latest.filter((e) => e.result === "riega").length;
  const alert = urgentes > 0;

  return (
    <div className="grid gap-4">
      <header className={cn("flex flex-wrap items-center gap-4 rounded-lg border p-4 sm:p-5", alert ? "border-primary-800 bg-primary-900 text-white" : "border-success-100 bg-white")}>
        <div className="min-w-0 flex-1">
          <p className={cn("text-2xs font-semibold uppercase tracking-wider", alert ? "text-dark-accent" : "text-primary-700")}>{C.title}</p>
          <h1 className={cn("mt-1 text-2xl font-semibold tracking-tight", alert ? "text-white" : "text-neutral-800")}>
            {urgentes > 0 ? C.urgentTitle(urgentes) : C.calmTitle}
          </h1>
          <p className={cn("mt-1 text-sm", alert ? "text-dark-muted" : "text-neutral-600")}>
            {urgentes > 0 ? C.urgentSub : C.calmSub}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="lg" variant={alert ? "secondary" : "default"} asChild>
              <Link to="/evaluar">{C.evaluateButton} <ArrowRight className="h-[17px] w-[17px]" aria-hidden="true" /></Link>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void load(true)} disabled={refreshing} className={alert ? "border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white" : undefined}>
              {refreshing ? <><LoaderCircle className="h-[15px] w-[15px] animate-spin" aria-hidden="true" /> {C.updating}</> : <><RefreshCw className="h-[15px] w-[15px]" aria-hidden="true" /> {C.updateButton}</>}
            </Button>
          </div>
        </div>
        <div className={cn("flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm", alert ? "bg-white/10" : "bg-neutral-100")}>
          <Clock className={cn("h-5 w-5", alert ? "text-dark-accent" : "text-primary-700")} aria-hidden="true" />
          <div>
            <span className={cn("block text-xs", alert ? "text-dark-muted" : "text-neutral-500")}>{C.irrigWindow}</span>
            <strong className={cn("font-semibold tabular-nums", alert ? "text-white" : "text-neutral-800")}>{C.irrigWindowTime}</strong>
          </div>
        </div>
      </header>

      <div className="grid gap-2 sm:grid-cols-3" aria-label="Resumen de tu campo">
        <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3.5">
          <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-700"><MapIcon className="h-5 w-5" /></span>
          <div><strong className="block text-lg font-semibold tabular-nums text-neutral-800">{fmtNum(plotCount)}</strong><span className="text-xs text-neutral-500">{C.parcelsRegistered(plotCount)}</span></div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3.5">
          <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-700"><Droplet className="h-5 w-5" /></span>
          <div><strong className="block text-lg font-semibold tabular-nums text-neutral-800">{fmtNum(urgentes)}</strong><span className="text-xs text-neutral-500">{C.needWaterToday(urgentes)}</span></div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3.5">
          <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-700"><Radio className="h-5 w-5" /></span>
          <div><strong className="block text-lg font-semibold tabular-nums text-neutral-800">{fmtNum(sensorsOk)} de {fmtNum(sensorsTotal)}</strong><span className="text-xs text-neutral-500">{C.sensorsOperative}</span></div>
        </div>
      </div>

      {latest.length === 0 ? (
        <Empty icon={<Gauge className="h-5 w-5" aria-hidden="true" />} title={C.noEvals} hint={C.noEvalsHint} action={<Button variant="outline" size="sm" asChild><Link to="/evaluar">{C.goToEvaluate}</Link></Button>} />
      ) : (
        <section aria-label="Últimas recomendaciones" className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <FilterTabs<Filter> label={C.filterLabel} value={filter} onChange={(v) => setFilter(v)} options={[
              { value: "todas", label: `Todas (${counts.todas})` },
              { value: "riega", label: `Piden riego (${counts.riega})` },
              { value: "no", label: `No riegan (${counts.no})` },
              { value: "espera", label: `Esperan (${counts.espera})` },
              { value: "incompleta", label: `Incompletas (${counts.incompleta})` },
            ]} />
            <SearchInput value={search} onChange={setSearch} placeholder={C.searchPlaceholder} label={C.searchLabel} className="min-w-[180px] flex-1" />
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger aria-label="Ordenar" className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="reciente">{C.sortRecent}</SelectItem>
                <SelectItem value="antiguo">{C.sortOldest}</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-neutral-500" aria-live="polite">{C.totalShown(filtered.length, latest.length)}</span>
          </div>

          {filtered.length === 0 ? (
            <Empty icon={<Search className="h-5 w-5" aria-hidden="true" />} title={C.noResults} hint={C.noResultsHint} />
          ) : (
            <div className="grid gap-3">
              {filtered.map((e) => {
                const snap = e.inputs_snapshot ?? {};
                const hum = typeof snap.humedad_pct === "number" ? snap.humedad_pct : null;
                const umb = typeof snap.umbral === "number" ? snap.umbral * 100 : null;
                const pmp = typeof snap.pmp === "number" ? snap.pmp * 100 : null;
                const tone = badgeToneForResult(e.result, e.is_critical);
                return (
                  <article key={e.id} data-tone={tone} className={cn("rounded-lg border border-l-4 p-4 shadow-card", cardBg(tone))} style={{ borderLeftColor: cardBarColor(tone) }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <strong className="block truncate text-[15px] font-semibold text-neutral-800">{e.plot?.name ?? `Parcela #${e.plot_id}`}</strong>
                        <span className="mt-1 flex items-center gap-1 text-xs text-neutral-500"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{fmtDateTime(e.evaluated_at)} · {ageLabel(e.evaluated_at)}</span>
                      </div>
                      <Badge variant={badgeVariantForTone(tone)}>{e.is_critical ? "Crítica" : resultLabel(e.result)}</Badge>
                    </div>
                    {e.result === "riega" && e.min_liters && e.max_liters ? (
                      <p className="mt-3 text-xl font-semibold tabular-nums text-neutral-800">{C.waterRange(Number(e.min_liters), Number(e.max_liters))} <span className="text-sm font-medium text-neutral-500">L</span></p>
                    ) : null}
                    <div className="mt-3"><SoilMeter actual={hum} umbral={umb} critico={pmp} /></div>
                    <Button variant="outline" size="sm" asChild className="mt-3 w-full">
                      <Link to="/evaluar" state={{ plotId: e.plot_id }}>{C.viewWhatToDo} <ArrowRight className="h-[15px] w-[15px]" aria-hidden="true" /></Link>
                    </Button>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
