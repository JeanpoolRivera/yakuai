import { useMemo, useState } from "react";
import { Activity, CloudRain, Droplets, Plus, Radio, Thermometer } from "lucide-react";
import { useSensors } from "../hooks/useSensors";
import { TIPOS, rangeMessage, stateLabel } from "../utils";
import { SENSORS_COPY as C } from "../copy";
import { createMeasurement, createSensor, simulateSensor } from "@/api/endpoints";
import type { Sensor, SensorType } from "@/api/types";
import { ApiError, friendlyError } from "@/api/client";
import { toastError, toastOk } from "@/lib/toast";
import { PageHeading, Metric, StatusBadge, EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/workspace/WorkspaceKit";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { GuardedInput } from "@/components/forms/GuardedInput";
import { SearchInput } from "@/components/shadcn/search-input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/shadcn/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { fmtDateTime, fmtNum, nowLocalInput } from "@/lib/format";

type Mode = "new-sensor" | "reading" | "detail" | null;
const TYPE_LABEL: Record<string, string> = Object.fromEntries(TIPOS.map((item) => [item.value, item.label]));
function sensorIcon(type: string): React.JSX.Element { const Icon = type === "humedad" || type === "caudal" ? Droplets : type === "lluvia" ? CloudRain : type === "aire_temp" ? Thermometer : Radio; return <Icon size={17} aria-hidden="true" />; }
function readingUnit(type: string): string { return type === "humedad" || type === "aire_hr" ? "%" : type === "aire_temp" ? "°C" : type === "caudal" ? "L/min" : ""; }
function sensorReading(sensor: Sensor): string { const value = sensor.latest_measurement?.norm_value ?? sensor.latest_measurement?.raw_value; return value === null || value === undefined ? "—" : `${fmtNum(value)}${readingUnit(sensor.type) ? ` ${readingUnit(sensor.type)}` : ""}`; }
function applyApiFieldError(error: unknown, fallback: string, setMessage: (value: string) => void, setField: (value: string | null) => void): void {
  if (error instanceof ApiError && error.status === 422) {
    const allowed = new Set(["plot_id", "type", "model", "pin", "dry_ref", "wet_ref", "sensor_id", "raw_value", "measured_at"]);
    const entry = Object.entries(error.fields).find(([key, messages]) => allowed.has(key) && messages.length > 0);
    if (entry) {
      setField(entry[0]);
      setMessage(entry[1][0] ?? "Revisa este campo.");
      return;
    }
    setField(null);
    setMessage(friendlyError(error, "Revisa los datos ingresados."));
    return;
  }
  setField(null);
  setMessage(friendlyError(error, fallback));
}

export function SensorsWorkspace(): React.JSX.Element {
  const { sensors, plots, loading, error, load } = useSensors();
  const [mode, setMode] = useState<Mode>(null);
  const [selected, setSelected] = useState<Sensor | null>(null);
  const [query, setQuery] = useState("");
  const [plotFilter, setPlotFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [formErrorField, setFormErrorField] = useState<string | null>(null);
  const [plotId, setPlotId] = useState("");
  const [type, setType] = useState<SensorType>("humedad");
  const [model, setModel] = useState("YL-69");
  const [pin, setPin] = useState("");
  const [dryRef, setDryRef] = useState("1020");
  const [wetRef, setWetRef] = useState("320");
  const [readingSensorId, setReadingSensorId] = useState("");
  const [rawValue, setRawValue] = useState("");
  const [measuredAt, setMeasuredAt] = useState("");

  const active = sensors.filter((s) => s.is_active);
  const readingSensor = sensors.find((item) => item.id === Number(readingSensorId));
  const okCount = active.filter((s) => s.status === "ok").length;
  const filtered = useMemo(() => sensors.filter((sensor) => {
    const plot = plots.find((p) => p.id === sensor.plot_id);
    const text = `${sensor.type} ${sensor.model} ${plot?.name ?? ""} ${sensor.id}`.toLocaleLowerCase("es");
    const statusMatch = statusFilter === "todos" || (statusFilter === "ok" ? sensor.status === "ok" && sensor.is_active : sensor.status !== "ok" && sensor.is_active);
    return text.includes(query.trim().toLocaleLowerCase("es")) && (!plotFilter || sensor.plot_id === Number(plotFilter)) && statusMatch;
  }), [plots, plotFilter, query, sensors, statusFilter]);

  function resetSensorForm(): void { setPlotId(plots[0] ? String(plots[0].id) : ""); setType("humedad"); setModel("YL-69"); setPin(""); setDryRef("1020"); setWetRef("320"); setFormError(""); setFormErrorField(null); }
  function openReading(sensor?: Sensor): void { setReadingSensorId(sensor ? String(sensor.id) : active[0] ? String(active[0].id) : ""); setRawValue(""); setMeasuredAt(""); setFormError(""); setFormErrorField(null); setMode("reading"); }

  async function saveSensor(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setFormError(""); setFormErrorField(null);
    if (!plotId) { setFormError("Selecciona una parcela."); setFormErrorField("plot_id"); return; }
    if (!model.trim() || model.trim().length > 60) { setFormError("Modelo: máximo 60 caracteres."); setFormErrorField("model"); return; }
    if (pin.trim().length > 10) { setFormError("Pin: máximo 10 caracteres."); setFormErrorField("pin"); return; }
    if (type === "humedad" && (!dryRef.trim() || !Number.isInteger(Number(dryRef)) || Number(dryRef) < 0 || Number(dryRef) > 1023)) { setFormError("Usa un entero de 0 a 1023."); setFormErrorField("dry_ref"); return; }
    if (type === "humedad" && (!wetRef.trim() || !Number.isInteger(Number(wetRef)) || Number(wetRef) < 0 || Number(wetRef) > 1023)) { setFormError("Usa un entero de 0 a 1023."); setFormErrorField("wet_ref"); return; }
    if (type === "humedad" && Number(dryRef) === Number(wetRef)) { setFormError("Las referencias deben ser distintas."); setFormErrorField("wet_ref"); return; }
    setBusy(true);
    try {
      await createSensor({ plot_id: Number(plotId), type, model, pin: pin || null, dry_ref: type === "humedad" ? Number(dryRef) : null, wet_ref: type === "humedad" ? Number(wetRef) : null, is_active: true });
      toastOk(C.sensorRegistered); setMode(null); await load();
    } catch (err) { applyApiFieldError(err, C.sensorError, setFormError, setFormErrorField); }
    finally { setBusy(false); }
  }
  async function saveReading(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setFormError(""); setFormErrorField(null);
    const sensor = sensors.find((item) => item.id === Number(readingSensorId));
    if (!sensor) { setFormError("Selecciona un sensor válido."); setFormErrorField("sensor_id"); return; }
    if (!rawValue.trim()) { setFormError("Escribe una lectura."); setFormErrorField("raw_value"); return; }
    if (measuredAt && (!Number.isFinite(new Date(measuredAt).getTime()) || new Date(measuredAt).getTime() > Date.now())) { setFormError("Usa una fecha válida que no sea futura."); setFormErrorField("measured_at"); return; }
    const validation = rangeMessage(sensor.type, Number(rawValue));
    if (validation) { setFormError(validation); setFormErrorField("raw_value"); return; }
    setBusy(true);
    try {
      await createMeasurement({ sensor_id: sensor.id, measured_at: measuredAt ? new Date(measuredAt).toISOString().slice(0, 19) : new Date().toISOString().slice(0, 19), raw_value: Number(rawValue), origin: "manual" });
      toastOk(C.readingSaved); setMode(null); await load();
    } catch (err) { applyApiFieldError(err, C.readingError, setFormError, setFormErrorField); }
    finally { setBusy(false); }
  }
  async function simulate(sensor: Sensor): Promise<void> {
    setBusy(true);
    try { await simulateSensor(sensor.id); toastOk(`Dato simulado en sensor #${sensor.id}.`); await load(); }
    catch (err) { toastError(friendlyError(err, C.simError)); }
    finally { setBusy(false); }
  }
  function close(): void { setMode(null); setFormError(""); setFormErrorField(null); }

  return <div className="space-y-6">
    <PageHeading eyebrow="Monitoreo" title={C.title} description={C.intro} action={<><Button variant="outline" onClick={() => openReading()} disabled={!active.length}><Activity size={16} aria-hidden="true" />{C.newReading}</Button><Button onClick={() => { resetSensorForm(); setMode("new-sensor"); }} disabled={!plots.length}><Plus size={16} aria-hidden="true" />{C.registerSensor}</Button></>} />
    {error ? <ErrorBlock message={error} retry={() => void load()} /> : null}
    {loading ? <LoadingBlock label={C.loading} /> : <>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Estado de sensores"><Metric label="Dispositivos activos" value={active.length} detail="Asignados a parcelas" icon={<Radio size={17} />} tone="brand" /><Metric label="Operativos" value={okCount} detail="Estado reportado por el dispositivo" icon={<Activity size={17} />} /><Metric label="Por revisar" value={active.length - okCount} detail="Anomalía o sin datos" icon={<CloudRain size={17} />} tone={active.length > okCount ? "warning" : "default"} /></section>
      <Card className="space-y-4 rounded-xl p-4 sm:p-5"><div><h2 className="font-semibold text-neutral-900">{C.deviceTable}</h2><p className="mt-1 text-sm text-neutral-600">{C.deviceTableDesc}</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_12rem_12rem]"><div className="self-end"><SearchInput value={query} onChange={setQuery} placeholder={C.searchPlaceholder} label={C.searchLabel} /></div><label className="grid gap-1 text-xs font-medium text-neutral-700">{C.parcelFilter}<select value={plotFilter} onChange={(e) => setPlotFilter(e.target.value)} className="min-h-12 rounded-md border border-neutral-300 bg-white px-3 text-sm"><option value="">Todas las parcelas</option>{plots.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="grid gap-1 text-xs font-medium text-neutral-700">Estado<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="min-h-12 rounded-md border border-neutral-300 bg-white px-3 text-sm"><option value="todos">Todos los sensores</option><option value="ok">Operativos</option><option value="rev">Por revisar</option></select></label></div><p className="border-t border-neutral-200 pt-3 text-xs text-neutral-500">{filtered.length} dispositivos</p></Card>
      {filtered.length ? <>
        <Card className="hidden overflow-hidden rounded-xl md:block"><Table><caption className="sr-only">Dispositivos, parcelas, estado y lectura más reciente</caption><TableHeader className="bg-neutral-50"><TableRow><TableHead>Dispositivo</TableHead><TableHead>Parcela</TableHead><TableHead>Estado</TableHead><TableHead>Medición reciente</TableHead><TableHead><span className="sr-only">Acciones</span></TableHead></TableRow></TableHeader><TableBody>{filtered.map((sensor) => <TableRow key={sensor.id}><TableCell><div className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-50 text-primary-700">{sensorIcon(sensor.type)}</span><div><p className="font-medium text-neutral-900">{TYPE_LABEL[sensor.type]}</p><p className="text-xs text-neutral-500">{sensor.model} · #{sensor.id}</p></div></div></TableCell><TableCell>{plots.find((p) => p.id === sensor.plot_id)?.name ?? `Parcela #${sensor.plot_id}`}</TableCell><TableCell><StatusBadge value={sensor.is_active ? sensor.status : "inactivo"} label={stateLabel(sensor)} /></TableCell><TableCell><p className="font-medium tabular-nums text-neutral-900">{sensorReading(sensor)}</p><p className="text-xs text-neutral-500">{sensor.latest_measurement ? fmtDateTime(sensor.latest_measurement.measured_at) : C.pendingReading}</p></TableCell><TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={() => openReading(sensor)} disabled={!sensor.is_active}>Lectura</Button>{sensor.type === "humedad" && sensor.dry_ref !== null && sensor.wet_ref !== null ? <Button variant="ghost" size="sm" onClick={() => void simulate(sensor)} disabled={busy}>Simular</Button> : null}<Button variant="outline" size="sm" onClick={() => { setSelected(sensor); setMode("detail"); }}>Detalle</Button></div></TableCell></TableRow>)}</TableBody></Table></Card>
        <div className="grid gap-3 md:hidden">{filtered.map((sensor) => <Card key={sensor.id} className="rounded-xl p-4"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-50 text-primary-700">{sensorIcon(sensor.type)}</span><div><h3 className="font-semibold text-neutral-900">{TYPE_LABEL[sensor.type]}</h3><p className="text-xs text-neutral-500">{sensor.model} · #{sensor.id}</p></div></div><StatusBadge value={sensor.is_active ? sensor.status : "inactivo"} label={stateLabel(sensor)} /></div><div className="mt-4 rounded-lg bg-neutral-50 p-3"><p className="text-xs text-neutral-500">Parcela · {plots.find((p) => p.id === sensor.plot_id)?.name ?? `#${sensor.plot_id}`}</p><p className="mt-1 text-lg font-semibold tabular-nums">{sensorReading(sensor)}</p><p className="text-xs text-neutral-500">{sensor.latest_measurement ? fmtDateTime(sensor.latest_measurement.measured_at) : C.pendingReading}</p></div><div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => openReading(sensor)} disabled={!sensor.is_active}>Registrar lectura</Button>{sensor.type === "humedad" && sensor.dry_ref !== null && sensor.wet_ref !== null ? <Button variant="outline" size="sm" onClick={() => void simulate(sensor)} disabled={busy}>Simular dato</Button> : null}<Button variant="ghost" size="sm" onClick={() => { setSelected(sensor); setMode("detail"); }}>Ver detalle</Button></div></Card>)}</div>
      </> : <EmptyBlock title={query || plotFilter || statusFilter !== "todos" ? C.noMatch : C.noDevices} description={query || plotFilter || statusFilter !== "todos" ? C.noMatchHint : C.noDevicesHint} action={plots.length ? <Button onClick={() => { resetSensorForm(); setMode("new-sensor"); }}>{C.registerSensor}</Button> : undefined} />}
      <p className="text-xs leading-relaxed text-neutral-500">{C.footnote}</p>
    </>}
    <Dialog open={mode !== null} onOpenChange={(open) => { if (!open) close(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      {mode === "new-sensor" ? <><DialogHeader><DialogTitle>{C.registerTitle}</DialogTitle><DialogDescription>{C.registerDesc}</DialogDescription></DialogHeader><form noValidate className="space-y-4" onSubmit={(e) => void saveSensor(e)}>
        <label className="grid gap-1.5 text-sm font-medium">Parcela<select required aria-invalid={formErrorField === "plot_id"} aria-describedby={formErrorField === "plot_id" ? "sensor-plot-error" : undefined} value={plotId} onChange={(e) => { setPlotId(e.target.value); setFormError(""); setFormErrorField(null); }} className="min-h-12 rounded-md border border-neutral-300 bg-white px-3"><option value="" disabled>Selecciona una parcela</option>{plots.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>{formErrorField === "plot_id" ? <span id="sensor-plot-error" className="validation-message" role="alert">{formError}</span> : null}</label>
        <label className="grid gap-1.5 text-sm font-medium">Tipo de sensor<select aria-invalid={formErrorField === "type"} aria-describedby={formErrorField === "type" ? "sensor-type-error" : undefined} value={type} onChange={(e) => { const t = e.target.value as SensorType; setType(t); setModel(TIPOS.find((x) => x.value === t)?.model ?? ""); setFormError(""); setFormErrorField(null); }} className="min-h-12 rounded-md border border-neutral-300 bg-white px-3">{TIPOS.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select>{formErrorField === "type" ? <span id="sensor-type-error" className="validation-message" role="alert">{formError}</span> : null}</label>
        <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Modelo<GuardedInput value={model} onValueChange={(value) => { setModel(value); setFormError(""); setFormErrorField(null); }} guardMode="text" required maxLength={60} aria-invalid={formErrorField === "model"} aria-describedby={formErrorField === "model" ? "sensor-model-error" : undefined} />{formErrorField === "model" ? <span id="sensor-model-error" className="validation-message" role="alert">{formError}</span> : null}</label><label className="grid gap-1.5 text-sm font-medium">Pin de conexión<GuardedInput value={pin} onValueChange={(value) => { setPin(value); setFormError(""); setFormErrorField(null); }} guardMode="text" maxLength={10} placeholder="A0" aria-invalid={formErrorField === "pin"} aria-describedby={formErrorField === "pin" ? "sensor-pin-error" : undefined} />{formErrorField === "pin" ? <span id="sensor-pin-error" className="validation-message" role="alert">{formError}</span> : null}</label></div>
        {type === "humedad" ? <fieldset className="grid gap-3 rounded-lg border border-neutral-200 p-3"><legend className="px-1 text-sm font-semibold">Calibración en dos puntos</legend><p className="text-xs text-neutral-600">Usa la lectura cruda en seco y con el suelo mojado. Los valores deben ser distintos.</p><div className="grid grid-cols-2 gap-3"><label className="grid gap-1 text-xs font-medium">Seco ref (0–1023)<GuardedInput guardMode="digits" required maxLength={4} value={dryRef} onValueChange={(value) => { setDryRef(value); setFormError(""); setFormErrorField(null); }} aria-invalid={formErrorField === "dry_ref"} aria-describedby={formErrorField === "dry_ref" ? "sensor-dry-error" : undefined} />{formErrorField === "dry_ref" ? <span id="sensor-dry-error" className="validation-message" role="alert">{formError}</span> : null}</label><label className="grid gap-1 text-xs font-medium">Mojado ref (0–1023)<GuardedInput guardMode="digits" required maxLength={4} value={wetRef} onValueChange={(value) => { setWetRef(value); setFormError(""); setFormErrorField(null); }} aria-invalid={formErrorField === "wet_ref"} aria-describedby={formErrorField === "wet_ref" ? "sensor-wet-error" : undefined} />{formErrorField === "wet_ref" ? <span id="sensor-wet-error" className="validation-message" role="alert">{formError}</span> : null}</label></div></fieldset> : null}
        {formError && !formErrorField ? <p className="validation-message" role="alert">{formError}</p> : null}<DialogFooter><Button type="button" variant="outline" onClick={close}>Cancelar</Button><Button type="submit" loading={busy}>Registrar sensor</Button></DialogFooter>
      </form></> : null}
      {mode === "reading" ? <><DialogHeader><DialogTitle>{C.newReadingTitle}</DialogTitle><DialogDescription>{C.newReadingDesc} La evaluación de riego solo utiliza humedad de suelo.</DialogDescription></DialogHeader><form noValidate className="space-y-4" onSubmit={(e) => void saveReading(e)}>
        <label className="grid gap-1.5 text-sm font-medium">Sensor<select required aria-invalid={formErrorField === "sensor_id"} aria-describedby={formErrorField === "sensor_id" ? "reading-sensor-error" : undefined} value={readingSensorId} onChange={(e) => { setReadingSensorId(e.target.value); setFormError(""); setFormErrorField(null); }} className="min-h-12 rounded-md border border-neutral-300 bg-white px-3">{active.map((sensor) => <option value={sensor.id} key={sensor.id}>{TYPE_LABEL[sensor.type]} · {plots.find((p) => p.id === sensor.plot_id)?.name} · #{sensor.id}</option>)}</select>{formErrorField === "sensor_id" ? <span id="reading-sensor-error" className="validation-message" role="alert">{formError}</span> : null}</label>
        {sensors.find((s) => s.id === Number(readingSensorId))?.type === "humedad" ? <p className="text-xs text-neutral-600">YL-69: valor crudo entre 0 y 1023; se convertirá a humedad usando la calibración guardada.</p> : null}
        <label className="grid gap-1.5 text-sm font-medium">Valor crudo<GuardedInput required guardMode={readingSensor?.type === "humedad" || readingSensor?.type === "lluvia" ? "digits" : "decimal"} allowNegative={readingSensor?.type === "aire_temp"} maxDecimals={2} value={rawValue} onValueChange={(value) => { setRawValue(value); setFormError(""); setFormErrorField(null); }} aria-invalid={formErrorField === "raw_value"} aria-describedby={formErrorField === "raw_value" ? "reading-value-error" : undefined} />{formErrorField === "raw_value" ? <span id="reading-value-error" className="validation-message" role="alert">{formError}</span> : null}</label>
        <label className="grid gap-1.5 text-sm font-medium">Fecha y hora (opcional)<Input type="datetime-local" max={nowLocalInput()} value={measuredAt} aria-invalid={formErrorField === "measured_at"} aria-describedby={formErrorField === "measured_at" ? "reading-date-error" : undefined} onChange={(e) => { setMeasuredAt(e.target.value); setFormError(""); setFormErrorField(null); }} />{formErrorField === "measured_at" ? <span id="reading-date-error" className="validation-message" role="alert">{formError}</span> : null}<span className="text-xs font-normal text-neutral-500">Si se deja vacío, se usa el momento actual.</span></label>
        <DialogFooter><Button type="button" variant="outline" onClick={close}>Cancelar</Button><Button type="submit" loading={busy}>Guardar lectura</Button></DialogFooter>
      </form></> : null}
      {mode === "detail" && selected ? <><DialogHeader><DialogTitle>Sensor #{selected.id}</DialogTitle><DialogDescription>{TYPE_LABEL[selected.type]} · {selected.model} · {plots.find((p) => p.id === selected.plot_id)?.name}</DialogDescription></DialogHeader><div className="grid grid-cols-2 gap-3 rounded-lg bg-neutral-50 p-4 text-sm"><div><p className="text-xs text-neutral-500">Estado</p><div className="mt-1"><StatusBadge value={selected.is_active ? selected.status : "inactivo"} label={stateLabel(selected)} /></div></div><div><p className="text-xs text-neutral-500">Última lectura</p><p className="mt-1 font-medium">{sensorReading(selected)}</p></div>{selected.type === "humedad" ? <><div><p className="text-xs text-neutral-500">Referencia seco</p><p className="mt-1">{selected.dry_ref ?? "—"}</p></div><div><p className="text-xs text-neutral-500">Referencia mojado</p><p className="mt-1">{selected.wet_ref ?? "—"}</p></div></> : null}{selected.latest_measurement ? <div className="col-span-2 border-t border-neutral-200 pt-3"><p className="text-xs text-neutral-500">Medido el {fmtDateTime(selected.latest_measurement.measured_at)}</p><p className="mt-1 text-xs text-neutral-600">Valor original: {fmtNum(selected.latest_measurement.raw_value)} · Calidad: {selected.latest_measurement.quality}</p></div> : null}</div><DialogFooter><Button variant="outline" onClick={close}>Cerrar</Button><Button onClick={() => openReading(selected)} disabled={!selected.is_active}>Registrar lectura</Button></DialogFooter></> : null}
    </DialogContent></Dialog>
  </div>;
}



















