/* Validación del motor: 10 casos demo con matriz de aciertos (solo técnico/admin). */
import { useRef, useState } from "react";
import { ArrowRight, FlaskConical, LoaderCircle, Search } from "lucide-react";
import { friendlyError } from "../api/client";
import { runValidation } from "../api/endpoints";
import type { ValidationReport } from "../api/types";
import { PageHead } from "../components/shadcn/page-head";
import { Badge } from "../components/shadcn/badge";
import { Banner, Empty, Loading } from "../components/shadcn/feedback";
import { Button } from "../components/shadcn/button";
import { Card, CardContent } from "../components/shadcn/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/shadcn/table";
import { FilterTabs } from "../components/shadcn/filter-tabs";
import { PaginationControls } from "../components/shadcn/PaginationControls";
import { SearchInput } from "../components/shadcn/search-input";
import { useCollection } from "../hooks/useCollection";
import { fmtNum, reasonLabel, resultLabel } from "../lib/format";
import { toastError } from "../lib/toast";

type Tab = "todos" | "ok" | "fallos";

/* El detalle llega como "motivo [rango]": se traduce el motivo a lenguaje claro. */
function detailLabel(detalle: string): string {
  const [code, ...rest] = detalle.split(" ");
  const mapped = reasonLabel(code);
  return mapped === code ? detalle : `${mapped}${rest.length > 0 ? ` ${rest.join(" ")}` : ""}`;
}

export function Validation(): React.JSX.Element {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("todos");

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

  const coll = useCollection(report?.cases ?? [], {
    perPage: 10,
    search: (c, q) => `${c.caso} ${c.detalle}`.toLowerCase().includes(q),
    filter: (c) => (tab === "todos" ? true : tab === "ok" ? c.ok : !c.ok),
  });

  const pct = report && report.total > 0 ? Math.round((report.passed / report.total) * 100) : 0;
  const passed = report !== null && report.passed === report.total;

  return (
    <div>
      <PageHead
        eyebrow="Calidad"
        title="Validación del motor"
        desc="Verifica la consistencia de las recomendaciones con un conjunto de casos de referencia."
        crumbs="YakuAI / Validación"
        actions={
          <Button onClick={() => void run()} disabled={loading}>
            {loading ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                {report ? "Ejecutar de nuevo" : "Ejecutar validación"}
              </>
            ) : (
              <>
                <FlaskConical className="h-4 w-4" aria-hidden="true" />
                {report ? "Ejecutar de nuevo" : "Ejecutar validación"}
              </>
            )}
          </Button>
        }
      />

      {loading && !report ? <Loading text="Corriendo los 10 casos…" /> : null}
      {loading && report ? <Banner kind="info">Revisando los 10 casos…</Banner> : null}
      {error ? <Banner kind="bad">{error}</Banner> : null}

      {!report && !loading && !error ? (
        <section aria-labelledby="validation-ready" className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-card lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div>
            <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-lg bg-primary-50 text-primary-700">
              <FlaskConical className="h-7 w-7" />
            </span>
            <p className="mt-3 text-2xs font-semibold uppercase tracking-wider text-primary-700">Control de calidad</p>
            <h2 id="validation-ready" className="mt-1 text-2xl font-semibold tracking-tight text-neutral-800">
              Comprueba el motor de riego
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Contrasta las decisiones del sistema con resultados esperados en un entorno de prueba.
            </p>
            <Button onClick={() => void run()} disabled={loading} className="mt-4">
              Ejecutar validación <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <dl className="grid content-start gap-3 text-sm">
            <div className="flex justify-between gap-3 border-b border-neutral-200 pb-2"><dt className="text-neutral-500">Casos de referencia</dt><dd className="font-medium text-neutral-800">10 escenarios fijos</dd></div>
            <div className="flex justify-between gap-3 border-b border-neutral-200 pb-2"><dt className="text-neutral-500">Condiciones de prueba</dt><dd className="font-medium text-neutral-800">Cultivo de papa · Suelo franco</dd></div>
            <div className="flex justify-between gap-3 border-b border-neutral-200 pb-2"><dt className="text-neutral-500">Decisiones evaluadas</dt><dd className="font-medium text-neutral-800">Riega, espera, no e incompleta</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-neutral-500">Alcance</dt><dd className="font-medium text-neutral-800">Tus datos reales no se modifican</dd></div>
          </dl>
        </section>
      ) : null}

      {report ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3" aria-label="Indicadores de validación">
            <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-card">
              <span className="block text-sm text-neutral-600">Casos evaluados</span>
              <strong className="mt-1 block text-2xl font-semibold tabular-nums text-neutral-800">{fmtNum(report.total)}</strong>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-card">
              <span className="block text-sm text-neutral-600">Resultados correctos</span>
              <strong className="mt-1 block text-2xl font-semibold tabular-nums text-neutral-800">{fmtNum(report.passed)}</strong>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-card">
              <span className="block text-sm text-neutral-600">Casos con fallos</span>
              <strong className="mt-1 block text-2xl font-semibold tabular-nums text-neutral-800">{fmtNum(report.total - report.passed)}</strong>
            </div>
          </div>

          <Card className="validation-summary mt-4" aria-label="Resultado global">
            <CardContent className="grid gap-3 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <span className="validation-score tabular-nums" aria-hidden="true">{pct}%</span>
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wider text-primary-700">Resultado</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-800">
                    {fmtNum(report.passed)}/{fmtNum(report.total)} correctos · {pct}%
                  </h2>
                </div>
                <Badge variant={passed ? "success" : "warning"}>
                  {passed ? "Aprobado" : "Con fallos"}
                </Badge>
              </div>
              <div
                className="h-2.5 overflow-hidden rounded-full bg-neutral-200"
                role="progressbar"
                aria-label="Progreso"
                aria-valuenow={report.passed}
                aria-valuemin={0}
                aria-valuemax={report.total}
              >
                <div
                  className={passed ? "h-full rounded-full bg-success-500" : "h-full rounded-full bg-warning-500"}
                  style={{ width: `${(report.passed / Math.max(1, report.total)) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <section aria-label="Casos" className="mt-4 grid gap-3">
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-primary-700">Detalle de la prueba</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-neutral-800">Resultados por escenario</h2>
              <p className="mt-1 text-sm text-neutral-600">Compara la respuesta esperada con la decisión del motor.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FilterTabs<Tab>
                label="Filtrar casos"
                value={tab}
                onChange={(v) => {
                  setTab(v);
                  coll.setPage(1);
                }}
                options={[
                  { value: "todos", label: "Todos" },
                  { value: "ok", label: "Correctos" },
                  { value: "fallos", label: "Fallos" },
                ]}
              />
              <SearchInput
                value={coll.query}
                onChange={coll.setQuery}
                placeholder="Buscar caso…"
                label="Buscar casos"
                className="min-w-[180px] flex-1"
              />
            </div>
            {coll.total === 0 ? (
              <Empty
                icon={<Search className="h-5 w-5" aria-hidden="true" />}
                title="Sin casos para mostrar"
                hint="Prueba con otro filtro o término de búsqueda."
              />
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
            <PaginationControls
                page={coll.page}
                pages={coll.pages}
                onPageChange={coll.setPage}
                count={`${coll.total} casos`}
              />
          </section>
        </>
      ) : null}
    </div>
  );
}
