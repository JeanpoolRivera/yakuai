/* Sensores: registro con calibraci+¦n + lectura manual/demo + estados. */
import "@/styles/sensors.css";
import { SensorOverview, sensorValue } from "@/components/sensors/SensorOverview";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, Cloud, Droplet, LoaderCircle, Plus, Radio, Search, Thermometer } from "lucide-react";
import { ApiError, friendlyError } from "@/api/client";
import {
  createMeasurement,
  createSensor,
  listPlots,
  listSensors,
  simulateSensor,
} from "@/api/endpoints";
import type { Plot, Sensor } from "@/api/types";
import { Action, FieldBlank, FieldDialogContent as DialogContent, FieldError, FieldLoading, FieldPage, Status } from "@/components/field/FieldUI";

import { Dialog, DialogDescription, DialogHeader, DialogTitle } from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";

import { PaginationControls } from "@/components/shadcn/PaginationControls";

import { FormField } from "@/components/forms/FormField";
import { useCollection } from "@/hooks/useCollection";

import { ageLabel, fmtNum, localInputToIso, nowLocalInput } from "@/lib/format";
import { toastError, toastInfo, toastOk } from "@/lib/toast";


const TIPOS = [
  { value: "humedad", label: "Humedad de suelo", model: "YL-69" },
  { value: "aire_temp", label: "Temperatura del aire", model: "DHT11" },
  { value: "aire_hr", label: "Humedad del aire", model: "DHT11" },
  { value: "lluvia", label: "Lluvia (s+¡/no)", model: "FC-37" },
  { value: "caudal", label: "Caudal", model: "YF-S201" },
];

const STATUS_LABEL: Record<string, string> = {
  ok: "Operativo",
  anomalo: "En revisi+¦n",
  sin_datos: "Sin datos",
};

/* Rangos v+ílidos por tipo (r+®plica de SensorNormalizer del backend, autoridad final). */
function rangeMessage(type: string, raw: number): string | null {
  if (!Number.isFinite(raw)) return "Escribe un valor num+®rico.";
  switch (type) {
    case "humedad":
      return raw < 0 || raw > 1023 ? "YL-69 entrega 0ÔÇô1023 en crudo. Revisa el valor." : null;
    case "aire_temp":
      return raw < -10 || raw > 60 ? "DHT11 mide de -10 a 60 -¦C. Revisa el valor." : null;
    case "aire_hr":
      return raw < 0 || raw > 100 ? "DHT11 mide humedad relativa de 0 a 100. Revisa el valor." : null;
    case "lluvia":
      return raw !== 0 && raw !== 1 ? "FC-37 solo avisa lluvia s+¡/no (valores 0 o 1). Revisa el valor." : null;
    case "caudal":
      return raw < 0 || raw > 60 ? "Caudal YF-S201: rango v+ílido 0ÔÇô60. Revisa el valor." : null;
    default:
      return null;
  }
}

type Tab = "todos" | "ok" | "rev";

function deviceIcon(type: string): React.JSX.Element {
  const cls = "h-[23px] w-[23px]";
  if (type === "humedad" || type === "caudal") return <Droplet className={cls} aria-hidden="true" />;
  if (type === "lluvia") return <Cloud className={cls} aria-hidden="true" />;
  if (type === "aire_temp") return <Thermometer className={cls} aria-hidden="true" />;
  return <Radio className={cls} aria-hidden="true" />;
}

