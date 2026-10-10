/* Parcelas: mapa con dibujo + lista + wizard de 3 pasos (crear/editar). */
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ApiError, friendlyError } from "../api/client";
import { createPlot, listCrops, listFarmers, listPlots, listSoils, updatePlot } from "../api/endpoints";
import type { PlotInput } from "../api/endpoints";
import type { Crop, Farmer, Plot, SoilTexture } from "../api/types";
import type { DrawResult } from "../components/PlotMap";
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
  Stepper,
  TextInput,
} from "../components/ui";
import { useCollection } from "../hooks/useCollection";
import { submitForm } from "../lib/dom";
import { fmtDate, fmtNum, todayInput } from "../lib/format";
import { toastError, toastOk } from "../lib/toast";

const PlotMap = lazy(() => import("../components/PlotMap").then((m) => ({ default: m.PlotMap })));

interface Draft {
  farmer_id: string;
  name: string;
  latitude: string;
  longitude: string;
  area_m2: string;
  area_origin: "dibujo" | "manual";
  boundary: number[][][] | null;
  crop_id: string;
  sowing_date: string;
  soil_texture_code: string;
  irrigation_system: string;
  irrigation_efficiency: string;
  flow_lpm: string;
}

const EMPTY_DRAFT: Draft = {
  farmer_id: "",
  name: "",
  latitude: "-12.0667",
  longitude: "-75.2833",
  area_m2: "",
  area_origin: "manual",
  boundary: null,
  crop_id: "",
  sowing_date: todayInput(),
  soil_texture_code: "franco",
  irrigation_system: "goteo",
  irrigation_efficiency: "0.9",
  flow_lpm: "",
};

function toDraft(p: Plot): Draft {
  return {
    farmer_id: String(p.farmer_id),
    name: p.name,
    latitude: String(p.latitude),
    longitude: String(p.longitude),
    area_m2: String(p.area_m2),
    area_origin: p.area_origin,
    boundary: p.boundary,
    crop_id: String(p.crop_id),
    sowing_date: p.sowing_date.slice(0, 10),
    soil_texture_code: p.soil_texture_code,
    irrigation_system: p.irrigation_system,
    irrigation_efficiency: String(p.irrigation_efficiency),
    flow_lpm: p.flow_lpm ?? "",
  };
}

function draftToInput(d: Draft): PlotInput {
  return {
    farmer_id: Number(d.farmer_id),
    name: d.name.trim(),
    latitude: Number(d.latitude),
    longitude: Number(d.longitude),
    boundary: d.boundary,
    area_m2: Number(d.area_m2),
    area_origin: d.area_origin,
    crop_id: Number(d.crop_id),
    sowing_date: d.sowing_date,
    soil_texture_code: d.soil_texture_code,
    irrigation_system: d.irrigation_system,
    irrigation_efficiency: Number(d.irrigation_efficiency),
    flow_lpm: d.flow_lpm === "" ? null : Number(d.flow_lpm),
  };
}

