/* Sensores: registro con calibración + lectura manual/demo + estados. */
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Check, Clock, Cloud, Droplet, LoaderCircle, Plus, Radio, Thermometer, TriangleAlert } from "lucide-react";
import { ApiError, friendlyError } from "../api/client";
import {
  createMeasurement,
  createSensor,
  listPlots,
  listSensors,
} from "../api/endpoints";
import type { Plot, Sensor } from "../api/types";
import { PageHead } from "../components/shadcn/page-head";
import { Stat } from "../components/shadcn/Stat";
import { Badge } from "../components/shadcn/badge";
import { Banner, Empty, Loading } from "../components/shadcn/feedback";
import { Button } from "../components/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/shadcn/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/shadcn/dialog";
import { Input } from "../components/shadcn/input";
import { FilterTabs } from "../components/shadcn/filter-tabs";
import { PaginationControls } from "../components/shadcn/PaginationControls";
import { SearchInput } from "../components/shadcn/search-input";
import { FormField } from "../components/forms/FormField";
import { useCollection } from "../hooks/useCollection";
import { submitForm } from "../lib/dom";
import { ageLabel, fmtNum, localInputToIso, nowLocalInput } from "../lib/format";
import { toastError, toastInfo, toastOk } from "../lib/toast";

const SELECT_CLS =
  "h-12 w-full rounded-sm border border-neutral-400 bg-white px-3 text-sm text-neutral-800 transition-all hover:border-primary-600 focus-visible:border-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15 disabled:cursor-not-allowed disabled:opacity-50";

const TIPOS = [
  { value: "humedad", label: "Humedad de suelo", model: "YL-69" },
  { value: "aire_temp", label: "Temperatura del aire", model: "DHT11" },
  { value: "aire_hr", label: "Humedad del aire", model: "DHT11" },
  { value: "lluvia", label: "Lluvia (sí/no)", model: "FC-37" },
  { value: "caudal", label: "Caudal", model: "YF-S201" },
];

const STATUS_LABEL: Record<string, string> = {
  ok: "Operativo",
  anomalo: "En revisión",
  sin_datos: "Sin datos",
};

