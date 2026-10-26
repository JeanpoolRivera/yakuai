import { useEffect, useMemo, useState } from "react";
import { MapPinned, Pencil, Plus, Sprout } from "lucide-react";
import { Link } from "react-router-dom";
import { listCrops, listFarmers, listPlots, listSoils, createPlot, updatePlot } from "@/api/endpoints";
import type { PlotInput } from "@/api/endpoints";
import type { Crop, Farmer, Plot, SoilTexture } from "@/api/types";
import { friendlyError } from "@/api/client";
import { toastOk } from "@/lib/toast";
import { PlotMap, type DrawResult, type PlotPoint } from "@/components/shadcn/plot-map";
import { PageHeading, Metric, StatusBadge, EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/workspace/WorkspaceKit";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { SearchInput } from "@/components/shadcn/search-input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/shadcn/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { fmtNum } from "@/lib/format";

type FormValues = { farmer_id: string; name: string; latitude: string; longitude: string; boundary: number[][][] | null; area_m2: string; area_origin: "dibujo" | "manual"; crop_id: string; sowing_date: string; soil_texture_code: string; irrigation_system: "goteo" | "aspersion" | "gravedad"; irrigation_efficiency: string; flow_lpm: string; status: "activa" | "pausada" | "cerrada" };
const blank = (): FormValues => ({ farmer_id: "", name: "", latitude: "-12.0667", longitude: "-75.2833", boundary: null, area_m2: "", area_origin: "manual", crop_id: "", sowing_date: "", soil_texture_code: "", irrigation_system: "goteo", irrigation_efficiency: "0.9", flow_lpm: "", status: "activa" });
const STEP_LABELS = ["Parcela y ubicación", "Cultivo y suelo", "Riego y revisión"];

export function PlotsWorkspace(): React.JSX.Element {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [soils, setSoils] = useState<SoilTexture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState<Plot | null>(null);
  const [form, setForm] = useState<FormValues>(blank);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  async function load(): Promise<void> {
    setLoading(true); setError(null);
    try { const [p, f, c, s] = await Promise.all([listPlots(), listFarmers(), listCrops(), listSoils()]); setPlots(p); setFarmers(f); setCrops(c); setSoils(s); }
    catch (err) { setError(friendlyError(err, "No se pudieron cargar las parcelas.")); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  const activeCount = plots.filter((p) => p.status === "activa").length;
  const visible = useMemo(() => plots.filter((plot) => {
    const farmer = farmers.find((f) => f.id === plot.farmer_id);
    const text = `${plot.name} ${farmer?.name ?? ""} ${plot.crop?.name ?? ""}`.toLocaleLowerCase("es");
    return text.includes(query.trim().toLocaleLowerCase("es")) && (statusFilter === "todas" || plot.status === statusFilter);
  }), [farmers, plots, query, statusFilter]);
  const mapPoints = useMemo<PlotPoint[]>(() => plots.map((plot) => ({
    id: plot.id,
    name: plot.name,
    latitude: plot.latitude,
    longitude: plot.longitude,
    farmerName: farmers.find((farmer) => farmer.id === plot.farmer_id)?.name,
    boundary: plot.boundary,
  })), [farmers, plots]);
  const mapFocus = useMemo(() => ({ lat: Number(form.latitude), lng: Number(form.longitude) }), [form.latitude, form.longitude]);

  const missingReferenceData = !loading && !error ? [
    ...(farmers.length ? [] : [{
      label: "Registra al menos un agricultor",
      href: "/agricultores",
    }]),
    ...(crops.length ? [] : [{
      label: "Solicita cargar cultivos al administrador",
      href: "/catalogos",
    }]),
    ...(soils.length ? [] : [{
      label: "Solicita cargar tipos de suelo al administrador",
      href: "/catalogos",
    }]),
  ] : [];

  function openCreate(): void { setEditing(null); setForm({ ...blank(), farmer_id: farmers[0] ? String(farmers[0].id) : "", crop_id: crops[0] ? String(crops[0].id) : "", soil_texture_code: soils[0]?.code ?? "" }); setStep(0); setFormError(""); setOpen(true); }
  function openEdit(plot: Plot): void { setEditing(plot); setForm({ farmer_id: String(plot.farmer_id), name: plot.name, latitude: String(plot.latitude), longitude: String(plot.longitude), boundary: plot.boundary, area_m2: String(plot.area_m2), area_origin: plot.area_origin, crop_id: String(plot.crop_id), sowing_date: plot.sowing_date, soil_texture_code: plot.soil_texture_code, irrigation_system: plot.irrigation_system, irrigation_efficiency: String(plot.irrigation_efficiency), flow_lpm: plot.flow_lpm ? String(plot.flow_lpm) : "", status: plot.status }); setStep(0); setFormError(""); setOpen(true); }
  function change<K extends keyof FormValues>(key: K, value: FormValues[K]): void { setForm((prev) => ({ ...prev, [key]: value })); setFormError(""); }
  function onDraw(result: DrawResult): void {
    // Fijar/mover el punto no borra el contorno ni el área que ya se dibujaron.
    if (result.ring.length < 3) {
      setForm((prev) => ({
        ...prev,
        latitude: String(result.lat),
        longitude: String(result.lng),
      }));
      return;
    }

    // El punto fijo se conserva como ubicación principal; el anillo guarda las
    // esquinas reales del lindero y el área se calcula a partir de ese polígono.
    setForm((prev) => ({
      ...prev,
      latitude: String(result.lat),
      longitude: String(result.lng),
      boundary: [result.ring],
      area_m2: String(Math.round(result.areaM2 * 100) / 100),
      area_origin: "dibujo",
    }));
  }
  function validateStep(): string | null {
    if (step === 0 && (!form.name.trim() || !form.farmer_id || !form.latitude || !form.longitude)) return "Completa el nombre, agricultor y ubicación.";
    if (step === 1 && (!form.crop_id || !form.sowing_date || !form.soil_texture_code)) return "Selecciona cultivo, fecha de siembra y tipo de suelo.";
    if (step === 2 && (!form.area_m2 || Number(form.area_m2) < 1 || !form.irrigation_efficiency || Number(form.irrigation_efficiency) <= 0 || Number(form.irrigation_efficiency) > 1)) return "Revisa el área y la eficiencia del riego (de 0 a 1).";
    return null;
  }
  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setFormError("");
    const issue = validateStep();
    if (issue) { setFormError(issue); return; }
    if (step < 2) { setStep((v) => v + 1); return; }
    const payload: PlotInput = { farmer_id: Number(form.farmer_id), name: form.name.trim(), latitude: Number(form.latitude), longitude: Number(form.longitude), boundary: form.boundary, area_m2: Number(form.area_m2), area_origin: form.area_origin, crop_id: Number(form.crop_id), sowing_date: form.sowing_date, soil_texture_code: form.soil_texture_code, irrigation_system: form.irrigation_system, irrigation_efficiency: Number(form.irrigation_efficiency), flow_lpm: form.flow_lpm ? Number(form.flow_lpm) : null, status: form.status };
    setBusy(true);
    try { if (editing) { await updatePlot(editing.id, payload); toastOk("Parcela actualizada."); } else { await createPlot(payload); toastOk("Parcela registrada."); } setOpen(false); await load(); }
    catch (err) { setFormError(friendlyError(err, "No se pudo guardar la parcela.")); }
    finally { setBusy(false); }
  }

  return <div className="space-y-6">
    <PageHeading eyebrow="Gestión del campo" title="Parcelas" description="Ubica cada parcela y conserva los datos necesarios para calcular sus recomendaciones." action={<Button onClick={openCreate} loading={loading} disabled={loading}><Plus size={16} aria-hidden="true" />Registrar parcela</Button>} />
    {error ? <ErrorBlock message={error} retry={() => void load()} /> : null}
    {!loading && !error && missingReferenceData.length ? <Card className="rounded-xl border-warning-200 bg-warning-50/60 p-4" role="status"><h2 className="font-semibold text-warning-900">Faltan datos para poder registrar parcelas</h2><p className="mt-1 text-sm text-warning-900/80">Los catálogos agronómicos son de solo lectura; el administrador debe cargar cultivos y suelos disponibles.</p><ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm">{missingReferenceData.map((item) => <li key={item.label}><Link className="font-medium text-primary-800 underline underline-offset-2" to={item.href}>{item.label}</Link></li>)}</ul></Card> : null}
    {loading ? <LoadingBlock label="Cargando parcelas…" /> : <>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Resumen de parcelas"><Metric label="Parcelas registradas" value={plots.length} detail="En todas las comunidades" icon={<MapPinned size={17} />} tone="brand" /><Metric label="Activas" value={activeCount} detail="Incluidas en seguimiento" /><Metric label="Agricultores" value={new Set(plots.map((p) => p.farmer_id)).size} detail="Con parcela registrada" /></section>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,.75fr)]">
        <Card className="overflow-hidden rounded-xl"><div className="border-b border-neutral-200 p-4 sm:p-5"><h2 className="font-semibold text-neutral-900">Mapa del campo</h2><p className="mt-1 text-sm text-neutral-600">Los bordes dibujados y el punto fijo de cada parcela se muestran aquí.</p></div><PlotMap plots={mapPoints} mapHeightClassName="h-[320px] sm:h-[400px]" /><div className="border-t border-neutral-200 px-4 py-3 text-xs text-neutral-500">Las áreas sombreadas representan bordes guardados; registra o edita una parcela para dibujar sus esquinas.</div></Card>
        <Card className="space-y-4 rounded-xl p-4 sm:p-5"><div><h2 className="font-semibold text-neutral-900">Directorio de parcelas</h2><p className="mt-1 text-sm text-neutral-600">Busca por nombre, cultivo o agricultor.</p></div><SearchInput value={query} onChange={setQuery} placeholder="Buscar parcela…" label="Buscar parcelas" /><label className="grid gap-1 text-xs font-medium text-neutral-700">Estado<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="min-h-12 rounded-md border border-neutral-300 bg-white px-3 text-sm"><option value="todas">Todos los estados</option><option value="activa">Activas</option><option value="pausada">Pausadas</option><option value="cerrada">Cerradas</option></select></label><div className="border-t border-neutral-200 pt-3 text-xs text-neutral-500">{visible.length} de {plots.length} parcelas</div></Card>
      </div>
      {visible.length ? <Card className="overflow-hidden rounded-xl"><Table><caption className="sr-only">Parcelas, responsables, cultivo, área y estado</caption><TableHeader className="bg-neutral-50"><TableRow><TableHead>Parcela</TableHead><TableHead>Agricultor</TableHead><TableHead>Cultivo</TableHead><TableHead>Área</TableHead><TableHead>Riego</TableHead><TableHead>Estado</TableHead><TableHead><span className="sr-only">Acciones</span></TableHead></TableRow></TableHeader><TableBody>{visible.map((plot) => <TableRow key={plot.id}><TableCell><p className="font-semibold text-neutral-900">{plot.name}</p><p className="text-xs text-neutral-500">{Number(plot.latitude).toFixed(4)}, {Number(plot.longitude).toFixed(4)}</p></TableCell><TableCell>{farmers.find((f) => f.id === plot.farmer_id)?.name ?? "—"}</TableCell><TableCell>{plot.crop?.name ?? crops.find((c) => c.id === plot.crop_id)?.name ?? "—"}</TableCell><TableCell className="tabular-nums">{fmtNum(plot.area_m2)} m²</TableCell><TableCell className="capitalize">{plot.irrigation_system}</TableCell><TableCell><StatusBadge value={plot.status} label={plot.status === "activa" ? "Activa" : plot.status === "pausada" ? "Pausada" : "Cerrada"} /></TableCell><TableCell><Button variant="ghost" size="sm" aria-label={`Editar parcela ${plot.name}`} onClick={() => openEdit(plot)}><Pencil size={15} aria-hidden="true" />Editar</Button></TableCell></TableRow>)}</TableBody></Table></Card> : <EmptyBlock title={query || statusFilter !== "todas" ? "Sin coincidencias" : "Aún no hay parcelas"} description={query || statusFilter !== "todas" ? "Prueba con otro término o estado." : "Registra una parcela para comenzar el seguimiento."} action={!query && statusFilter === "todas" && farmers.length ? <Button onClick={openCreate}>Registrar parcela</Button> : undefined} />}
    </>}

    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>{editing ? "Editar parcela" : "Registrar parcela"}</DialogTitle><DialogDescription>{missingReferenceData.length ? "Antes de continuar, completa los datos requeridos." : "Completa los datos por secciones. El área puede calcularse desde el contorno del mapa."}</DialogDescription></DialogHeader>
      {missingReferenceData.length ? <div className="space-y-4"><Card className="rounded-lg border-warning-200 bg-warning-50/60 p-4" role="alert"><h3 className="font-semibold text-warning-900">Faltan datos de referencia</h3><p className="mt-1 text-sm text-warning-900/80">Para registrar parcelas hacen falta datos de referencia:</p><ul className="mt-3 space-y-2 text-sm">{missingReferenceData.map((item) => <li key={item.label}><Link className="font-semibold text-primary-800 underline underline-offset-2" to={item.href} onClick={() => setOpen(false)}>{item.label} →</Link></li>)}</ul></Card><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cerrar</Button></DialogFooter></div> : <>
      <div className="grid grid-cols-3 gap-2" aria-label={`Paso ${step + 1} de 3`}>{STEP_LABELS.map((label, index) => <div key={label} className={`rounded-md border px-2 py-2 text-center text-xs ${step === index ? "border-primary-600 bg-primary-50 font-semibold text-primary-800" : index < step ? "border-success-200 bg-success-50 text-success-800" : "border-neutral-200 text-neutral-500"}`}><span className="hidden sm:inline">{index + 1}. </span>{label}</div>)}</div>
      <form onSubmit={(e) => void submit(e)} className="space-y-4">
        {step === 0 ? <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Nombre de la parcela<Input autoFocus required value={form.name} maxLength={120} onChange={(e) => change("name", e.target.value)} placeholder="Parcela Norte" /></label><label className="grid gap-1.5 text-sm font-medium">Agricultor<select required value={form.farmer_id} onChange={(e) => change("farmer_id", e.target.value)} className="min-h-12 rounded-md border border-neutral-300 bg-white px-3"><option value="" disabled>Selecciona responsable</option>{farmers.map((farmer) => <option key={farmer.id} value={farmer.id}>{farmer.name}</option>)}</select></label></div><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Latitud<Input type="number" required step="any" min="-90" max="90" value={form.latitude} onChange={(e) => change("latitude", e.target.value)} /></label><label className="grid gap-1.5 text-sm font-medium">Longitud<Input type="number" required step="any" min="-180" max="180" value={form.longitude} onChange={(e) => change("longitude", e.target.value)} /></label></div><div className="overflow-hidden rounded-lg border border-neutral-200"><PlotMap plots={mapPoints} editable focus={mapFocus} zoom={18} onDraw={onDraw} onClearBoundary={() => setForm((prev) => prev.boundary?.length ? { ...prev, boundary: null, area_m2: "", area_origin: "manual" } : prev)} mapHeightClassName="h-[320px]" /><p className="border-t border-neutral-200 bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-600">Usa “Ubicar punto” para elegir la ubicación, o “Dibujar contorno” para calcular el área de la parcela.</p></div>{form.boundary?.length ? <p className="text-sm font-medium text-success-700">Contorno dibujado · área aproximada {fmtNum(form.area_m2)} m²</p> : null}</div> : null}
        {step === 1 ? <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Cultivo<select value={form.crop_id} onChange={(e) => change("crop_id", e.target.value)} className="min-h-12 rounded-md border border-neutral-300 bg-white px-3">{crops.map((crop) => <option key={crop.id} value={crop.id}>{crop.name}</option>)}</select></label><label className="grid gap-1.5 text-sm font-medium">Fecha de siembra<Input type="date" required max={new Date().toISOString().slice(0, 10)} value={form.sowing_date} onChange={(e) => change("sowing_date", e.target.value)} /></label><label className="grid gap-1.5 text-sm font-medium sm:col-span-2">Tipo de suelo<select value={form.soil_texture_code} onChange={(e) => change("soil_texture_code", e.target.value)} className="min-h-12 rounded-md border border-neutral-300 bg-white px-3">{soils.map((soil) => <option key={soil.code} value={soil.code}>{soil.name}</option>)}</select></label></div> : null}
        {step === 2 ? <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Área (m²)<Input type="number" required min="1" step="any" value={form.area_m2} onChange={(e) => { change("area_m2", e.target.value); if (form.area_origin === "dibujo") change("area_origin", "manual"); }} placeholder="100" /><span className="text-xs font-normal text-neutral-500">{form.area_origin === "dibujo" ? "Calculada desde el contorno" : "Área ingresada manualmente"}</span></label><label className="grid gap-1.5 text-sm font-medium">Origen del área<select value={form.area_origin} onChange={(e) => change("area_origin", e.target.value as FormValues["area_origin"])} className="min-h-12 rounded-md border border-neutral-300 bg-white px-3"><option value="manual">Manual</option><option value="dibujo" disabled={!form.boundary?.length}>Contorno del mapa</option></select></label><label className="grid gap-1.5 text-sm font-medium">Sistema de riego<select value={form.irrigation_system} onChange={(e) => change("irrigation_system", e.target.value as FormValues["irrigation_system"])} className="min-h-12 rounded-md border border-neutral-300 bg-white px-3"><option value="goteo">Goteo</option><option value="aspersion">Aspersión</option><option value="gravedad">Gravedad</option></select></label><label className="grid gap-1.5 text-sm font-medium">Eficiencia (0 a 1)<Input type="number" required min="0.01" max="1" step="0.01" value={form.irrigation_efficiency} onChange={(e) => change("irrigation_efficiency", e.target.value)} /><span className="text-xs font-normal text-neutral-500">Ejemplo: 0.90 equivale a 90%.</span></label><label className="grid gap-1.5 text-sm font-medium">Caudal (L/min, opcional)<Input type="number" min="0.1" step="any" value={form.flow_lpm} onChange={(e) => change("flow_lpm", e.target.value)} placeholder="20" /></label><label className="grid gap-1.5 text-sm font-medium">Estado<select value={form.status} onChange={(e) => change("status", e.target.value as FormValues["status"])} className="min-h-12 rounded-md border border-neutral-300 bg-white px-3"><option value="activa">Activa</option><option value="pausada">Pausada</option><option value="cerrada">Cerrada</option></select></label></div><Card className="rounded-lg bg-neutral-50 p-4"><div className="flex items-center gap-2"><Sprout size={17} className="text-primary-700" aria-hidden="true" /><p className="font-medium text-neutral-900">{form.name || "Nueva parcela"}</p></div><p className="mt-2 text-sm text-neutral-600">{farmers.find((f) => String(f.id) === form.farmer_id)?.name} · {crops.find((c) => String(c.id) === form.crop_id)?.name} · {form.area_m2 || "—"} m²</p></Card></div> : null}
        {formError ? <p role="alert" className="rounded-md bg-danger-50 p-3 text-sm text-danger-700">{formError}</p> : null}
        <DialogFooter className="flex-wrap sm:justify-between"><Button type="button" variant="outline" onClick={() => step > 0 ? setStep((v) => v - 1) : setOpen(false)}>{step > 0 ? "Volver" : "Cancelar"}</Button><Button type="submit" loading={busy}>{step < 2 ? "Continuar" : editing ? "Guardar cambios" : "Crear parcela"}</Button></DialogFooter>
      </form></>}
    </DialogContent></Dialog>
  </div>;
}