export function SensorsWorkspace(): React.JSX.Element {

  const [activePlot, setActivePlot] = useState("");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer); }, []);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [readingOpen, setReadingOpen] = useState(false);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parcelFilter, setParcelFilter] = useState("");
  const [tab, setTab] = useState<Tab>("todos");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sPlot, setSPlot] = useState("");
  const [sType, setSType] = useState("humedad");
  const [sModel, setSModel] = useState("YL-69");
  const [sPin, setSPin] = useState("A0");
  const [sDry, setSDry] = useState("1020");
  const [sWet, setSWet] = useState("320");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [mSensor, setMSensor] = useState("");
  const [mRaw, setMRaw] = useState("");
  const [mAt, setMAt] = useState("");
  const [sending, setSending] = useState(false);
  const [simulating, setSimulating] = useState(false);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const [s, p] = await Promise.all([listSensors(), listPlots()]);
      setSensors(s);
      setPlots(p);
    } catch (err) {
      setError(friendlyError(err, "No se pudieron cargar los sensores."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const coll = useCollection(sensors, {
    perPage: 8,
    search: (s, q) =>
      `${TIPOS.find((t) => t.value === s.type)?.label ?? s.type} ${s.model} ${s.plot?.name ?? ""} #${s.id}`.toLowerCase().includes(q),
    filter: (s) => (!parcelFilter || s.plot_id === Number(parcelFilter)) && (tab === "todos" ? true : tab === "ok" ? s.status === "ok" && s.is_active : s.status !== "ok" || !s.is_active),
    sort: (a, b) => b.id - a.id,
  });

  const operativos = sensors.filter((s) => s.status === "ok" && s.is_active).length;
  const enRevision = sensors.filter((s) => s.status !== "ok" || !s.is_active).length;

  function onTypeChange(v: string): void {
    setSType(v);
    const t = TIPOS.find((x) => x.value === v);
    if (t) setSModel(t.model);
  }

  async function onCreateSensor(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!sPlot) {
      toastError("Elige la parcela del sensor.");
      return;
    }
    setSaving(true);
    setFieldErrors({});
    try {
      await createSensor({
        plot_id: Number(sPlot),
        type: sType,
        model: sModel.trim() || undefined,
        pin: sPin.trim() || null,
        dry_ref: sType === "humedad" ? Number(sDry) : null,
        wet_ref: sType === "humedad" ? Number(sWet) : null,
      });
      toastOk("Sensor registrado.");
      setOpen(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setFieldErrors(err.fields);
        toastError("Revisa los campos marcados.");
      } else {
        toastError(friendlyError(err, "No se pudo registrar el sensor."));
      }
    } finally {
      setSaving(false);
    }
  }

  async function onSimulate(): Promise<void> {
    const target = parcelSensors.find((s) => s.type === "humedad" && s.is_active)
      ?? sensors.find((s) => s.type === "humedad" && s.is_active);
    if (!target) {
      toastError("No hay sensor de humedad activo para simular.");
      return;
    }
    setSimulating(true);
    try {
      await simulateSensor(target.id);
      toastOk(`Dato simulado en sensor #${target.id} (${target.plot?.name ?? ""}).`);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) toastInfo("Ya hay un dato en este minuto, espera un poco.");
      else toastError(friendlyError(err, "No se pudo simular el dato."));
    } finally {
      setSimulating(false);
    }
  }

  async function onSendReading(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!mSensor || mRaw.trim() === "") {
      toastError("Elige el sensor y escribe el valor crudo.");
      return;
    }
    const sensor = sensors.find((s) => s.id === Number(mSensor));
    const rangeError = sensor ? rangeMessage(sensor.type, Number(mRaw)) : null;
    if (rangeError) {
      toastError(rangeError);
      return;
    }
    setSending(true);
    try {
      const m = await createMeasurement({
        sensor_id: Number(mSensor),
        raw_value: Number(mRaw),
        measured_at: mAt ? localInputToIso(mAt) : new Date().toISOString().slice(0, 19),
        origin: "manual",
      });
      if (m.quality === "ok") toastOk("Lectura guardada correctamente.");
      else toastInfo("Valor imposible: fue a cuarentena para revisi+¦n.");
      setMRaw("");
      setReadingOpen(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) toastInfo("Medici+¦n duplicada: ya exist+¡a ese dato.");
      else toastError(friendlyError(err, "No se pudo guardar la lectura."));
    } finally {
      setSending(false);
    }
  }

  const selected = sensors.find((s) => s.id === selectedId) ?? null;
  const reading = selected?.latest_measurement;
  const stateLabel = (s: Sensor): string => !s.is_active ? "Inactivo" : STATUS_LABEL[s.status] ?? s.status;
  const stateTone = (s: Sensor): "neutral" | "good" | "warn" => !s.is_active ? "neutral" : s.status === "ok" ? "good" : s.status === "anomalo" ? "warn" : "neutral";
  function openReading(id?: number): void { setMSensor(id ? String(id) : ""); setMRaw(""); setMAt(""); setReadingOpen(true); }

  const availablePlots = plots.length ? plots : Array.from(new Map(sensors.filter(s=>s.plot).map(s=>[s.plot_id,s.plot!])).values());
  const active = availablePlots.find(p=>String(p.id)===activePlot) ?? availablePlots[0];
  const parcelSensors = sensors.filter(s=>s.plot_id===active?.id);
  function configure(type: string): void {
    setSPlot(active ? String(active.id) : "");
    onTypeChange(type); setFieldErrors({}); setOpen(true);
  }

  return <div className="sensor-module"><FieldPage title="Sensores" intro="Conoce el suelo, la lluvia y el ambiente de cada parcela." actions={<>
    <Action tone="line" disabled={loading || simulating || !sensors.length || !!error} onClick={() => void onSimulate()}>{simulating ? "SimulandoÔÇª" : "Simular datos"}</Action>
    <Action tone="line" disabled={loading || !sensors.length || !!error} onClick={() => openReading()}>Registrar lectura</Action>
    <Action disabled={loading || !!error} onClick={() => {setSPlot(active ? String(active.id) : "");setFieldErrors({});setOpen(true);}}><Plus size={16} aria-hidden="true" />Registrar sensor</Action>
  </>}>
    {loading ? <FieldLoading>Cargando sensoresÔÇª</FieldLoading> : error ? <FieldError retry={() => void load()}>{error}</FieldError> : <>
      {active && <>
        <section className="sensor-parcel-context" aria-label="Parcela de monitoreo"><div><label htmlFor="sensor-active-plot">Parcela</label><select id="sensor-active-plot" value={active.id} onChange={e=>setActivePlot(e.target.value)}>{availablePlots.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div><div className="sensor-parcel-meta"><strong>{active.crop?.name ?? "Sin cultivo"} -À {fmtNum(active.area_m2)} m-¦</strong><span>{active.farmer?.name ?? "Monitoreo de campo"}</span></div><span className="sensor-context-note">+Ültima lectura de cada medici+¦n</span></section>
        <SensorOverview sensors={parcelSensors} now={now} onRead={openReading} onDetail={setSelectedId} onRegister={configure}/>
      </>}
      {!sensors.length && <FieldBlank title="A+¦n no hay sensores" icon={<Radio size={24}/>}>Configura los sensores de tu parcela para comenzar el monitoreo.</FieldBlank>}
      <details className="sensor-management"><summary>Administrar registros y equipos opcionales<span>Configuraci+¦n e inventario completo</span></summary>
      <section className="field-panel device-inventory" aria-label="Registros de sensores">
        <header className="sensor-inventory-heading"><h2>Dispositivos</h2><p>Consulta su estado, revisa una lectura o registra una nueva medici+¦n.</p></header>
        <div className="sensor-inventory-controls">
          <div className="sensor-state-tabs" aria-label="Filtrar por estado">{([{id:"todos",name:"Todos",count:sensors.length},{id:"ok",name:"Operativos",count:operativos},{id:"rev",name:"Por revisar",count:enRevision}] as const).map((item) => <button key={item.id} type="button" aria-label={`${item.name} (${item.count})`} aria-pressed={tab === item.id} onClick={() => { setTab(item.id); coll.setPage(1); }}>{item.name}<span>{item.count}</span></button>)}</div>
          <div className="sensor-inventory-filters"><select className="field-select" aria-label="Filtrar por parcela" value={parcelFilter} onChange={(e) => {setParcelFilter(e.target.value);coll.setPage(1);}}><option value="">Todas las parcelas</option>{plots.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><label className="field-search"><Search size={16} aria-hidden="true" /><input type="search" placeholder="Buscar por tipo, modelo o parcela" aria-label="Buscar sensores" value={coll.query} onChange={(e) => coll.setQuery(e.target.value)} /></label>{(coll.query || parcelFilter || tab !== "todos") && <Action tone="quiet" onClick={() => {coll.setQuery("");setParcelFilter("");setTab("todos");}}>Restablecer</Action>}</div>
        </div>
        {!coll.total ? <FieldBlank title={sensors.length ? "Sin coincidencias" : "Sin registros"} icon={<Radio size={24} />} action={sensors.length ? <Action tone="line" onClick={() => {coll.setQuery("");setTab("todos");setParcelFilter("");}}>Limpiar filtros</Action> : <Action onClick={() => {setSPlot(active ? String(active.id) : "");setFieldErrors({});setOpen(true);}}>Registrar sensor</Action>}>{sensors.length ? "Prueba con otra b+¦squeda, parcela o estado." : "A+¦ade un dispositivo y as+¡gnalo a su parcela."}</FieldBlank> : <>
          <div className="device-table-wrap"><table className="device-table"><caption className="sr-only">Sensores y +¦ltimas mediciones</caption><thead><tr><th scope="col">Dispositivo</th><th scope="col">Parcela</th><th scope="col">Estado</th><th scope="col">Medici+¦n reciente</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead><tbody>{coll.items.map((s) => {
            const m=s.latest_measurement;
            return <tr key={s.id}><td><div className="device-name"><span className="device-icon">{deviceIcon(s.type)}</span><div><strong>{TIPOS.find((t) => t.value === s.type)?.label ?? s.type}</strong><small>#{s.id} -À {s.model || "Sin modelo"}</small></div></div></td><td data-label="Parcela">{s.plot?.name ?? `Parcela #${s.plot_id}`}</td><td data-label="Estado"><Status tone={stateTone(s)}>{stateLabel(s)}</Status></td><td data-label="Medici+¦n reciente"><strong className="device-reading">{sensorValue(s)}</strong><small>{m ? ageLabel(m.measured_at) : "Pendiente de registro"}{m?.quality==="anomalo" ? " -À En revisi+¦n" : ""}</small></td><td><Action tone="quiet" aria-label={`Ver sensor ${s.id}`} onClick={() => setSelectedId(s.id)}>Ver detalle<ArrowRight size={14} /></Action></td></tr>;
          })}</tbody></table></div><div className="device-pagination"><PaginationControls page={coll.page} pages={coll.pages} onPageChange={coll.setPage} count={`${coll.total} dispositivos`} /></div>
        </>}
      </section>
      </details>
      <p className="field-footnote">La evaluaci+¦n de riego requiere humedad de los +¦ltimos 30 minutos. El estado del sensor no garantiza la vigencia de su lectura.</p>
    </>}
    <Dialog open={selected !== null} onOpenChange={(value) => {if(!value) setSelectedId(null);}}>
      <DialogContent>{selected && <>
        <DialogHeader><p className="field-eyebrow">SENSOR #{selected.id}</p><DialogTitle>{TIPOS.find((t) => t.value === selected.type)?.label ?? selected.type}</DialogTitle><DialogDescription>{selected.plot?.name ?? `Parcela #${selected.plot_id}`} -À {selected.model || "Modelo no especificado"}</DialogDescription></DialogHeader>
        <Status tone={stateTone(selected)}>{stateLabel(selected)}</Status>
        <div className="sensor-value-stage"><p>+Ültima lectura</p><strong className="reading-number">{sensorValue(selected)}</strong><p>{reading ? `Registrada ${ageLabel(reading.measured_at)}` : "Todav+¡a no hay una medici+¦n registrada"}</p>{reading?.quality === "anomalo" && <Status tone="warn">Lectura en revisi+¦n</Status>}</div>
        <dl className="field-facts"><div><dt>Conexi+¦n</dt><dd>{selected.pin ?? "ÔÇö"}</dd></div><div><dt>Origen de lectura</dt><dd>{reading?.origin ?? "ÔÇö"}</dd></div>{selected.type === "humedad" && <><div><dt>Referencia en seco</dt><dd>{selected.dry_ref ?? "ÔÇö"}</dd></div><div><dt>Referencia en mojado</dt><dd>{selected.wet_ref ?? "ÔÇö"}</dd></div></>}</dl>
        <Action onClick={() => {openReading(selected.id);setSelectedId(null);}} aria-label={`Registrar lectura del sensor ${selected.id}`}><Plus size={15} />Nueva lectura</Action>
      </>}</DialogContent>
    </Dialog>
    <Dialog open={readingOpen} onOpenChange={(value) => { if (!sending) setReadingOpen(value); }}>
      <DialogContent className="field-dialog sm:max-w-lg">
        <DialogHeader><p className="field-eyebrow">Datos de campo</p><DialogTitle>Nueva lectura</DialogTitle><DialogDescription>Registra el valor que muestra tu dispositivo.</DialogDescription></DialogHeader>
        <form onSubmit={(e) => void onSendReading(e)} className="field-form">
          <FormField label="Sensor" required htmlFor="m-sensor"><select className="field-select w-full" id="m-sensor" required value={mSensor} onChange={(e) => setMSensor(e.target.value)}><option value="">Selecciona un dispositivo</option>{sensors.map((s) => <option key={s.id} value={s.id}>#{s.id} -À {TIPOS.find((t) => t.value === s.type)?.label ?? s.type} -À {s.plot?.name ?? `Parcela #${s.plot_id}`}</option>)}</select></FormField>
          <FormField label="Valor crudo" required htmlFor="m-raw" hint="Ingresa la lectura original, antes de su normalizaci+¦n."><Input id="m-raw" required inputMode="decimal" value={mRaw} onChange={(e) => setMRaw(e.target.value)} /></FormField>
          <details className="field-disclosure"><summary>-+La medici+¦n se tom+¦ antes?</summary><div className="mt-4"><FormField label="Fecha y hora" htmlFor="m-at" hint="Si lo dejas vac+¡o, se registrar+í el momento actual."><Input id="m-at" type="datetime-local" max={nowLocalInput()} value={mAt} onChange={(e) => setMAt(e.target.value)} /></FormField></div></details>
          <div className="field-form-footer"><Action tone="quiet" disabled={sending} onClick={() => setReadingOpen(false)}>Cancelar</Action><Action type="submit" disabled={sending}>{sending && <LoaderCircle size={16} className="animate-spin" />}{sending ? "GuardandoÔÇª" : "Guardar lectura"}</Action></div>
        </form>
      </DialogContent>
    </Dialog>
    <Dialog open={open} onOpenChange={(value) => { if (!saving) setOpen(value); }}>
      <DialogContent className="field-dialog sm:max-w-xl">
        <DialogHeader><p className="field-eyebrow">Conecta tu campo</p><DialogTitle>Registrar sensor</DialogTitle><DialogDescription>Indica la parcela y la medici+¦n. El DHT11 utiliza un registro para temperatura y otro para humedad del aire.</DialogDescription></DialogHeader>
        <form onSubmit={(e) => void onCreateSensor(e)} className="field-form">
          <FormField label="Parcela" required htmlFor="s-plot" error={fieldErrors.plot_id?.[0]}><select id="s-plot" required className="field-select w-full" value={sPlot} onChange={(e) => setSPlot(e.target.value)}><option value="">Selecciona una parcela</option>{plots.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></FormField>
          <FormField label="Tipo de sensor" required htmlFor="s-type" error={fieldErrors.type?.[0]}><select id="s-type" className="field-select w-full" value={sType} onChange={(e) => onTypeChange(e.target.value)}><optgroup label="Sensores principales">{TIPOS.filter(t=>t.value!=="caudal").map((t) => <option key={t.value} value={t.value}>{t.model} -À {t.label}</option>)}</optgroup><optgroup label="Equipo opcional"><option value="caudal">YF-S201 -À Caudal</option></optgroup></select></FormField>
          <div className="field-form-pair"><FormField label="Modelo" htmlFor="s-model" error={fieldErrors.model?.[0]}><Input id="s-model" value={sModel} onChange={(e) => setSModel(e.target.value)} /></FormField><FormField label="Pin de conexi+¦n" htmlFor="s-pin" error={fieldErrors.pin?.[0]}><Input id="s-pin" value={sPin} onChange={(e) => setSPin(e.target.value)} /></FormField></div>
          {sType === "humedad" ? <fieldset className="field-calibration"><legend>Calibraci+¦n en 2 puntos (seco / mojado)</legend><p>YL-69 entrega valores de 0 a 1023. Usa las referencias de tu dispositivo.</p><div className="field-form-pair"><FormField label="Seco ref (0ÔÇô1023)" required htmlFor="s-dry" error={fieldErrors.dry_ref?.[0]}><Input id="s-dry" type="number" min={0} max={1023} required value={sDry} onChange={(e) => setSDry(e.target.value)} /></FormField><FormField label="Mojado ref (0ÔÇô1023)" required htmlFor="s-wet" error={fieldErrors.wet_ref?.[0]}><Input id="s-wet" type="number" min={0} max={1023} required value={sWet} onChange={(e) => setSWet(e.target.value)} /></FormField></div></fieldset> : <p className="field-form-note">{sType === "lluvia" ? "FC-37 solo avisa lluvia s+¡/no (0 o 1). No necesita calibraci+¦n." : sType === "caudal" ? "YF-S201: rango de caudal de 0 a 60 L/min." : "DHT11: temperatura de ÔêÆ10 a 60 -¦C y humedad relativa de 0 a 100%."}</p>}
          <div className="field-form-footer"><Action tone="quiet" disabled={saving} onClick={() => setOpen(false)}>Cancelar</Action><Action type="submit" disabled={saving}>{saving && <LoaderCircle size={16} className="animate-spin" />}{saving ? "RegistrandoÔÇª" : "Registrar"}</Action></div>
        </form>
      </DialogContent>
    </Dialog>
  </FieldPage></div>;
}
