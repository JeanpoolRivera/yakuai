/* Hoy (agricultor): qué parcelas piden agua y últimas recomendaciones. */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, Droplet, Gauge, LoaderCircle, Map as MapIcon, Radio, RefreshCw, Search, Sprout } from "lucide-react";
import { friendlyError } from "../api/client";
import { listEvaluations, listPlots, listSensors } from "../api/endpoints";
import type { Evaluation } from "../api/types";
import { Badge, badgeVariantForTone } from "../components/shadcn/badge";
import { Banner, Empty, Loading } from "../components/shadcn/feedback";
import { Button } from "../components/shadcn/button";
import { FilterTabs } from "../components/shadcn/filter-tabs";
import { SearchInput } from "../components/shadcn/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/shadcn/select";
import { SoilMeter } from "../components/shadcn/soil-meter";
import { ageLabel, badgeToneForResult, fmtDateTime, fmtNum, resultLabel } from "../lib/format";
import { colors } from "../lib/theme";
import { cn } from "../lib/utils";

type Filter = "todas" | "riega" | "no" | "espera" | "incompleta";
type Sort = "reciente" | "antiguo";

function latestPerPlot(all: Evaluation[]): Evaluation[] {
  const seen = new Map<number, Evaluation>();
  const sorted = [...all].sort((a, b) => (a.evaluated_at < b.evaluated_at ? 1 : -1));
  for (const e of sorted) {
    if (!seen.has(e.plot_id)) seen.set(e.plot_id, e);
  }
  return [...seen.values()];
}

const CARD_BG: Record<string, string> = {
  critica: "border-danger-100 bg-danger-50",
  riega: "border-warning-100 bg-white",
  no: "border-success-100 bg-white",
  espera: "border-info-100 bg-white",
  incompleta: "border-neutral-200 bg-white",
};
const CARD_BAR: Record<string, string> = {
  critica: colors.danger[500],
  riega: colors.warning[500],
  no: colors.success[500],
  espera: colors.info[500],
  incompleta: colors.neutral[400],
};

