import { useMemo, useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { MapPinned, Pencil, Plus, Sprout } from "lucide-react";
import { Link } from "react-router-dom";
import { listCrops, listFarmers, listPlots, listSoils, createPlot, updatePlot } from "@/api/endpoints";
import type { PlotInput } from "@/api/endpoints";
import type { Farmer, Plot } from "@/api/types";
import { ApiError, friendlyError } from "@/api/client";
import { toastOk } from "@/lib/toast";
import { PlotMap, type DrawResult, type PlotPoint } from "@/components/shadcn/plot-map";
import { PageHeading, Metric, StatusBadge, EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/workspace/WorkspaceKit";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { GuardedInput } from "@/components/forms/GuardedInput";
import { SearchInput } from "@/components/shadcn/search-input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/shadcn/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { fmtNum } from "@/lib/format";
import { ringAreaM2 } from "@/lib/geo";
import { isValidPlotName } from "@/lib/validation";
import type { Ring } from "@/lib/geo";

type FormValues = { farmer_id: string; name: string; latitude: string; longitude: string; boundary: number[][][] | null; area_m2: string; area_origin: "dibujo" | "manual"; crop_id: string; sowing_date: string; soil_texture_code: string; irrigation_system: "goteo" | "aspersion" | "gravedad"; irrigation_efficiency: string; flow_lpm: string; status: "activa" | "pausada" | "cerrada" };
const blank = (): FormValues => ({ farmer_id: "", name: "", latitude: "", longitude: "", boundary: null, area_m2: "", area_origin: "manual", crop_id: "", sowing_date: "", soil_texture_code: "", irrigation_system: "goteo", irrigation_efficiency: "0.9", flow_lpm: "", status: "activa" });
const STEP_LABELS = ["Parcela y ubicación", "Cultivo y suelo", "Riego y revisión"];
const EMPTY_PLOTS: Plot[] = [];
const EMPTY_FARMERS: Farmer[] = [];
const PLOT_API_FIELD_MAP: Record<string, { field: string; step: number }> = {
  name: { field: "name", step: 0 }, farmer_id: { field: "farmer_id", step: 0 }, boundary: { field: "boundary", step: 0 }, latitude: { field: "boundary", step: 0 }, longitude: { field: "boundary", step: 0 },
  crop_id: { field: "crop_id", step: 1 }, sowing_date: { field: "sowing_date", step: 1 }, soil_texture_code: { field: "soil_texture_code", step: 1 },
  area_m2: { field: "area_m2", step: 2 }, area_origin: { field: "area_origin", step: 2 }, irrigation_system: { field: "irrigation_system", step: 2 }, irrigation_efficiency: { field: "irrigation_efficiency", step: 2 }, flow_lpm: { field: "flow_lpm", step: 2 }, status: { field: "status", step: 2 },
};

const TODAY_ISO = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

export function PlotsWorkspace(): React.JSX.Element {
  const { data: referenceData, loading, error, execute: load } = useAsync(async () => {
    try {
      const [plots, farmers, crops, soils] = await Promise.all([listPlots(), listFarmers(), listCrops(), listSoils()]);
      return { plots, farmers, crops, soils };
    } catch (err) {
      throw new Error(friendlyError(err, "No se pudieron cargar las parcelas."));
    }
  });
  const plots = referenceData?.plots ?? EMPTY_PLOTS;
  const farmers = referenceData?.farmers ?? EMPTY_FARMERS;
  const crops = referenceData?.crops ?? [];
  const soils = referenceData?.soils ?? [];
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState<Plot | null>(null);
  const [form, setForm] = useState<FormValues>(blank);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [formErrorField, setFormErrorField] = useState<string | null>(null);

  const activeCount = plots.filter((p) => p.status === "activa").length;
  const visible = useMemo(() => plots.filter((plot) => {
    const farmer = farmers.find((f) => f.id === plot.farmer_id);
    const text = `${plot.name} ${farmer?.name ?? ""} ${plot.crop?.name ?? ""}`.toLocaleLowerCase("es");
    return text.includes(query.trim().toLocaleLowerCase("es")) && (statusFilter === "todas" || plot.status === statusFilter);
  }), [farmers, plots, query, statusFilter]);
  const mapPoints = useMemo<PlotPoint[]>(() => plots.map((plot) => ({ id: plot.id, name: plot.name, latitude: plot.latitude, longitude: plot.longitude, farmerName: farmers.find((farmer) => farmer.id === plot.farmer_id)?.name })), [farmers, plots]);
  const mapFocus = useMemo(() => {
    if (!form.latitude || !form.longitude) return null;
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }, [form.latitude, form.longitude]);
  const missingReferenceData = [
    ...(farmers.length ? [] : [{ label: "Registra al menos un agricultor", href: "/agricultores" }]),
    ...(crops.length ? [] : [{ label: "Solicita cargar cultivos al administrador", href: "/catalogos" }]),
    ...(soils.length ? [] : [{ label: "Solicita cargar tipos de suelo al administrador", href: "/catalogos" }]),
  ];

  function openCreate(): void { setEditing(null); setForm({ ...blank(), farmer_id: farmers[0] ? String(farmers[0].id) : "", crop_id: crops[0] ? String(crops[0].id) : "", soil_texture_code: soils[0]?.code ?? "" }); setStep(0); setFormError(""); setFormErrorField(null); setOpen(true); }
  function openEdit(plot: Plot): void { setEditing(plot); setFormError(""); setFormErrorField(null); setForm({ farmer_id: String(plot.farmer_id), name: plot.name, latitude: String(plot.latitude), longitude: String(plot.longitude), boundary: plot.boundary, area_m2: String(plot.area_m2), area_origin: plot.area_origin, crop_id: String(plot.crop_id), sowing_date: plot.sowing_date, soil_texture_code: plot.soil_texture_code, irrigation_system: plot.irrigation_system, irrigation_efficiency: String(plot.irrigation_efficiency), flow_lpm: plot.flow_lpm ? String(plot.flow_lpm) : "", status: plot.status }); setStep(0); setFormError(""); setOpen(true); }
  function change<K extends keyof FormValues>(key: K, value: FormValues[K]): void { setForm((prev) => ({ ...prev, [key]: value })); setFormError(""); setFormErrorField(null); }
  function onDraw(result: DrawResult): void {
    const hasValidBoundary = result.ring.length >= 3 && Number.isFinite(result.areaM2) && result.areaM2 > 0;
    setForm((prev) => ({
      ...prev,
      latitude: String(result.lat),
      longitude: String(result.lng),
      boundary: hasValidBoundary ? [result.ring] : null,
      area_m2: hasValidBoundary
        ? String(Math.round(result.areaM2 * 100) / 100)
        : prev.area_origin === "dibujo" ? "" : prev.area_m2,
      area_origin: hasValidBoundary ? "dibujo" : prev.area_origin === "dibujo" ? "manual" : prev.area_origin,
    }));
    setFormError("");
    setFormErrorField(null);
  }
  function changeAreaOrigin(value: FormValues["area_origin"]): void {
    if (value === "dibujo" && form.boundary?.[0]) {
      const area = ringAreaM2(form.boundary[0] as Ring);
      setForm((prev) => ({ ...prev, area_origin: "dibujo", area_m2: String(Math.round(area * 100) / 100) }));
      setFormError("");
      setFormErrorField(null);
      return;
    }
    change("area_origin", value);
  }
  function validateStep(): string | null {
    setFormErrorField(null);
    if (step === 0 && !isValidPlotName(form.name)) { setFormErrorField("name"); return "Usa un nombre de 2 a 120 caracteres."; }
    if (step === 0 && !form.farmer_id) { setFormErrorField("farmer_id"); return "Selecciona un agricultor."; }
    const coordsValid = Number.isFinite(Number(form.latitude)) && Number.isFinite(Number(form.longitude)) && Number(form.latitude) >= -90 && Number(form.latitude) <= 90 && Number(form.longitude) >= -180 && Number(form.longitude) <= 180 && /^[-]?\d+(?:\.\d{1,7})?$/.test(form.latitude) && /^[-]?\d+(?:\.\d{1,7})?$/.test(form.longitude);
    if (step === 0 && !coordsValid) { setFormErrorField("boundary"); return "Marca una ubicación válida en el mapa."; }
    if (step === 1 && !form.crop_id) { setFormErrorField("crop_id"); return "Selecciona un cultivo."; }
    if (step === 1 && !form.sowing_date) { setFormErrorField("sowing_date"); return "Escribe la fecha de siembra."; }
    if (step === 1 && !form.soil_texture_code) { setFormErrorField("soil_texture_code"); return "Selecciona un tipo de suelo."; }
    if (step === 1 && form.sowing_date > TODAY_ISO) { setFormErrorField("sowing_date"); return "La fecha no puede ser posterior a hoy."; }
    if (step === 2) {
      const area = Number(form.area_m2);
      const efficiency = Number(form.irrigation_efficiency);
      const flow = form.flow_lpm.trim() ? Number(form.flow_lpm) : null;
      if (!Number.isFinite(area) || area < 1 || area > 99999999.99 || !/^\d+(?:\.\d{1,2})?$/.test(form.area_m2)) { setFormErrorField("area_m2"); return "Área: 1–99 999 999,99 m²; máximo 2 decimales."; }
      if (!Number.isFinite(efficiency) || efficiency < 0.01 || efficiency > 1 || !/^\d+(?:\.\d{1,2})?$/.test(form.irrigation_efficiency)) { setFormErrorField("irrigation_efficiency"); return "Eficiencia: 0,01–1; máximo 2 decimales."; }
      if (flow !== null && (!Number.isFinite(flow) || flow < 0.1 || flow > 999999.99 || !/^\d+(?:\.\d{1,2})?$/.test(form.flow_lpm))) { setFormErrorField("flow_lpm"); return "Caudal: 0,1–999 999,99 L/min; máximo 2 decimales."; }
    }
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
    catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const entry = Object.entries(err.fields).find(([key, messages]) => PLOT_API_FIELD_MAP[key] && messages.length > 0);
        if (entry) {
          const [key, messages] = entry;
          const target = PLOT_API_FIELD_MAP[key];
          setStep(target.step);
          setFormErrorField(target.field);
          setFormError(messages[0] ?? "Revisa este campo.");
        } else {
          setFormError(friendlyError(err, "Revisa los datos de la parcela."));
        }
      } else {
        setFormError(friendlyError(err, "No se pudo guardar la parcela."));
      }
    }
    finally { setBusy(false); }
  }

  return <div className="space-y-6">
    <PageHeading eyebrow="Gestión del campo" title="Parcelas" description="Ubica cada parcela y conserva los datos necesarios para calcular sus recomendaciones." action={<Button onClick={openCreate} loading={loading} disabled={loading}><Plus size={16} aria-hidden="true" />Registrar parcela</Button>} />
    {error ? <ErrorBlock message={error} retry={() => void load()} /> : null}
    {!loading && !error && missingReferenceData.length ? <Card className="rounded-xl border-warning-200 bg-warning-50/60 p-4" role="status"><h2 className="font-semibold text-warning-900">Faltan datos para poder registrar parcelas</h2><p className="mt-1 text-sm text-warning-900/80">Los catálogos agronómicos son de solo lectura; el administrador debe cargar cultivos y suelos disponibles.</p><ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm">{missingReferenceData.map((item) => <li key={item.label}><Link className="font-medium text-primary-800 underline underline-offset-2" to={item.href}>{item.label}</Link></li>)}</ul></Card> : null}
    {loading ? <LoadingBlock label="Cargando parcelas…" /> : <>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Resumen de parcelas"><Metric label="Parcelas registradas" value={plots.length} detail="En todas las comunidades" icon={<MapPinned size={17} />} tone="brand" /><Metric label="Activas" value={activeCount} detail="Incluidas en seguimiento" /><Metric label="Agricultores" value={new Set(plots.map((p) => p.farmer_id)).size} detail="Con parcela registrada" /></section>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,.75fr)]">
        {!open ? <Card className="overflow-hidden rounded-xl"><div className="border-b border-neutral-200 p-4 sm:p-5"><h2 className="font-semibold text-neutral-900">Mapa del campo</h2><p className="mt-1 text-sm text-neutral-600">Selecciona un marcador para identificar la parcela.</p></div><PlotMap plots={mapPoints} mapClassName="h-[320px] sm:h-[400px]" /><div className="border-t border-neutral-200 px-4 py-3 text-xs text-neutral-500">Ubicaciones aproximadas. El contorno se define al crear o editar una parcela.</div></Card> : null}
        <Card className="space-y-4 rounded-xl p-4 sm:p-5"><div><h2 className="font-semibold text-neutral-900">Directorio de parcelas</h2><p className="mt-1 text-sm text-neutral-600">Busca por nombre, cultivo o agricultor.</p></div><SearchInput value={query} onChange={setQuery} placeholder="Buscar parcela…" label="Buscar parcelas" /><label className="grid gap-1 text-xs font-medium text-neutral-700">Estado<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="min-h-12 rounded-md border border-neutral-300 bg-white px-3 text-sm"><option value="todas">Todos los estados</option><option value="activa">Activas</option><option value="pausada">Pausadas</option><option value="cerrada">Cerradas</option></select></label><div className="border-t border-neutral-200 pt-3 text-xs text-neutral-500">{visible.length} de {plots.length} parcelas</div></Card>
      </div>
      {visible.length ? <Card className="overflow-hidden rounded-xl"><Table><caption className="sr-only">Parcelas, responsables, cultivo, área y estado</caption><TableHeader className="bg-neutral-50"><TableRow><TableHead>Parcela</TableHead><TableHead>Agricultor</TableHead><TableHead>Cultivo</TableHead><TableHead>Área</TableHead><TableHead>Riego</TableHead><TableHead>Estado</TableHead><TableHead><span className="sr-only">Acciones</span></TableHead></TableRow></TableHeader><TableBody>{visible.map((plot) => <TableRow key={plot.id}><TableCell><p className="font-semibold text-neutral-900">{plot.name}</p><p className="text-xs text-neutral-500">{Number(plot.latitude).toFixed(4)}, {Number(plot.longitude).toFixed(4)}</p></TableCell><TableCell>{farmers.find((f) => f.id === plot.farmer_id)?.name ?? "—"}</TableCell><TableCell>{plot.crop?.name ?? crops.find((c) => c.id === plot.crop_id)?.name ?? "—"}</TableCell><TableCell className="tabular-nums">{fmtNum(plot.area_m2)} m²</TableCell><TableCell className="capitalize">{plot.irrigation_system}</TableCell><TableCell><StatusBadge value={plot.status} label={plot.status === "activa" ? "Activa" : plot.status === "pausada" ? "Pausada" : "Cerrada"} /></TableCell><TableCell><Button variant="ghost" size="sm" aria-label={`Editar parcela ${plot.name}`} onClick={() => openEdit(plot)}><Pencil size={15} aria-hidden="true" />Editar</Button></TableCell></TableRow>)}</TableBody></Table></Card> : <EmptyBlock title={query || statusFilter !== "todas" ? "Sin coincidencias" : "Aún no hay parcelas"} description={query || statusFilter !== "todas" ? "Prueba con otro término o estado." : "Registra una parcela para comenzar el seguimiento."} action={!query && statusFilter === "todas" && farmers.length ? <Button onClick={openCreate}>Registrar parcela</Button> : undefined} />}
    </>}

    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>{editing ? "Editar parcela" : "Registrar parcela"}</DialogTitle><DialogDescription>{missingReferenceData.length ? "Antes de continuar, completa los datos requeridos." : "Completa los datos por secciones. El área puede calcularse desde el contorno del mapa."}</DialogDescription></DialogHeader>
      {missingReferenceData.length ? <div className="space-y-4"><Card className="rounded-lg border-warning-200 bg-warning-50/60 p-4" role="alert"><h3 className="font-semibold text-warning-900">Faltan datos de referencia</h3><p className="mt-1 text-sm text-warning-900/80">Para registrar parcelas hacen falta datos de referencia:</p><ul className="mt-3 space-y-2 text-sm">{missingReferenceData.map((item) => <li key={item.label}><Link className="font-semibold text-primary-800 underline underline-offset-2" to={item.href} onClick={() => setOpen(false)}>{item.label} →</Link></li>)}</ul></Card><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cerrar</Button></DialogFooter></div> : <>
      <div className="grid grid-cols-3 gap-2" aria-label={`Paso ${step + 1} de 3`}>{STEP_LABELS.map((label, index) => <div key={label} className={`rounded-md border px-2 py-2 text-center text-xs ${step === index ? "border-primary-600 bg-primary-50 font-semibold text-primary-800" : index < step ? "border-success-200 bg-success-50 text-success-800" : "border-neutral-200 text-neutral-500"}`}><span className="hidden sm:inline">{index + 1}. </span>{label}</div>)}</div>
      <form noValidate onSubmit={(e) => void submit(e)} className="space-y-4">
        {step === 0 ? <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Nombre de la parcela<GuardedInput autoFocus required minLength={2} guardMode="plot-name" value={form.name} maxLength={120} aria-invalid={formErrorField === "name"} aria-describedby={formErrorField === "name" ? "plot-name-error" : undefined} onValueChange={(value) => change("name", value)} placeholder="Parcela Norte" />{formErrorField === "name" ? <span id="plot-name-error" className="validation-message" role="alert">{formError}</span> : null}</label><label className="grid gap-1.5 text-sm font-medium">Agricultor<select required value={form.farmer_id} aria-invalid={formErrorField === "farmer_id"} aria-describedby={formErrorField === "farmer_id" ? "plot-farmer-error" : undefined} onChange={(e) => change("farmer_id", e.target.value)} className="min-h-12 rounded-md border border-neutral-300 bg-white px-3"><option value="" disabled>Selecciona responsable</option>{farmers.map((farmer) => <option key={farmer.id} value={farmer.id}>{farmer.name}</option>)}</select>{formErrorField === "farmer_id" ? <span id="plot-farmer-error" className="validation-message" role="alert">{formError}</span> : null}</label></div><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Latitud<Input type="number" required step="0.0000001" min="-90" max="90" aria-invalid={formErrorField === "boundary"} aria-describedby={formErrorField === "boundary" ? "plot-location-error" : undefined} value={form.latitude} readOnly placeholder="Se completa desde el mapa" onChange={(e) => change("latitude", e.target.value)} /></label><label className="grid gap-1.5 text-sm font-medium">Longitud<Input type="number" required step="0.0000001" min="-180" max="180" aria-invalid={formErrorField === "boundary"} aria-describedby={formErrorField === "boundary" ? "plot-location-error" : undefined} value={form.longitude} readOnly placeholder="Se completa desde el mapa" onChange={(e) => change("longitude", e.target.value)} /></label></div><p className="text-xs text-neutral-500">El mapa inicia centrado en Chupaca. Las coordenadas se completan al marcar un punto o dibujar un contorno.</p><div className="overflow-hidden rounded-lg border border-neutral-200"><PlotMap plots={mapPoints} editable focus={mapFocus} zoom={18} onDraw={onDraw} initialBasemap="satellite" mapClassName="h-[min(55vh,500px)] min-h-[340px] sm:h-[min(62vh,560px)]" />{formErrorField === "boundary" ? <p id="plot-location-error" className="validation-message px-3 pt-2" role="alert">{formError}</p> : null}<p className="border-t border-neutral-200 bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-600">Marca un punto o dibuja el contorno. Con tres o más esquinas válidas, el área y la ubicación se completan automáticamente; puedes confirmar el contorno antes de seguir.</p></div>{form.boundary?.length ? <p className="text-sm font-medium text-success-700">Contorno dibujado · área aproximada {fmtNum(form.area_m2)} m²</p> : null}</div> : null}
        {step === 1 ? <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Cultivo<select value={form.crop_id} aria-invalid={formErrorField === "crop_id"} aria-describedby={formErrorField === "crop_id" ? "plot-crop-error" : undefined} onChange={(e) => change("crop_id", e.target.value)} className="min-h-12 rounded-md border border-neutral-300 bg-white px-3">{crops.map((crop) => <option key={crop.id} value={crop.id}>{crop.name}</option>)}</select>{formErrorField === "crop_id" ? <span id="plot-crop-error" className="validation-message" role="alert">{formError}</span> : null}</label><label className="grid gap-1.5 text-sm font-medium">Fecha de siembra<Input type="date" required max={TODAY_ISO} value={form.sowing_date} aria-invalid={formErrorField === "sowing_date"} aria-describedby={formErrorField === "sowing_date" ? "plot-date-error" : undefined} onChange={(e) => change("sowing_date", e.target.value)} />{formErrorField === "sowing_date" ? <span id="plot-date-error" className="validation-message" role="alert">{formError}</span> : null}</label><label className="grid gap-1.5 text-sm font-medium sm:col-span-2">Tipo de suelo<select value={form.soil_texture_code} aria-invalid={formErrorField === "soil_texture_code"} aria-describedby={formErrorField === "soil_texture_code" ? "plot-soil-error" : undefined} onChange={(e) => change("soil_texture_code", e.target.value)} className="min-h-12 rounded-md border border-neutral-300 bg-white px-3">{soils.map((soil) => <option key={soil.code} value={soil.code}>{soil.name}</option>)}</select>{formErrorField === "soil_texture_code" ? <span id="plot-soil-error" className="validation-message" role="alert">{formError}</span> : null}</label></div> : null}
        {step === 2 ? <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Área (m²)<GuardedInput required guardMode="decimal" maxDecimals={2} value={form.area_m2} aria-invalid={formErrorField === "area_m2"} aria-describedby={formErrorField === "area_m2" ? "plot-area-error" : undefined} onValueChange={(value) => { setForm((prev) => ({ ...prev, area_m2: value, area_origin: "manual" })); setFormError(""); setFormErrorField(null); }} placeholder="100" />{formErrorField === "area_m2" ? <span id="plot-area-error" className="validation-message" role="alert">{formError}</span> : null}<span className="text-xs font-normal text-neutral-500">{form.area_origin === "dibujo" ? "Calculada desde el contorno" : "Área ingresada manualmente"}</span></label><label className="grid gap-1.5 text-sm font-medium">Origen del área<select aria-invalid={formErrorField === "area_origin"} aria-describedby={formErrorField === "area_origin" ? "plot-origin-error" : undefined} value={form.area_origin} onChange={(e) => changeAreaOrigin(e.target.value as FormValues["area_origin"])} className="min-h-12 rounded-md border border-neutral-300 bg-white px-3"><option value="manual">Manual</option><option value="dibujo" disabled={!form.boundary?.length}>Contorno del mapa</option></select>{formErrorField === "area_origin" ? <span id="plot-origin-error" className="validation-message" role="alert">{formError}</span> : null}</label><label className="grid gap-1.5 text-sm font-medium">Sistema de riego<select aria-invalid={formErrorField === "irrigation_system"} aria-describedby={formErrorField === "irrigation_system" ? "plot-irrigation-system-error" : undefined} value={form.irrigation_system} onChange={(e) => change("irrigation_system", e.target.value as FormValues["irrigation_system"])} className="min-h-12 rounded-md border border-neutral-300 bg-white px-3"><option value="goteo">Goteo</option><option value="aspersion">Aspersión</option><option value="gravedad">Gravedad</option></select>{formErrorField === "irrigation_system" ? <span id="plot-irrigation-system-error" className="validation-message" role="alert">{formError}</span> : null}</label><label className="grid gap-1.5 text-sm font-medium">Eficiencia (0 a 1)<GuardedInput required guardMode="decimal" maxDecimals={2} value={form.irrigation_efficiency} aria-invalid={formErrorField === "irrigation_efficiency"} aria-describedby={formErrorField === "irrigation_efficiency" ? "plot-efficiency-error" : undefined} onValueChange={(value) => change("irrigation_efficiency", value)} />{formErrorField === "irrigation_efficiency" ? <span id="plot-efficiency-error" className="validation-message" role="alert">{formError}</span> : null}<span className="text-xs font-normal text-neutral-500">Ejemplo: 0.90 equivale a 90%.</span></label><label className="grid gap-1.5 text-sm font-medium">Caudal (L/min, opcional)<GuardedInput guardMode="decimal" maxDecimals={2} value={form.flow_lpm} aria-invalid={formErrorField === "flow_lpm"} aria-describedby={formErrorField === "flow_lpm" ? "plot-flow-error" : undefined} onValueChange={(value) => change("flow_lpm", value)} placeholder="20" />{formErrorField === "flow_lpm" ? <span id="plot-flow-error" className="validation-message" role="alert">{formError}</span> : null}</label><label className="grid gap-1.5 text-sm font-medium">Estado<select aria-invalid={formErrorField === "status"} aria-describedby={formErrorField === "status" ? "plot-status-error" : undefined} value={form.status} onChange={(e) => change("status", e.target.value as FormValues["status"])} className="min-h-12 rounded-md border border-neutral-300 bg-white px-3"><option value="activa">Activa</option><option value="pausada">Pausada</option><option value="cerrada">Cerrada</option></select>{formErrorField === "status" ? <span id="plot-status-error" className="validation-message" role="alert">{formError}</span> : null}</label></div><Card className="rounded-lg bg-neutral-50 p-4"><div className="flex items-center gap-2"><Sprout size={17} className="text-primary-700" aria-hidden="true" /><p className="font-medium text-neutral-900">{form.name || "Nueva parcela"}</p></div><p className="mt-2 text-sm text-neutral-600">{farmers.find((f) => String(f.id) === form.farmer_id)?.name} · {crops.find((c) => String(c.id) === form.crop_id)?.name} · {form.area_m2 || "—"} m²</p></Card></div> : null}
        {formError && !formErrorField ? <p role="alert" className="validation-message">{formError}</p> : null}
        <DialogFooter className="flex-wrap sm:justify-between"><Button type="button" variant="outline" onClick={() => step > 0 ? setStep((v) => v - 1) : setOpen(false)}>{step > 0 ? "Volver" : "Cancelar"}</Button><Button type="submit" loading={busy}>{step < 2 ? "Continuar" : editing ? "Guardar cambios" : "Crear parcela"}</Button></DialogFooter>
      </form></>}
    </DialogContent></Dialog>
  </div>;
}




















