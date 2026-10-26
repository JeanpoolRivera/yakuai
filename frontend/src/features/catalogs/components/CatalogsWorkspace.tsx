import { useMemo, useState } from "react";
import { BookOpen, Sprout, Wheat } from "lucide-react";
import { useCatalogs } from "../hooks/useCatalogs";
import { CATALOGS_COPY as C } from "../copy";
import { PageHeading, Metric, StatusBadge, EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/workspace/WorkspaceKit";
import { Card } from "@/components/shadcn/card";
import { SearchInput } from "@/components/shadcn/search-input";
import { fmtNum } from "@/lib/format";

const STAGES: Record<string, string> = { ini: "Inicial", des: "Desarrollo", med: "Media", fin: "Final" };
export function CatalogsWorkspace(): React.JSX.Element {
  const { crops, soils, loading, error, load } = useCatalogs();
  const [query, setQuery] = useState("");
  const q = query.trim().toLocaleLowerCase("es");
  const filteredCrops = useMemo(() => crops.filter((crop) => `${crop.name} ${crop.scientific_name ?? ""} ${crop.code}`.toLocaleLowerCase("es").includes(q)), [crops, q]);
  const filteredSoils = useMemo(() => soils.filter((soil) => `${soil.name} ${soil.code}`.toLocaleLowerCase("es").includes(q)), [soils, q]);
  return <div className="space-y-6">
    <PageHeading eyebrow="Referencia técnica" title={C.title} description="Parámetros de cultivo y suelo usados por el motor para estimar la necesidad de agua." action={<StatusBadge value="demo" label={C.readOnly} />} />
    {error ? <ErrorBlock message={error} retry={() => void load()} /> : null}
    {loading ? <LoadingBlock label="Cargando referencia agronómica…" /> : <>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Catálogo agronómico"><Metric label="Cultivos" value={crops.length} detail="Con etapas de crecimiento" icon={<Sprout size={17} />} tone="brand" /><Metric label="Etapas" value={crops.reduce((sum, crop) => sum + (crop.stages?.length ?? 0), 0)} detail="Parámetros por cultivo" icon={<Wheat size={17} />} /><Metric label="Texturas de suelo" value={soils.length} detail="Capacidad de retención" icon={<BookOpen size={17} />} /></section>
      <Card className="space-y-4 rounded-xl p-4 sm:p-5"><div><h2 className="font-semibold text-neutral-900">{C.libraryTitle}</h2><p className="mt-1 text-sm text-neutral-600">{C.libraryDesc}. {C.libraryNote}</p></div><SearchInput value={query} onChange={setQuery} placeholder={C.search} label={C.searchLabel} /></Card>
      <section className="space-y-3" aria-labelledby="crop-title"><div><h2 id="crop-title" className="text-lg font-semibold text-neutral-900">{C.cropsTitle}</h2><p className="mt-1 text-sm text-neutral-600">{C.cropsDesc}</p></div>{filteredCrops.length ? <div className="grid gap-3 xl:grid-cols-2">{filteredCrops.map((crop) => <Card key={crop.id} className="overflow-hidden rounded-xl"><div className="flex items-start justify-between gap-3 border-b border-neutral-200 bg-neutral-50/70 p-4 sm:px-5"><div><h3 className="font-semibold text-neutral-900">{crop.name}</h3><p className="mt-1 text-xs italic text-neutral-600">{crop.scientific_name ?? crop.code}</p></div><StatusBadge value={crop.is_active ? "activa" : "inactivo"} label={`${crop.stages?.length ?? 0} etapas`} /></div><div className="divide-y divide-neutral-100">{(crop.stages ?? []).map((stage) => <div key={stage.id} className="grid grid-cols-[minmax(0,1fr)_repeat(3,minmax(3rem,.5fr))] items-center gap-2 px-4 py-3 text-sm sm:px-5"><div><p className="font-medium text-neutral-900">{STAGES[stage.stage] ?? stage.stage}</p><p className="text-xs text-neutral-500">{stage.days} días</p></div><div><p className="text-[10px] uppercase text-neutral-500">Kc</p><p className="font-semibold tabular-nums">{fmtNum(stage.kc)}</p></div><div><p className="text-[10px] uppercase text-neutral-500">Raíz</p><p className="font-semibold tabular-nums">{fmtNum(stage.root_depth_m)} m</p></div><div><p className="text-[10px] uppercase text-neutral-500">Agot.</p><p className="font-semibold tabular-nums">{fmtNum(Number(stage.depletion_fraction) * 100)}%</p></div></div>)}</div></Card>)}</div> : <EmptyBlock title="No hay cultivos coincidentes" description={query ? "Prueba con otro nombre o limpia la búsqueda." : C.noDataHint} />}</section>
      <section className="space-y-3" aria-labelledby="soils-title"><div><h2 id="soils-title" className="text-lg font-semibold text-neutral-900">{C.soilsTitle}</h2><p className="mt-1 text-sm text-neutral-600">{C.soilsDesc}</p></div>{filteredSoils.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{filteredSoils.map((soil) => { const cc = Number(soil.field_capacity); const pmp = Number(soil.wilting_point); return <Card key={soil.id} className="rounded-xl p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-neutral-900">{soil.name}</h3><p className="mt-1 text-xs text-neutral-500">Código: {soil.code.replaceAll("_", " ")}</p></div><span className="grid h-9 w-9 place-items-center rounded-lg bg-warning-50 text-warning-700"><BookOpen size={17} aria-hidden="true" /></span></div><div className="mt-5 grid grid-cols-3 gap-2 border-t border-neutral-200 pt-4 text-sm"><div><p className="text-xs text-neutral-500">CC</p><p className="mt-1 font-semibold tabular-nums">{fmtNum(cc * 100)}%</p></div><div><p className="text-xs text-neutral-500">PMP</p><p className="mt-1 font-semibold tabular-nums">{fmtNum(pmp * 100)}%</p></div><div><p className="text-xs text-neutral-500">Agua útil</p><p className="mt-1 font-semibold tabular-nums text-primary-700">{fmtNum((cc - pmp) * 100)}%</p></div></div></Card>; })}</div> : <EmptyBlock title="No hay suelos coincidentes" description={query ? "Prueba con otro nombre o limpia la búsqueda." : C.noDataHint} />}</section>
      <p className="text-xs leading-relaxed text-neutral-500">Los valores son de consulta y deben validarse en campo. No se editan desde esta pantalla.</p>
    </>}
  </div>;
}