/* Rangos válidos por tipo (réplica de SensorNormalizer del backend, autoridad final). */
function rangeMessage(type: string, raw: number): string | null {
  if (!Number.isFinite(raw)) return "Escribe un valor numérico.";
  switch (type) {
    case "humedad":
      return raw < 0 || raw > 1023 ? "YL-69 entrega 0–1023 en crudo. Revisa el valor." : null;
    case "aire_temp":
      return raw < -10 || raw > 60 ? "DHT11 mide de -10 a 60 °C. Revisa el valor." : null;
    case "aire_hr":
      return raw < 0 || raw > 100 ? "DHT11 mide humedad relativa de 0 a 100. Revisa el valor." : null;
    case "lluvia":
      return raw !== 0 && raw !== 1 ? "FC-37 solo avisa lluvia sí/no (valores 0 o 1). Revisa el valor." : null;
    case "caudal":
      return raw < 0 || raw > 60 ? "Caudal YF-S201: rango válido 0–60. Revisa el valor." : null;
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

export function Sensors(): React.JSX.Element {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      `${s.type} ${s.model} ${s.plot?.name ?? ""} #${s.id}`.toLowerCase().includes(q),
    filter: (s) => (tab === "todos" ? true : tab === "ok" ? s.status === "ok" : s.status !== "ok"),
    sort: (a, b) => b.id - a.id,
  });

  const operativos = sensors.filter((s) => s.status === "ok" && s.is_active).length;
  const enRevision = sensors.filter((s) => s.status !== "ok").length;

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
      if (m.quality === "ok") toastOk(`Lectura aceptada (${m.norm_value ?? "—"}%).`);
      else toastInfo("Valor imposible: fue a cuarentena para revisión.");
      setMRaw("");
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) toastInfo("Medición duplicada: ya existía ese dato.");
      else toastError(friendlyError(err, "No se pudo guardar la lectura."));
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <PageHead
        eyebrow="Monitoreo de campo"
        title="Sensores y lecturas"
        desc="Administra los dispositivos de tus parcelas y registra sus lecturas en un solo lugar."
        crumbs="YakuAI / Sensores"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Registrar sensor
          </Button>
        }
      />

      {loading ? (
        <Loading text="Cargando sensores…" />
      ) : error ? (
        <Banner kind="bad">
          {error}{" "}
          <Button variant="link" size="sm" onClick={() => void load()}>
            Reintentar
          </Button>
        </Banner>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              value={fmtNum(sensors.length)}
              label="Sensores registrados"
              icon={<Radio className="h-[18px] w-[18px]" aria-hidden="true" />}
            />
            <Stat
              value={fmtNum(operativos)}
              label="Operativos"
              icon={<Check className="h-[18px] w-[18px]" aria-hidden="true" />}
              tone={operativos < sensors.length ? "warn" : "ok"}
              sub="Con dato reciente y válido"
            />
            <Stat
              value={fmtNum(enRevision)}
              label="En revisión"
              icon={<TriangleAlert className="h-[18px] w-[18px]" aria-hidden="true" />}
              tone={enRevision > 0 ? "warn" : undefined}
              sub="Sensores que requieren atención"
            />
          </div>

          <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <section aria-label="Lista de sensores" className="grid content-start gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wider text-primary-700">Dispositivos</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-neutral-800">Red de sensores</h2>
                </div>
                <span className="text-xs text-neutral-500">{sensors.length} registrados</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <FilterTabs<Tab>
                  label="Filtrar por estado"
                  value={tab}
                  onChange={(v) => {
                    setTab(v);
                    coll.setPage(1);
                  }}
                  options={[
                    { value: "todos", label: `Todos (${sensors.length})` },
                    { value: "ok", label: `Operativos (${operativos})` },
                    { value: "rev", label: `En revisión (${enRevision})` },
                  ]}
                />
                <SearchInput
                  value={coll.query}
                  onChange={coll.setQuery}
                  placeholder="Buscar por tipo, modelo o parcela…"
                  label="Buscar sensores"
                  className="min-w-[200px] flex-1"
                />
              </div>
              {coll.total === 0 ? (
                <Empty
                  icon={<Radio className="h-5 w-5" aria-hidden="true" />}
                  title={coll.query || tab !== "todos" ? "Sin coincidencias" : "Aún no hay sensores"}
                  hint="Registra el YL-69 de cada parcela con su calibración seco/mojado."
                  action={
                    coll.query || tab !== "todos" ? undefined : (
                      <Button onClick={() => setOpen(true)}>Registrar sensor</Button>
                    )
                  }
                />
              ) : (
                <>
                  <div className="grid gap-2">
                    {coll.items.map((s) => (
                      <article key={s.id} className="flex gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-card">
                        <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-700">
                          {deviceIcon(s.type)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-neutral-800">
                            {TIPOS.find((type) => type.value === s.type)?.label ?? s.type}
                          </h3>
                          <p className="text-sm text-neutral-500">{s.plot?.name ?? `Parcela #${s.plot_id}`}</p>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-neutral-500">
                            <span>Sensor #{s.id}</span>
                            <span>{s.model || "Sin modelo"}</span>
                            <span>Pin {s.pin ?? "—"}</span>
                          </div>
                          {s.latest_measurement ? (
                            <p className="mt-1 text-xs text-neutral-500">
                              Última lectura: {s.latest_measurement.norm_value ?? s.latest_measurement.raw_value}
                              {s.type === "humedad" ? " %" : ""} · {ageLabel(s.latest_measurement.measured_at)}
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-neutral-500">Sin lecturas registradas.</p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <Badge variant={s.status === "ok" ? "success" : s.status === "anomalo" ? "warning" : "secondary"}>
                            {STATUS_LABEL[s.status] ?? s.status}
                          </Badge>
                          {!s.is_active ? <Badge variant="secondary">Inactivo</Badge> : null}
                        </div>
                      </article>
                    ))}
                  </div>
                  <PaginationControls
                  page={coll.page}
                  pages={coll.pages}
                  onPageChange={coll.setPage}
                  count={`${coll.total} en total`}
                />
                </>
              )}
            </section>

            <aside className="grid content-start gap-3">
              <Card>
                <CardHeader>
                  <CardTitle>Registrar una lectura</CardTitle>
                  <CardDescription>Ingresa una medición manual o de prueba para uno de tus sensores.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => void onSendReading(e)} className="grid gap-4">
                    <FormField label="Sensor" required htmlFor="m-sensor">
                      <select id="m-sensor" className={SELECT_CLS} value={mSensor} onChange={(e) => setMSensor(e.target.value)}>
                        <option value="">Selecciona…</option>
                        {sensors.map((s) => (
                          <option key={s.id} value={s.id}>
                            #{s.id} · {s.type} · {s.plot?.name ?? ""}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Valor crudo" required htmlFor="m-raw">
                      <Input
                        id="m-raw"
                        inputMode="decimal"
                        placeholder="Ej. 650"
                        value={mRaw}
                        onChange={(e) => setMRaw(e.target.value)}
                      />
                    </FormField>
                    <FormField label="Fecha y hora" hint="Opcional. Si se deja vacío, se usará el momento actual." htmlFor="m-at">
                      <Input
                        id="m-at"
                        type="datetime-local"
                        max={nowLocalInput()}
                        value={mAt}
                        onChange={(e) => setMAt(e.target.value)}
                      />
                    </FormField>
                    <Button type="submit" disabled={sending} className="w-full">
                      {sending ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                          Guardar lectura
                        </>
                      ) : (
                        <>Guardar lectura</>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              <div className="flex items-start gap-3 rounded-lg border border-info-100 bg-info-50 p-4">
                <Clock className="h-5 w-5 shrink-0 text-info-600" aria-hidden="true" />
                <div className="text-sm">
                  <strong className="font-semibold text-neutral-800">Lecturas al día</strong>
                  <p className="mt-0.5 text-neutral-600">Después de 3 horas sin lecturas, el sensor pasa al estado «Sin datos».</p>
                </div>
              </div>
            </aside>
          </div>
        </>
      )}

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o && !saving) setOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar sensor</DialogTitle>
            <DialogDescription>Asocia el dispositivo a su parcela y completa sus datos técnicos.</DialogDescription>
          </DialogHeader>
          <form id="sensor-form" onSubmit={(e) => void onCreateSensor(e)} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Parcela" required htmlFor="s-plot" error={fieldErrors.plot_id?.[0]}>
                <select id="s-plot" className={SELECT_CLS} value={sPlot} onChange={(e) => setSPlot(e.target.value)}>
                  <option value="">Selecciona…</option>
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Tipo" required htmlFor="s-type" error={fieldErrors.type?.[0]}>
                <select id="s-type" className={SELECT_CLS} value={sType} onChange={(e) => onTypeChange(e.target.value)}>
                  {TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Modelo" htmlFor="s-model" error={fieldErrors.model?.[0]}>
                <Input id="s-model" value={sModel} onChange={(e) => setSModel(e.target.value)} />
              </FormField>
              <FormField label="Pin" hint="Ej. A0" htmlFor="s-pin" error={fieldErrors.pin?.[0]}>
                <Input id="s-pin" value={sPin} onChange={(e) => setSPin(e.target.value)} />
              </FormField>
            </div>
            {sType === "humedad" ? (
              <fieldset className="grid gap-3 rounded-lg border border-neutral-200 p-4">
                <legend className="px-1 text-sm font-medium text-neutral-600">Calibración en 2 puntos (seco / mojado)</legend>
                <Banner kind="info">YL-69 entrega 0–1023 en crudo. Referencias típicas: seco ≈ 1020, mojado ≈ 320.</Banner>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Seco ref (0–1023)" required htmlFor="s-dry" error={fieldErrors.dry_ref?.[0]}>
                    <Input id="s-dry" inputMode="numeric" value={sDry} onChange={(e) => setSDry(e.target.value)} />
                  </FormField>
                  <FormField label="Mojado ref (0–1023)" required htmlFor="s-wet" error={fieldErrors.wet_ref?.[0]}>
                    <Input id="s-wet" inputMode="numeric" value={sWet} onChange={(e) => setSWet(e.target.value)} />
                  </FormField>
                </div>
              </fieldset>
            ) : (
              <Banner kind="info">
                {sType === "lluvia"
                  ? "FC-37 solo avisa lluvia sí/no (valores 0 o 1). No aporta milímetros ni requiere calibración."
                  : sType === "caudal"
                    ? "Caudal YF-S201: rango válido 0–60."
                    : "DHT11: temperatura -10 a 60 °C, humedad relativa 0–100."}
              </Banner>
            )}
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button disabled={saving} onClick={() => submitForm("sensor-form")}>
              {saving ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Registrar
                </>
              ) : (
                <>Registrar</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}