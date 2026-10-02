/* Sensores: registro con calibración + lectura manual/demo + estados. */
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ApiError, friendlyError } from "../api/client";
import {
  createMeasurement,
  createSensor,
  listPlots,
  listSensors,
} from "../api/endpoints";
import type { Plot, Sensor } from "../api/types";
import {
  Badge,
  Banner,
  Button,
  Card,
  Empty,
  Field,
  Loading,
  Icon,
  Modal,
  PageHead,
  Pager,
  SearchInput,
  SelectInput,
  Stat,
  Tabs,
  TextInput,
} from "../components/ui";
import { useCollection } from "../hooks/useCollection";
import { submitForm } from "../lib/dom";
import { fmtNum, localInputToIso, nowLocalInput } from "../lib/format";
import { toastError, toastInfo, toastOk } from "../lib/toast";

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

type Tab = "todos" | "ok" | "rev";

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
    <div className="page monitoring-page">
      <PageHead
        eyebrow="Monitoreo de campo"
        title="Sensores y lecturas"
        desc="Administra los dispositivos de tus parcelas y registra sus lecturas en un solo lugar."
        crumbs="YakuAI / Sensores"
        actions={<Button onClick={() => setOpen(true)}><Icon name="plus" size={17} /> Registrar sensor</Button>}
      />

      {loading ? (
        <Loading text="Cargando sensores…" />
      ) : error ? (
        <Banner kind="bad">
          {error}{" "}
          <button className="link" onClick={() => void load()}>
            Reintentar
          </button>
        </Banner>
      ) : (
        <>
          <div className="stats">
            <Stat value={fmtNum(sensors.length)} label="Sensores registrados" icon="sensor" />
            <Stat
              value={fmtNum(operativos)}
              label="Operativos"
              icon="check"
              tone={operativos < sensors.length ? "warn" : "ok"}
              sub="Con dato reciente y válido"
            />
            <Stat value={fmtNum(enRevision)} label="En revisión" icon="alert" tone={enRevision > 0 ? "warn" : undefined} sub="Sensores que requieren atención" />
          </div>

          <div className="monitoring-workspace">
            <section className="monitoring-directory stack" aria-label="Lista de sensores">
              <div className="monitoring-section-head"><div><p className="eyebrow">Dispositivos</p><h2 className="card-title">Red de sensores</h2></div><span className="tiny">{sensors.length} registrados</span></div>
              <div className="toolbar">
                <Tabs<Tab>
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
                />
              </div>
              {coll.total === 0 ? (
                <Empty
                  icon="sensor"
                  title={coll.query || tab !== "todos" ? "Sin coincidencias" : "Aún no hay sensores"}
                  hint="Registra el YL-69 de cada parcela con su calibración seco/mojado."
                  action={coll.query || tab !== "todos" ? undefined : <Button onClick={() => setOpen(true)}>Registrar sensor</Button>}
                />
              ) : (
                <>
                  <div className="rows">
                    {coll.items.map((s) => (
                      <article className="monitoring-sensor" key={s.id}>
                        <span className="monitoring-device-icon"><Icon name={s.type === "humedad" || s.type === "caudal" ? "drop" : s.type === "lluvia" ? "cloud" : s.type === "aire_temp" ? "temp" : "sensor"} size={23} /></span>
                        <div className="monitoring-device-info">
                          <h3>{TIPOS.find((type) => type.value === s.type)?.label ?? s.type}</h3>
                          <p>{s.plot?.name ?? `Parcela #${s.plot_id}`}</p>
                          <div className="monitoring-device-meta"><span>Sensor #{s.id}</span><span>{s.model || "Sin modelo"}</span><span>Pin {s.pin ?? "—"}</span></div>
                        </div>
                        <div className="monitoring-device-status">
                          <Badge tone={s.status === "ok" ? "ok" : s.status}>{STATUS_LABEL[s.status] ?? s.status}</Badge>
                          {!s.is_active ? <Badge tone="neutro">Inactivo</Badge> : null}
                        </div>
                      </article>
                    ))}
                  </div>
                  <Pager page={coll.page} pages={coll.pages} onPage={coll.setPage} count={`${coll.total} en total`} />
                </>
              )}
            </section>
            <aside className="monitoring-aside">
              <Card label="Cargar lectura manual" title="Registrar una lectura" sub="Ingresa una medición manual o de prueba para uno de tus sensores.">
              <form className="monitoring-reading-form" onSubmit={(e) => void onSendReading(e)}>
                <Field label="Sensor" required htmlFor="m-sensor">
                  <SelectInput id="m-sensor" value={mSensor} onChange={(e) => setMSensor(e.target.value)}>
                    <option value="">Selecciona…</option>
                    {sensors.map((s) => (
                      <option key={s.id} value={s.id}>
                        #{s.id} · {s.type} · {s.plot?.name ?? ""}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Valor crudo" required htmlFor="m-raw">
                  <TextInput
                    id="m-raw"
                    inputMode="decimal"
                    placeholder="Ej. 650"
                    value={mRaw}
                    onChange={(e) => setMRaw(e.target.value)}
                  />
                </Field>
                <Field label="Fecha y hora" hint="Opcional. Si se deja vacío, se usará el momento actual." htmlFor="m-at">
                  <TextInput
                    id="m-at"
                    type="datetime-local"
                    max={nowLocalInput()}
                    value={mAt}
                    onChange={(e) => setMAt(e.target.value)}
                  />
                </Field>
                <Button type="submit" loading={sending} block>
                  Guardar lectura
                </Button>
              </form>
              </Card>
            <div className="monitoring-note"><Icon name="clock" size={20} /><div><strong>Lecturas al día</strong><p>Después de 3 horas sin lecturas, el sensor pasa al estado «Sin datos».</p></div></div>
            </aside>
          </div>
        </>
      )}

      {open ? (
        <Modal
          title="Registrar sensor"
          sub="Asocia el dispositivo a su parcela y completa sus datos técnicos."
          onClose={() => setOpen(false)}
          busy={saving}
          foot={
            <>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button loading={saving} onClick={() => submitForm("sensor-form")}>
                Registrar
              </Button>
            </>
          }
        >
          <form className="monitoring-sensor-form" id="sensor-form" onSubmit={(e) => void onCreateSensor(e)}>
            <div className="form-grid">
              <Field label="Parcela" required htmlFor="s-plot" error={fieldErrors.plot_id?.[0]}>
                <SelectInput id="s-plot" value={sPlot} onChange={(e) => setSPlot(e.target.value)}>
                  <option value="">Selecciona…</option>
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Tipo" required htmlFor="s-type" error={fieldErrors.type?.[0]}>
                <SelectInput id="s-type" value={sType} onChange={(e) => onTypeChange(e.target.value)}>
                  {TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </div>
            <div className="form-grid">
              <Field label="Modelo" htmlFor="s-model" error={fieldErrors.model?.[0]}>
                <TextInput id="s-model" value={sModel} onChange={(e) => setSModel(e.target.value)} />
              </Field>
              <Field label="Pin" hint="Ej. A0" htmlFor="s-pin" error={fieldErrors.pin?.[0]}>
                <TextInput id="s-pin" value={sPin} onChange={(e) => setSPin(e.target.value)} />
              </Field>
            </div>
            {sType === "humedad" ? (
              <fieldset>
                <legend className="small">Calibración en 2 puntos (seco / mojado)</legend>
                <Banner kind="info">
                  YL-69 entrega 0–1023 en crudo. Referencias típicas: seco ≈ 1020, mojado ≈ 320.
                </Banner>
                <div className="form-grid">
                <Field label="Seco ref (0–1023)" required htmlFor="s-dry" error={fieldErrors.dry_ref?.[0]}>
                  <TextInput id="s-dry" inputMode="numeric" value={sDry} onChange={(e) => setSDry(e.target.value)} />
                </Field>
                <Field label="Mojado ref (0–1023)" required htmlFor="s-wet" error={fieldErrors.wet_ref?.[0]}>
                  <TextInput id="s-wet" inputMode="numeric" value={sWet} onChange={(e) => setSWet(e.target.value)} />
                </Field>
                </div>
              </fieldset>
            ) : (
              <>
                <Banner kind="info">
                  YL-69 entrega 0–1023 en crudo. Referencias típicas: seco ≈ 1020, mojado ≈ 320.
                </Banner>
                <Banner kind="info">
                {sType === "lluvia"
                  ? "FC-37 solo avisa lluvia sí/no (valores 0 o 1). No aporta milímetros."
                  : sType === "caudal"
                    ? "Caudal YF-S201: rango válido 0–60."
                    : "DHT11: temperatura -10 a 60 °C, humedad relativa 0–100."}
                </Banner>
              </>
            )}
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
