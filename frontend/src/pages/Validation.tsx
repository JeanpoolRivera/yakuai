/* Validación del motor: 10 casos demo con matriz de aciertos (solo técnico/admin). */
import { useRef, useState } from "react";
import { friendlyError } from "../api/client";
import { runValidation } from "../api/endpoints";
import type { ValidationReport } from "../api/types";
import {
  Badge,
  Banner,
  Button,
  Card,
  Empty,
  Loading,
  Icon,
  PageHead,
  Pager,
  SearchInput,
  Tabs,
} from "../components/ui";
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

  return (
    <div className="page manage-page">
      <PageHead
        eyebrow="Calidad"
        title="Validación del motor"
        desc="Verifica la consistencia de las recomendaciones con un conjunto de casos de referencia."
        crumbs="YakuAI / Validación"
        actions={
          <Button onClick={() => void run()} loading={loading}>
            <Icon name="flask" /> {report ? "Ejecutar de nuevo" : "Ejecutar validación"}
          </Button>
        }
      />

      {loading && !report ? <Loading text="Corriendo los 10 casos…" /> : null}
      {loading && report ? <Banner kind="info">Revisando los 10 casos…</Banner> : null}
      {error ? <Banner kind="bad">{error}</Banner> : null}

      {!report && !loading && !error ? (
        <section className="manage-validation-intro" aria-labelledby="validation-ready">
          <div className="manage-validation-copy"><span className="manage-icon"><Icon name="flask" size={28} /></span><p className="eyebrow">Control de calidad</p><h2 id="validation-ready">Comprueba el motor de riego</h2><p>Contrasta las decisiones del sistema con resultados esperados en un entorno de prueba.</p><Button onClick={() => void run()} loading={loading}>Ejecutar validación <Icon name="arrow" /></Button></div>
          <dl className="manage-validation-scope"><div><dt>Casos de referencia</dt><dd>10 escenarios fijos</dd></div><div><dt>Condiciones de prueba</dt><dd>Cultivo de papa · Suelo franco</dd></div><div><dt>Decisiones evaluadas</dt><dd>Riega, espera, no e incompleta</dd></div><div><dt>Alcance</dt><dd>Tus datos reales no se modifican</dd></div></dl>
        </section>
      ) : null}

      {report ? (
        <>
          <div className="manage-overview" aria-label="Indicadores de validación">
            <div><span>Casos evaluados</span><strong>{fmtNum(report.total)}</strong></div>
            <div><span>Resultados correctos</span><strong>{fmtNum(report.passed)}</strong></div>
            <div><span>Casos con fallos</span><strong>{fmtNum(report.total - report.passed)}</strong></div>
          </div>
          <Card label="Resultado global">
            <div className="spread">
              <div>
                <p className="eyebrow">Resultado</p>
                <h2 className="card-title">
                  {fmtNum(report.passed)}/{fmtNum(report.total)} correctos · {pct}%
                </h2>
              </div>
              <Badge tone={report.passed === report.total ? "ok" : "mala"}>
                {report.passed === report.total ? "Aprobado" : "Con fallos"}
              </Badge>
            </div>
            <div className="progress" role="progressbar" aria-label="Progreso" aria-valuenow={report.passed} aria-valuemin={0} aria-valuemax={report.total}>
              <div className="progress-fill" style={{ width: `${(report.passed / Math.max(1, report.total)) * 100}%` }} />
            </div>
          </Card>

          <section className="manage-panel" aria-label="Casos">
            <div className="manage-section-head"><div><p className="eyebrow">Detalle de la prueba</p><h2>Resultados por escenario</h2><p>Compara la respuesta esperada con la decisión del motor.</p></div></div>
            <div className="toolbar manage-toolbar">
              <Tabs<Tab>
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
              />
            </div>
            {coll.total === 0 ? <Empty icon="search" title="Sin casos para mostrar" hint="Prueba con otro filtro o término de búsqueda." /> : (
            <div className="table-wrap">
              <table className="tbl">
                <caption className="sr-only">Resultados de los 10 casos de validación</caption>
                <thead>
                  <tr>
                    <th scope="col">Caso</th>
                    <th scope="col">Esperado</th>
                    <th scope="col">Obtenido</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {coll.items.map((c, i) => (
                    <tr key={`${c.caso}-${i}`}>
                      <td>{c.caso}</td>
                      <td className="muted">{resultLabel(c.esperado)}</td>
                      <td className="muted">{resultLabel(c.obtenido)}</td>
                      <td>
                        <Badge tone={c.ok ? "ok" : "mala"}>{c.ok ? "Correcto" : "Fallo"}</Badge>
                      </td>
                      <td className="muted small">{detailLabel(c.detalle)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
            <Pager
              page={coll.page}
              pages={coll.pages}
              onPage={coll.setPage}
              count={`${coll.total} casos`}
            />
          </section>
        </>
      ) : null}
    </div>
  );
}
