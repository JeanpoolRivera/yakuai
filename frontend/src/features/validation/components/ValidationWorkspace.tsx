import { FlaskConical, Play, ShieldCheck, TriangleAlert } from "lucide-react";
import { useValidation } from "../hooks/useValidation";
import { PageHeading, Metric, StatusBadge, EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/workspace/WorkspaceKit";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";

export function ValidationWorkspace(): React.JSX.Element {
  const { report, loading, error, run } = useValidation();
  return <div className="space-y-6">
    <PageHeading eyebrow="Control del motor" title="Validación" description="Ejecuta los casos de referencia para comprobar que el motor responde a las condiciones esperadas." action={<Button onClick={() => void run()} disabled={loading}><Play size={16} aria-hidden="true" />{loading ? "Ejecutando…" : "Ejecutar validación"}</Button>} />
    <Card className="flex items-start gap-3 rounded-xl border-info-100 bg-info-50/50 p-4 sm:p-5"><FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-info-700" aria-hidden="true" /><div><h2 className="font-semibold text-neutral-900">Entorno de comprobación</h2><p className="mt-1 text-sm leading-relaxed text-neutral-700">La prueba usa entradas controladas y no modifica parcelas, mediciones ni evaluaciones guardadas.</p></div></Card>
    {error ? <ErrorBlock message={error} retry={() => void run()} /> : null}
    {loading ? <LoadingBlock label="Ejecutando los casos de validación…" /> : report ? <>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Resultado de validación"><Metric label="Casos superados" value={`${report.passed}/${report.total}`} detail="Pruebas del motor hídrico" icon={<ShieldCheck size={17} />} tone={report.passed === report.total ? "brand" : "warning"} /><Metric label="Con incidencias" value={report.total - report.passed} detail="Casos que requieren revisión" icon={<TriangleAlert size={17} />} tone={report.passed === report.total ? "default" : "danger"} /></section>
      <Card className="overflow-hidden rounded-xl"><div className="border-b border-neutral-200 p-4 sm:p-5"><h2 className="font-semibold text-neutral-900">Detalle de casos</h2><p className="mt-1 text-sm text-neutral-600">Compara el resultado esperado con el resultado del motor.</p></div><div className="divide-y divide-neutral-200">{report.cases.map((test, i) => <div key={`${test.caso}-${i}`} className="grid gap-2 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5"><div><h3 className="text-sm font-medium text-neutral-900">{test.caso}</h3><p className="mt-1 text-xs text-neutral-600">{test.detalle}</p><p className="mt-1 text-xs text-neutral-500">Esperado: {test.esperado} · Obtenido: {test.obtenido}</p></div><StatusBadge value={test.ok ? "ok" : "anomalo"} label={test.ok ? "Superado" : "Revisar"} /></div>)}</div></Card>
    </> : <EmptyBlock title="Aún no se ejecutó la validación" description="Ejecuta los casos para ver si el motor coincide con los resultados esperados." action={<Button onClick={() => void run()}><Play size={15} aria-hidden="true" />Ejecutar validación</Button>} />}
  </div>;
}