export function Hoy(): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plotCount, setPlotCount] = useState(0);
  const [sensorsOk, setSensorsOk] = useState(0);
  const [sensorsTotal, setSensorsTotal] = useState(0);
  const [latest, setLatest] = useState<Evaluation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("todas");
  const [sort, setSort] = useState<Sort>("reciente");

  async function load(isRefresh = false): Promise<void> {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [plots, evals, sens] = await Promise.all([listPlots(), listEvaluations(), listSensors()]);
      setPlotCount(plots.length);
      setSensorsTotal(sens.length);
      setSensorsOk(sens.filter((s) => s.status === "ok" && s.is_active).length);
      setLatest(latestPerPlot(evals));
    } catch (err) {
      setError(friendlyError(err, "No se pudo cargar tu información."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    let out = [...latest];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter((e) => (e.plot?.name ?? "").toLowerCase().includes(q));
    }

    if (filter !== "todas") {
      out = out.filter((e) => e.result === filter);
    }

    out.sort((a, b) => {
      const diff = a.evaluated_at < b.evaluated_at ? 1 : -1;
      return sort === "reciente" ? diff : -diff;
    });

    return out;
  }, [latest, search, filter, sort]);

  if (loading) return <Loading text="Cargando tu campo…" />;
  if (error)
    return (
      <div className="grid gap-4">
        <Banner kind="bad">
          {error}{" "}
          <Button variant="link" size="sm" onClick={() => void load()}>
            Reintentar
          </Button>
        </Banner>
      </div>
    );

  if (plotCount === 0)
    return (
      <Empty
        icon={<Sprout className="h-5 w-5" aria-hidden="true" />}
        title="Aún no tienes parcelas"
        hint="Tu técnico registra tu parcela y tus sensores. Vuelve pronto."
      />
    );

  const urgentes = latest.filter((e) => e.result === "riega").length;
  const counts: Record<Filter, number> = {
    todas: latest.length,
    riega: latest.filter((e) => e.result === "riega").length,
    no: latest.filter((e) => e.result === "no").length,
    espera: latest.filter((e) => e.result === "espera").length,
    incompleta: latest.filter((e) => e.result === "incompleta").length,
  };
  const alert = urgentes > 0;

  return (
    <div className="grid gap-4">
      <header
        className={cn(
          "flex flex-wrap items-center gap-4 rounded-lg border p-4 sm:p-5",
          alert ? "border-primary-800 bg-primary-900 text-white" : "border-success-100 bg-white"
        )}
      >
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-2xs font-semibold uppercase tracking-wider",
              alert ? "text-dark-accent" : "text-primary-700"
            )}
          >
            Tu jornada
          </p>
          <h1 className={cn("mt-1 text-2xl font-semibold tracking-tight", alert ? "text-white" : "text-neutral-800")}>
            {urgentes > 0 ? `${urgentes} ${urgentes === 1 ? "parcela pide agua" : "parcelas piden agua"} hoy` : "Nada urgente por ahora"}
          </h1>
          <p className={cn("mt-1 text-sm", alert ? "text-dark-muted" : "text-neutral-600")}>
            {urgentes > 0
              ? "Riega en la ventana 05:30–07:00 para perder menos agua."
              : "Consulta las últimas evaluaciones y revisa de nuevo cuando el sistema lo indique."}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="lg" variant={alert ? "secondary" : "default"} asChild>
              <Link to="/evaluar">
                Evaluar riego <ArrowRight className="h-[17px] w-[17px]" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void load(true)}
              disabled={refreshing}
              className={alert ? "border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white" : undefined}
            >
              {refreshing ? (
                <>
                  <LoaderCircle className="h-[15px] w-[15px] animate-spin" aria-hidden="true" />
                  Actualizando…
                </>
              ) : (
                <>
                  <RefreshCw className="h-[15px] w-[15px]" aria-hidden="true" />
                  Actualizar
                </>
              )}
            </Button>
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm",
            alert ? "bg-white/10" : "bg-neutral-100"
          )}
        >
          <Clock className={cn("h-5 w-5", alert ? "text-dark-accent" : "text-primary-700")} aria-hidden="true" />
          <div>
            <span className={cn("block text-xs", alert ? "text-dark-muted" : "text-neutral-500")}>Ventana de riego</span>
            <strong className={cn("font-semibold tabular-nums", alert ? "text-white" : "text-neutral-800")}>
              05:30 – 07:00
            </strong>
          </div>
        </div>
      </header>

      <div className="grid gap-2 sm:grid-cols-3" aria-label="Resumen de tu campo">
        <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3.5">
          <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-700">
            <MapIcon className="h-5 w-5" />
          </span>
          <div>
            <strong className="block text-lg font-semibold tabular-nums text-neutral-800">{fmtNum(plotCount)}</strong>
            <span className="text-xs text-neutral-500">{plotCount === 1 ? "Parcela registrada" : "Parcelas registradas"}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3.5">
          <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-700">
            <Droplet className="h-5 w-5" />
          </span>
          <div>
            <strong className="block text-lg font-semibold tabular-nums text-neutral-800">{fmtNum(urgentes)}</strong>
            <span className="text-xs text-neutral-500">{urgentes === 1 ? "Pide agua hoy" : "Piden agua hoy"}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3.5">
          <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-700">
            <Radio className="h-5 w-5" />
          </span>
          <div>
            <strong className="block text-lg font-semibold tabular-nums text-neutral-800">
              {fmtNum(sensorsOk)} de {fmtNum(sensorsTotal)}
            </strong>
            <span className="text-xs text-neutral-500">Sensores operativos</span>
          </div>
        </div>
      </div>

      {latest.length === 0 ? (
        <Empty
          icon={<Gauge className="h-5 w-5" aria-hidden="true" />}
          title="Sin evaluaciones todavía"
          hint="Pulsa «Evaluar riego», elige tu parcela y obtén la recomendación."
          action={
            <Button variant="outline" size="sm" asChild>
              <Link to="/evaluar">Ir a evaluar</Link>
            </Button>
          }
        />
      ) : (
        <section aria-label="Últimas recomendaciones" className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <FilterTabs<Filter>
              label="Filtrar por estado"
              value={filter}
              onChange={(v) => setFilter(v)}
              options={[
                { value: "todas", label: `Todas (${counts.todas})` },
                { value: "riega", label: `Piden riego (${counts.riega})` },
                { value: "no", label: `No riegan (${counts.no})` },
                { value: "espera", label: `Esperan (${counts.espera})` },
                { value: "incompleta", label: `Incompletas (${counts.incompleta})` },
              ]}
            />
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar parcela…"
              label="Buscar parcela"
              className="min-w-[180px] flex-1"
            />
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger aria-label="Ordenar" className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reciente">Más reciente</SelectItem>
                <SelectItem value="antiguo">Más antiguo</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-neutral-500" aria-live="polite">
              {filtered.length} de {latest.length}
            </span>
          </div>

          {filtered.length === 0 ? (
            <Empty icon={<Search className="h-5 w-5" aria-hidden="true" />} title="Sin resultados" hint="Prueba con otra búsqueda o filtro." />
          ) : (
            <div className="grid gap-3">
              {filtered.map((e) => {
                const snap = e.inputs_snapshot ?? {};
                const hum = typeof snap.humedad_pct === "number" ? snap.humedad_pct : null;
                const umb = typeof snap.umbral === "number" ? snap.umbral * 100 : null;
                const pmp = typeof snap.pmp === "number" ? snap.pmp * 100 : null;
                const tone = badgeToneForResult(e.result, e.is_critical);
                return (
                  <article
                    key={e.id}
                    data-tone={tone}
                    className={cn("rounded-lg border border-l-4 p-4 shadow-card", CARD_BG[tone] ?? CARD_BG.incompleta)}
                    style={{ borderLeftColor: CARD_BAR[tone] ?? CARD_BAR.incompleta }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <strong className="block truncate text-[15px] font-semibold text-neutral-800">
                          {e.plot?.name ?? `Parcela #${e.plot_id}`}
                        </strong>
                        <span className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          {fmtDateTime(e.evaluated_at)} · {ageLabel(e.evaluated_at)}
                        </span>
                      </div>
                      <Badge variant={badgeVariantForTone(tone)}>
                        {e.is_critical ? "Crítica" : resultLabel(e.result)}
                      </Badge>
                    </div>
                    {e.result === "riega" && e.min_liters && e.max_liters ? (
                      <p className="mt-3 text-xl font-semibold tabular-nums text-neutral-800">
                        {fmtNum(e.min_liters)}–{fmtNum(e.max_liters)} <span className="text-sm font-medium text-neutral-500">L</span>
                      </p>
                    ) : null}
                    <div className="mt-3">
                      <SoilMeter actual={hum} umbral={umb} critico={pmp} />
                    </div>
                    <Button variant="outline" size="sm" asChild className="mt-3 w-full">
                      <Link to="/evaluar" state={{ plotId: e.plot_id }}>
                        Ver qué hacer <ArrowRight className="h-[15px] w-[15px]" aria-hidden="true" />
                      </Link>
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