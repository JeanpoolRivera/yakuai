import { useState } from "react";
import { PageHead } from "@/components/shadcn/page-head";
import { Badge } from "@/components/shadcn/badge";
import { Banner, Empty, Loading } from "@/components/shadcn/feedback";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { FilterTabs } from "@/components/shadcn/filter-tabs";
import { PaginationControls } from "@/components/shadcn/PaginationControls";
import { SearchInput } from "@/components/shadcn/search-input";
import { fmtNum } from "@/lib/format";
import { useCollection } from "@/hooks/useCollection";
import { useValidation } from "../hooks/useValidation";
import { VALIDATION_COPY as C } from "../copy";
import { detailLabel, resultLabel, pctPassed, isAllPassed, filterCases } from "../utils";

type Tab = "todos" | "ok" | "fallos";

export function ValidationWorkspace(): React.JSX.Element {
  const { report, loading, error, run } = useValidation();
  const [tab, setTab] = useState<Tab>("todos");
  const [query, setQuery] = useState("");

  const filteredCases = report ? filterCases(report.cases, tab, query) : [];
  const coll = useCollection(filteredCases, { perPage: 10 });

  const pct = pctPassed(report);
  const passed = isAllPassed(report);

  return (
    <div>
      <PageHead eyebrow={C.eyebrow} title={C.title} desc={C.description} crumbs={C.crumbs} actions={
        <Button onClick={() => void run()} disabled={loading}>
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
              {C.runAgain}
            </>
          ) : (
            <>
              <span className="h-4 w-4" aria-hidden="true">🧪</span>
              {report ? C.runAgain : C.runButton}
            </>
          )}
        </Button>
      } />

      {loading && !report ? <Loading text={C.loading} /> : null}
      {loading && report ? <Banner kind="info">{C.running}</Banner> : null}
      {error ? <Banner kind="bad">{error}</Banner> : null}

      {!report && !loading && !error ? (
        <section aria-labelledby="validation-ready" className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-card lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div>
            <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-lg bg-primary-50 text-primary-700">
              <span className="text-2xl">🧪</span>
            </span>
            <p className="mt-3 text-2xs font-semibold uppercase tracking-wider text-primary-700">Control de calidad</p>
            <h2 id="validation-ready" className="mt-1 text-2xl font-semibold tracking-tight text-neutral-800">{C.readyTitle}</h2>
            <p className="mt-1 text-sm text-neutral-600">{C.readyDesc}</p>
            <Button onClick={() => void run()} disabled={loading} className="mt-4">
              {C.runNow} <span className="h-4 w-4" aria-hidden="true">→</span>
            </Button>
          </div>
          <dl className="grid content-start gap-3 text-sm">
            {C.readyInfo.map((info) => (
              <div key={info.label} className="flex justify-between gap-3 border-b border-neutral-200 pb-2">
                <dt className="text-neutral-500">{info.label}</dt>
                <dd className="font-medium text-neutral-800">{info.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {report ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3" aria-label="Indicadores de validación">
            <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-card">
              <span className="block text-sm text-neutral-600">{C.stats.total}</span>
              <strong className="mt-1 block text-2xl font-semibold tabular-nums text-neutral-800">{fmtNum(report.total)}</strong>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-card">
              <span className="block text-sm text-neutral-600">{C.stats.passed}</span>
              <strong className="mt-1 block text-2xl font-semibold tabular-nums text-neutral-800">{fmtNum(report.passed)}</strong>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-card">
              <span className="block text-sm text-neutral-600">{C.stats.failed}</span>
              <strong className="mt-1 block text-2xl font-semibold tabular-nums text-neutral-800">{fmtNum(report.total - report.passed)}</strong>
            </div>
          </div>

          <Card className="validation-summary mt-4" aria-label="Resultado global">
            <CardContent className="grid gap-3 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <span className="validation-score tabular-nums" aria-hidden="true">{pct}%</span>
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wider text-primary-700">{C.resultLabel}</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-800">
                    {fmtNum(report.passed)}/{fmtNum(report.total)} correctos · {pct}%
                  </h2>
                </div>
                <Badge variant={passed ? "success" : "warning"}>{passed ? C.approved : C.failedLabel}</Badge>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-neutral-200" role="progressbar" aria-label={C.progressLabel} aria-valuenow={report.passed} aria-valuemin={0} aria-valuemax={report.total}>
                <div className={passed ? "h-full rounded-full bg-success-500" : "h-full rounded-full bg-warning-500"} style={{ width: `${(report.passed / Math.max(1, report.total)) * 100}%` }} />
              </div>
            </CardContent>
          </Card>

          <section aria-label="Casos" className="mt-4 grid gap-3">
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-primary-700">Detalle de la prueba</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-neutral-800">{C.casesTitle}</h2>
              <p className="mt-1 text-sm text-neutral-600">{C.casesDesc}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FilterTabs<Tab>
                label="Filtrar casos"
                value={tab}
                onChange={(v) => { setTab(v); coll.setPage(1); }}
                options={[
                  { value: "todos", label: C.filters.todos },
                  { value: "ok", label: C.filters.ok },
                  { value: "fallos", label: C.filters.fallos },
                ]}
              />
              <SearchInput value={query} onChange={setQuery} placeholder={C.search} label={C.searchLabel} className="min-w-[180px] flex-1" />
            </div>
            {coll.total === 0 ? (
              <Empty icon={<span className="h-5 w-5" />} title={C.noCases} hint={C.noCasesHint} />
            ) : (
              <Table>
                <caption className="sr-only">Resultados de los 10 casos de validación</caption>
                <TableHeader>
                  <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                    <TableHead>Caso</TableHead>
                    <TableHead>Esperado</TableHead>
                    <TableHead>Obtenido</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coll.items.map((c, i) => (
                    <TableRow key={`${c.caso}-${i}`}>
                      <TableCell className="font-medium">{c.caso}</TableCell>
                      <TableCell className="text-neutral-500">{resultLabel(c.esperado)}</TableCell>
                      <TableCell className="text-neutral-500">{resultLabel(c.obtenido)}</TableCell>
                      <TableCell>
                        <Badge variant={c.ok ? "success" : "destructive"}>{c.ok ? "Correcto" : "Fallo"}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-neutral-500">{detailLabel(c.detalle)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <PaginationControls page={coll.page} pages={coll.pages} onPageChange={coll.setPage} count={C.pageLabel(coll.total)} />
          </section>
        </>
      ) : null}
    </div>
  );
}