export function Plots(): React.JSX.Element {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [soils, setSoils] = useState<SoilTexture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Plot | null>(null);
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [drawInfo, setDrawInfo] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [mapTick, setMapTick] = useState(0);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const step2TitleRef = useRef<HTMLHeadingElement>(null);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const [p, f, c, s] = await Promise.all([listPlots(), listFarmers(), listCrops(), listSoils()]);
      setPlots(p);
      setFarmers(f);
      setCrops(c);
      setSoils(s);
    } catch (err) {
      setError(friendlyError(err, "No se pudieron cargar las parcelas."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (modalOpen && step === 2) step2TitleRef.current?.focus();
  }, [modalOpen, step]);

  const coll = useCollection(plots, {
    perPage: 8,
    search: (p, q) =>
      `${p.name} ${p.farmer?.name ?? ""} ${p.crop?.name ?? ""}`.toLowerCase().includes(q),
    sort: (a, b) => b.id - a.id,
  });

  function openCreate(): void {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setStep(1);
    setFieldErrors({});
    setDrawInfo(null);
    setModalOpen(true);
  }

  function openEdit(p: Plot): void {
    setEditing(p);
    setDraft(toDraft(p));
    setStep(1);
    setFieldErrors({});
    setDrawInfo(null);
    setModalOpen(true);
  }

  function set<K extends keyof Draft>(k: K, v: Draft[K]): void {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function onDraw(d: DrawResult): void {
    if (d.ring.length === 0) {
      // Clic o marcador: solo fija punto, conserva área y contorno previo.
      setDraft((prev) => ({
        ...prev,
        latitude: String(d.lat),
        longitude: String(d.lng),
      }));
      setDrawInfo(`Punto fijado en ${d.lat}, ${d.lng}. Ahora dibuja el contorno para el área o escríbela a mano.`);
      return;
    }
    setDraft((prev) => ({
      ...prev,
      boundary: [d.ring],
      latitude: String(d.lat),
      longitude: String(d.lng),
      area_m2: String(d.areaM2),
      area_origin: "dibujo",
    }));
    setDrawInfo(`Contorno de ${fmtNum(d.areaM2)} m². Revisa el paso 2 y confirma.`);
    setStep(2);
  }

  function useMyLocation(): void {
    const geo = navigator.geolocation;
    if (!geo) {
      toastError("Tu dispositivo no ofrece geolocalización. Escribe las coordenadas a mano.");
      return;
    }
    setLocating(true);
    geo.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(7));
        const lng = Number(pos.coords.longitude.toFixed(7));
        setDraft((prev) => ({ ...prev, latitude: String(lat), longitude: String(lng) }));
        setMapTick((t) => t + 1);
        setDrawInfo(`Ubicación fijada en ${lat}, ${lng}. Ajusta el punto o dibuja el contorno.`);
        setLocating(false);
      },
      () => {
        toastError("No se pudo obtener tu ubicación. Revisa los permisos del navegador.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }

  function stepValid(n: number): string | null {
    if (n === 1) {
      if (!draft.farmer_id) return "Elige el agricultor.";
      if (draft.name.trim().length < 2) return "Ponle un nombre a la parcela.";
      return null;
    }
    if (n === 2) {
      const lat = Number(draft.latitude);
      const lng = Number(draft.longitude);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) return "Latitud inválida (-90 a 90).";
      if (!Number.isFinite(lng) || lng < -180 || lng > 180) return "Longitud inválida.";
      if (!Number.isFinite(Number(draft.area_m2)) || Number(draft.area_m2) < 1)
        return "El área debe ser mayor a 1 m².";
      return null;
    }
    if (!draft.crop_id) return "Elige el cultivo.";
    if (!draft.sowing_date) return "Indica la fecha de siembra.";
    if (new Date(draft.sowing_date) > new Date()) return "La siembra no puede ser futura.";
    const eff = Number(draft.irrigation_efficiency);
    if (!Number.isFinite(eff) || eff <= 0 || eff > 1) return "Eficiencia entre 0 y 1 (ej. 0.9).";
    return null;
  }

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (step < 3) {
      const msg = stepValid(step);
      if (msg) toastError(msg);
      else setStep(step + 1);
      return;
    }
    const errStep3 = stepValid(3);
    if (errStep3) {
      toastError(errStep3);
      return;
    }
    setSaving(true);
    setFieldErrors({});
    try {
      if (editing) {
        await updatePlot(editing.id, draftToInput(draft));
        toastOk("Parcela actualizada.");
      } else {
        await createPlot(draftToInput(draft));
        toastOk("Parcela registrada.");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setFieldErrors(err.fields);
        toastError("Revisa los campos marcados.");
      } else {
        toastError(friendlyError(err, "No se pudo guardar la parcela."));
      }
    } finally {
      setSaving(false);
    }
  }

  const fe = (k: string): string | undefined => fieldErrors[k]?.[0];
  const mapPoints = useMemo(
    () =>
      plots.map((p) => ({
        id: p.id,
        name: p.name,
        latitude: p.latitude,
        longitude: p.longitude,
        farmerName: p.farmer?.name,
      })),
    [plots],
  );

  return (
    <div className="page manage-page plots-page">
      <PageHead
        eyebrow="Territorio"
        title="Parcelas y mapa"
        desc="Organiza tu territorio agrícola: ubicación, cultivos y condiciones de riego."
        crumbs="YakuAI / Parcelas"
        actions={<Button onClick={openCreate}><Icon name="plus" /> Nueva parcela</Button>}
      />

      {loading ? (
        <Loading text="Cargando parcelas…" />
      ) : error ? (
        <Banner kind="bad">
          {error}{" "}
          <button className="link" onClick={() => void load()}>
            Reintentar
          </button>
        </Banner>
      ) : (
        <>
          <div className="manage-overview plots-overview" aria-label="Resumen de parcelas">
            <div><span className="plots-stat-ic" aria-hidden="true"><Icon name="map" size={20} /></span><span>Parcelas registradas</span><strong>{fmtNum(plots.length)}</strong></div>
            <div><span className="plots-stat-ic" aria-hidden="true"><Icon name="check" size={20} /></span><span>Parcelas activas</span><strong>{fmtNum(plots.filter((p) => p.status === "activa").length)}</strong></div>
            <div><span className="plots-stat-ic" aria-hidden="true"><Icon name="sprout" size={20} /></span><span>Superficie registrada</span><strong>{fmtNum(plots.reduce((total, p) => total + Number(p.area_m2), 0))}<small> m²</small></strong></div>
          </div>
          <div className="plots-workspace">
          <div className="plots-map">
          <Card label="Mapa" title="Territorio · Chupaca" sub="Explora las parcelas registradas. El punto y el contorno se fijan en el mapa del paso 2 del formulario.">
            <Suspense fallback={<Loading text="Cargando mapa…" />}>
              <PlotMap plots={mapPoints} />
            </Suspense>
            <div className="plots-legend">
              <span><i className="plots-dot" aria-hidden="true" /> Parcela registrada</span>
              <span>{mapPoints.length === 0 ? "Sin puntos en el mapa" : `${mapPoints.length} en el mapa`}</span>
            </div>
          </Card>
          </div>

          <section className="manage-panel" aria-label="Lista de parcelas">
            <div className="manage-section-head"><div><p className="eyebrow">Registro territorial</p><h2>Parcelas</h2><p>Consulta y actualiza los datos de cada unidad de cultivo.</p></div><Icon name="map" size={24} /></div>
            <div className="toolbar manage-toolbar">
              <SearchInput
                value={coll.query}
                onChange={coll.setQuery}
                placeholder="Buscar por parcela, agricultor o cultivo…"
                label="Buscar parcelas"
              />
              <span className="tiny">
                {coll.query ? `${coll.total} de ${plots.length} parcelas` : `${coll.total} ${coll.total === 1 ? "parcela" : "parcelas"}`}
              </span>
            </div>
            {coll.total === 0 ? (
              <Empty
                icon="map"
                title={coll.query ? "Sin coincidencias" : "Aún no hay parcelas"}
                hint={coll.query ? "Prueba con otro nombre." : "Registra la primera con el botón «Nueva parcela»."}
                action={coll.query ? undefined : <Button onClick={openCreate}><Icon name="plus" /> Nueva parcela</Button>}
              />
            ) : (
              <>
                <div className="manage-plot-grid">
                  {coll.items.map((p) => (
                    <article className="manage-plot plots-card" key={p.id}>
                      <div className="manage-plot-head"><span className="manage-icon"><Icon name="sprout" size={22} /></span><Badge tone={p.status === "activa" ? "ok" : "vencido"}>{p.status}</Badge></div>
                      <h3>{p.name}</h3><p className="manage-owner">{p.farmer?.name ?? "Sin agricultor"}</p>
                      <dl className="manage-facts manage-facts-grid">
                        <div><dt>Cultivo</dt><dd>{p.crop?.name ?? "—"}</dd></div>
                        <div><dt>Superficie</dt><dd>{fmtNum(p.area_m2)} m²</dd></div>
                        <div><dt>Siembra</dt><dd>{fmtDate(p.sowing_date)}</dd></div>
                        <div><dt>Riego</dt><dd className="plots-caps">{p.irrigation_system ?? "—"}</dd></div>
                      </dl>
                      <div className="manage-card-footer"><span className="tiny">Datos de la parcela</span><Button variant="outline" size="sm" onClick={() => openEdit(p)} aria-label={`Editar parcela ${p.name}`}><Icon name="edit" size={16} /> Editar</Button></div>
                    </article>
                  ))}
                </div>
                <Pager page={coll.page} pages={coll.pages} onPage={coll.setPage} count={`${coll.total} en total`} />
              </>
            )}
          </section>
          </div>
        </>
      )}

      {modalOpen ? (
        <Modal
          title={editing ? "Editar parcela" : "Nueva parcela"}
          sub={`Paso ${step} de 3 · ${step === 1 ? "Agricultor" : step === 2 ? "Ubicación" : "Cultivo y riego"}`}
          onClose={() => setModalOpen(false)}
          wide
          busy={saving}
          foot={
            <>
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)} disabled={saving}>
                  Atrás
                </Button>
              ) : null}
              {step < 3 ? (
                <Button
                  onClick={() => {
                    const msg = stepValid(step);
                    if (msg) toastError(msg);
                    else setStep(step + 1);
                  }}
                >
                  Continuar
                </Button>
              ) : (
                <Button loading={saving} onClick={() => submitForm("plot-form")}>
                  {editing ? "Guardar cambios" : "Registrar parcela"}
                </Button>
              )}
            </>
          }
        >
          <form className="manage-form" id="plot-form" onSubmit={(e) => void onSubmit(e)}>
            <Stepper steps={["Agricultor", "Ubicación", "Cultivo y riego"]} current={step} />
            {step === 1 ? (
              <>
                <div className="manage-form-intro"><h3>Identifica la parcela</h3><p>Asigna un agricultor y un nombre que facilite reconocerla.</p></div>
                <Field label="Agricultor" required htmlFor="pl-farmer" error={fe("farmer_id")}>
                  <SelectInput
                    id="pl-farmer"
                    value={draft.farmer_id}
                    aria-invalid={Boolean(fe("farmer_id"))}
                    onChange={(e) => set("farmer_id", e.target.value)}
                  >
                    <option value="">Selecciona…</option>
                    {farmers.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Nombre de la parcela" required htmlFor="pl-name" error={fe("name")}>
                  <TextInput
                    id="pl-name"
                    placeholder="Parcela alta"
                    value={draft.name}
                    aria-invalid={Boolean(fe("name"))}
                    onChange={(e) => set("name", e.target.value)}
                  />
                </Field>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <h3 id="pl-step2-title" ref={step2TitleRef} tabIndex={-1} className="card-title">
                  Ubicación y área
                </h3>
                <Banner kind="info">
                  1) Toca el mapa para fijar el lugar. 2) Con Marcar esquinas agrega todas las esquinas que necesites y pulsa Usar contorno. También puedes escribir los valores.
                  Acerca con + hasta ver bien tu terreno antes de marcar.
                </Banner>
                <div className="row">
                  <Button variant="outline" size="sm" loading={locating} onClick={useMyLocation}>
                    <Icon name="pin" size={15} /> Usar mi ubicación
                  </Button>
                </div>
                <Suspense fallback={<Loading text="Cargando mapa…" />}>
                  <PlotMap
                    key={mapTick}
                    plots={mapPoints}
                    editable
                    onDraw={onDraw}
                    zoom={18}
                    focus={(() => {
                      const lat = Number(draft.latitude);
                      const lng = Number(draft.longitude);
                      return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
                    })()}
                  />
                </Suspense>
                {drawInfo ? <Banner kind="info">{drawInfo}</Banner> : null}
                <div className="form-grid">
                  <Field
                    label="Latitud"
                    hint="Decimal entre −90 y 90"
                    required
                    htmlFor="pl-lat"
                    error={fe("latitude")}
                  >
                    <TextInput
                      id="pl-lat"
                      inputMode="decimal"
                      value={draft.latitude}
                      aria-invalid={Boolean(fe("latitude"))}
                      onChange={(e) => set("latitude", e.target.value)}
                    />
                  </Field>
                  <Field
                    label="Longitud"
                    hint="Decimal entre −180 y 180"
                    required
                    htmlFor="pl-lng"
                    error={fe("longitude")}
                  >
                    <TextInput
                      id="pl-lng"
                      inputMode="decimal"
                      value={draft.longitude}
                      aria-invalid={Boolean(fe("longitude"))}
                      onChange={(e) => set("longitude", e.target.value)}
                    />
                  </Field>
                </div>
                <div className="form-grid">
                  <Field
                    label="Área (m²)"
                    hint="En metros cuadrados, mayor a 1"
                    required
                    htmlFor="pl-area"
                    error={fe("area_m2")}
                  >
                    <TextInput
                      id="pl-area"
                      inputMode="decimal"
                      value={draft.area_m2}
                      aria-invalid={Boolean(fe("area_m2"))}
                      onChange={(e) => set("area_m2", e.target.value)}
                    />
                  </Field>
                  <Field label="Origen del área" htmlFor="pl-origin">
                    <SelectInput
                      id="pl-origin"
                      value={draft.area_origin}
                      onChange={(e) => set("area_origin", e.target.value as Draft["area_origin"])}
                    >
                      <option value="dibujo">Del dibujo en el mapa</option>
                      <option value="manual">Medición manual</option>
                    </SelectInput>
                  </Field>
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <div className="manage-form-intro"><h3>Cultivo y condiciones de riego</h3><p>Estos datos se utilizan para calcular las recomendaciones de la parcela.</p></div>
                <div className="form-grid">
                  <Field label="Cultivo" required htmlFor="pl-crop" error={fe("crop_id")}>
                    <SelectInput id="pl-crop" value={draft.crop_id} onChange={(e) => set("crop_id", e.target.value)}>
                      <option value="">Selecciona…</option>
                      {crops.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field label="Fecha de siembra" required htmlFor="pl-sow" error={fe("sowing_date")}>
                    <TextInput
                      id="pl-sow"
                      type="date"
                      max={todayInput()}
                      value={draft.sowing_date}
                      onChange={(e) => set("sowing_date", e.target.value)}
                    />
                  </Field>
                </div>
                <div className="form-grid">
                  <Field label="Tipo de suelo" required htmlFor="pl-soil" error={fe("soil_texture_code")}>
                    <SelectInput
                      id="pl-soil"
                      value={draft.soil_texture_code}
                      onChange={(e) => set("soil_texture_code", e.target.value)}
                    >
                      {soils.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.name}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field label="Sistema de riego" required htmlFor="pl-sys">
                    <SelectInput
                      id="pl-sys"
                      value={draft.irrigation_system}
                      onChange={(e) => set("irrigation_system", e.target.value)}
                    >
                      <option value="goteo">Goteo</option>
                      <option value="aspersion">Aspersión</option>
                      <option value="gravedad">Gravedad</option>
                    </SelectInput>
                  </Field>
                </div>
                <div className="form-grid">
                  <Field
                    label="Eficiencia (0–1)"
                    hint="Goteo 0.9 · Aspersión 0.75 · Gravedad 0.6"
                    required
                    htmlFor="pl-eff"
                    error={fe("irrigation_efficiency")}
                  >
                    <TextInput
                      id="pl-eff"
                      inputMode="decimal"
                      value={draft.irrigation_efficiency}
                      onChange={(e) => set("irrigation_efficiency", e.target.value)}
                    />
                  </Field>
                  <Field label="Caudal (L/min, opcional)" htmlFor="pl-flow" error={fe("flow_lpm")}>
                    <TextInput
                      id="pl-flow"
                      inputMode="decimal"
                      placeholder="Ej. 20"
                      value={draft.flow_lpm}
                      onChange={(e) => set("flow_lpm", e.target.value)}
                    />
                  </Field>
                </div>
              </>
            ) : null}
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
