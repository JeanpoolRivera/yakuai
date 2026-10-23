/* Parcelas: mapa con dibujo + lista + wizard de 3 pasos (crear/editar). */
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Check, LoaderCircle, Map as MapIcon, MapPin, Pencil, Plus, Sprout } from "lucide-react";
import { ApiError, friendlyError } from "../api/client";
import { createPlot, listCrops, listFarmers, listPlots, listSoils, updatePlot } from "../api/endpoints";
import type { PlotInput } from "../api/endpoints";
import type { Crop, Farmer, Plot, SoilTexture } from "../api/types";
import type { DrawResult } from "../components/shadcn/plot-map";
import { PlotMap } from "../components/shadcn/plot-map";
import { PageHead } from "../components/shadcn/page-head";
import { Stat } from "../components/shadcn/Stat";
import { Badge } from "../components/shadcn/badge";
import { Banner, Empty, Loading } from "../components/shadcn/feedback";
import { Button } from "../components/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/shadcn/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/shadcn/dialog";
import { Input } from "../components/shadcn/input";
import { PaginationControls } from "../components/shadcn/PaginationControls";
import { Stepper } from "../components/shadcn/Stepper";
import { SearchInput } from "../components/shadcn/search-input";
import { PlotOutline } from "../components/shadcn/plot-outline";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../components/shadcn/sheet";
import { FormField } from "../components/forms/FormField";
import { useCollection } from "../hooks/useCollection";
import { submitForm } from "../lib/dom";
import { fmtDate, fmtNum, todayInput } from "../lib/format";
import { toastError, toastOk } from "../lib/toast";


const SELECT_CLS =
  "h-12 w-full rounded-sm border border-neutral-400 bg-white px-3 text-sm text-neutral-800 transition-all hover:border-primary-600 focus-visible:border-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15 disabled:cursor-not-allowed disabled:opacity-50";

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
  const [detail, setDetail] = useState<Plot | null>(null);
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
      console.log("[DEBUG CATÁLOGOS]", {
        cultivosEsArray: Array.isArray(c),
        cantidadCultivos: Array.isArray(c) ? c.length : null,
        primerCultivo: Array.isArray(c) ? c[0] : c,
        suelosEsArray: Array.isArray(s),
        cantidadSuelos: Array.isArray(s) ? s.length : null,
        primerSuelo: Array.isArray(s) ? s[0] : s,
      });
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
    <div>
      <PageHead
        eyebrow="Territorio"
        title="Parcelas y mapa"
        desc="Organiza tu territorio agrícola: ubicación, cultivos y condiciones de riego."
        crumbs="YakuAI / Parcelas"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Nueva parcela
          </Button>
        }
      />

      {loading ? (
        <Loading text="Cargando parcelas…" />
      ) : error ? (
        <Banner kind="bad">
          {error}{" "}
          <Button variant="link" size="sm" onClick={() => void load()}>
            Reintentar
          </Button>
        </Banner>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3" aria-label="Resumen de parcelas">
            <Stat
              value={fmtNum(plots.length)}
              label="Parcelas registradas"
              icon={<MapIcon className="h-[18px] w-[18px]" aria-hidden="true" />}
            />
            <Stat
              value={fmtNum(plots.filter((p) => p.status === "activa").length)}
              label="Parcelas activas"
              icon={<Check className="h-[18px] w-[18px]" aria-hidden="true" />}
            />
            <Stat
              value={`${fmtNum(plots.reduce((total, p) => total + Number(p.area_m2), 0))} m²`}
              label="Superficie registrada"
              icon={<Sprout className="h-[18px] w-[18px]" aria-hidden="true" />}
            />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <section aria-label="Mapa">
              <Card>
                <CardHeader>
                  <CardTitle>Territorio · Chupaca</CardTitle>
                  <CardDescription>
                    Explora las parcelas registradas. El punto y el contorno se fijan en el mapa del paso 2 del formulario.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <PlotMap
                    plots={mapPoints}
                    className="w-full min-w-0"
                    mapHeightClassName="h-[240px] min-h-[240px]"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
                    <span className="inline-flex items-center gap-1.5">
                      <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-primary-600" />
                      Parcela registrada
                    </span>
                    <span>{mapPoints.length === 0 ? "Sin puntos en el mapa" : `${mapPoints.length} en el mapa`}</span>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section aria-label="Lista de parcelas" className="grid content-start gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wider text-primary-700">Registro territorial</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-neutral-800">Parcelas</h2>
                  <p className="mt-1 text-sm text-neutral-600">Consulta y actualiza los datos de cada unidad de cultivo.</p>
                </div>
                <MapIcon className="h-6 w-6 shrink-0 text-neutral-400" aria-hidden="true" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SearchInput
                  value={coll.query}
                  onChange={coll.setQuery}
                  placeholder="Buscar por parcela, agricultor o cultivo…"
                  label="Buscar parcelas"
                  className="min-w-[200px] flex-1"
                />
                <span className="text-xs text-neutral-500">
                  {coll.query ? `${coll.total} de ${plots.length} parcelas` : `${coll.total} ${coll.total === 1 ? "parcela" : "parcelas"}`}
                </span>
              </div>
              {coll.total === 0 ? (
                <Empty
                  icon={<MapIcon className="h-5 w-5" aria-hidden="true" />}
                  title={coll.query ? "Sin coincidencias" : "Aún no hay parcelas"}
                  hint={coll.query ? "Prueba con otro nombre." : "Registra la primera con el botón «Nueva parcela»."}
                  action={
                    coll.query ? undefined : (
                      <Button onClick={openCreate}>
                        <Plus className="h-4 w-4" aria-hidden="true" /> Nueva parcela
                      </Button>
                    )
                  }
                />
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {coll.items.map((p) => (
                      <article key={p.id} className="plot-tile grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-card">
                        <PlotOutline boundary={p.boundary} />
                        <div className="flex items-center justify-between gap-2">
                          <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-lg bg-primary-50 text-primary-700">
                            <Sprout className="h-[22px] w-[22px]" />
                          </span>
                          <Badge variant={p.status === "activa" ? "success" : "secondary"}>{p.status}</Badge>
                        </div>
                        <div>
                          <h3 className="font-semibold text-neutral-800">{p.name}</h3>
                          <p className="text-sm text-neutral-500">{p.farmer?.name ?? "Sin agricultor"}</p>
                        </div>
                        <dl className="grid grid-cols-2 gap-2 text-sm">
                          <div><dt className="text-xs text-neutral-500">Cultivo</dt><dd className="font-medium text-neutral-800">{p.crop?.name ?? "—"}</dd></div>
                          <div><dt className="text-xs text-neutral-500">Superficie</dt><dd className="font-medium tabular-nums text-neutral-800">{fmtNum(p.area_m2)} m²</dd></div>
                          <div><dt className="text-xs text-neutral-500">Siembra</dt><dd className="font-medium text-neutral-800">{fmtDate(p.sowing_date)}</dd></div>
                          <div><dt className="text-xs text-neutral-500">Riego</dt><dd className="font-medium capitalize text-neutral-800">{p.irrigation_system ?? "—"}</dd></div>
                        </dl>
                        <div className="flex items-center justify-between gap-2 border-t border-neutral-200 pt-3">
                          <Button variant="ghost" size="sm" onClick={() => setDetail(p)} aria-label={`Ver detalle de ${p.name}`}>Ver detalle</Button>
                          <Button variant="outline" size="sm" onClick={() => openEdit(p)} aria-label={`Editar parcela ${p.name}`}>
                            <Pencil className="h-4 w-4" aria-hidden="true" /> Editar
                          </Button>
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
          </div>
        </>
      )}

      <Sheet open={detail !== null} onOpenChange={(open) => { if (!open) setDetail(null); }}>
        <SheetContent className="yaku-workspace w-full overflow-y-auto sm:max-w-lg">
          {detail ? <>
            <SheetHeader className="mb-6 pr-5 text-left">
              <SheetTitle className="text-2xl">{detail.name}</SheetTitle>
              <SheetDescription>{detail.farmer?.name ?? "Sin agricultor"} · {detail.crop?.name ?? "Sin cultivo"}</SheetDescription>
            </SheetHeader>
            <PlotOutline boundary={detail.boundary} />
            <dl className="trace-ledger my-5 grid grid-cols-[auto_1fr] gap-x-4 text-sm">
              <dt>Estado</dt><dd>{detail.status}</dd>
              <dt>Superficie</dt><dd>{fmtNum(detail.area_m2)} m²</dd>
              <dt>Origen del área</dt><dd>{detail.area_origin === "dibujo" ? "Contorno dibujado" : "Medición manual"}</dd>
              <dt>Siembra</dt><dd>{fmtDate(detail.sowing_date)}</dd>
              <dt>Suelo</dt><dd>{soils.find((s) => s.code === detail.soil_texture_code)?.name ?? detail.soil_texture_code}</dd>
              <dt>Sistema de riego</dt><dd>{detail.irrigation_system}</dd>
              <dt>Eficiencia</dt><dd>{fmtNum(Number(detail.irrigation_efficiency) * 100)} %</dd>
              <dt>Caudal</dt><dd>{detail.flow_lpm === null ? "Sin registrar" : `${fmtNum(detail.flow_lpm)} L/min`}</dd>
              <dt>Coordenadas</dt><dd>{detail.latitude}, {detail.longitude}</dd>
            </dl>
            <Button className="w-full" onClick={() => { setDetail(null); openEdit(detail); }}><Pencil className="h-4 w-4" aria-hidden="true" />Editar datos de la parcela</Button>
          </> : null}
        </SheetContent>
      </Sheet>

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open && !saving) setModalOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar parcela" : "Nueva parcela"}</DialogTitle>
            <DialogDescription>
              {`Paso ${step} de 3 · ${step === 1 ? "Agricultor" : step === 2 ? "Ubicación" : "Cultivo y riego"}`}
            </DialogDescription>
          </DialogHeader>
          <form id="plot-form" onSubmit={(e) => void onSubmit(e)} className="grid min-h-0 flex-1 gap-5 overflow-y-auto pr-1">
            <Stepper steps={["Agricultor", "Ubicación", "Cultivo y riego"]} current={step} />
            {step === 1 ? (
              <>
                <div>
                  <h3 className="text-base font-semibold text-neutral-800">Identifica la parcela</h3>
                  <p className="mt-1 text-sm text-neutral-600">Asigna un agricultor y un nombre que facilite reconocerla.</p>
                </div>
                <FormField label="Agricultor" required htmlFor="pl-farmer" error={fe("farmer_id")}>
                  <select
                    id="pl-farmer"
                    className={SELECT_CLS}
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
                  </select>
                </FormField>
                <FormField label="Nombre de la parcela" required htmlFor="pl-name" error={fe("name")}>
                  <Input
                    id="pl-name"
                    placeholder="Parcela alta"
                    value={draft.name}
                    aria-invalid={Boolean(fe("name"))}
                    onChange={(e) => set("name", e.target.value)}
                  />
                </FormField>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <h3 id="pl-step2-title" ref={step2TitleRef} tabIndex={-1} className="text-base font-semibold text-neutral-800 focus:outline-none">
                  Ubicación y área
                </h3>
                <Banner kind="info">
                  1) Toca el mapa para fijar o mover el punto verde. 2) Pulsa “Marcar esquinas” y toca al menos 3 esquinas del terreno. El punto verde queda visible como referencia y no cuenta como esquina. Pulsa “Usar contorno” para guardar el área. También puedes escribir las coordenadas manualmente y acercar el mapa con +.
                </Banner>

                {/* El mapa de dibujo debe permanecer dentro del paso 2 del formulario. */}
                <div
                  data-plot-form-map="true"
                  className="relative z-0 my-1 block w-full min-w-0 overflow-hidden rounded-lg"
                  style={{
                    display: "block",
                    height: "320px",
                    minHeight: "320px",
                    width: "100%",
                    flex: "0 0 320px",
                    position: "relative",
                    background: "#e8edf0",
                  }}
                >
                  <PlotMap
                    key={`plot-form-map-${mapTick}`}
                    plots={mapPoints}
                    editable
                    className="w-full min-w-0"
                    mapHeightClassName="h-[280px] min-h-[280px]"
                    onDraw={onDraw}
                    zoom={18}
                    focus={(() => {
                      const lat = Number(draft.latitude);
                      const lng = Number(draft.longitude);
                      return Number.isFinite(lat) && Number.isFinite(lng)
                        ? { lat, lng }
                        : null;
                    })()}
                  />
                </div>

                <div>
                  <Button type="button" variant="outline" size="sm" disabled={locating} onClick={useMyLocation}>
                    {locating ? (
                      <LoaderCircle className="h-[15px] w-[15px] animate-spin" aria-hidden="true" />
                    ) : (
                      <MapPin className="h-[15px] w-[15px]" aria-hidden="true" />
                    )}
                    Usar mi ubicación
                  </Button>
                </div>
                {drawInfo ? <Banner kind="info">{drawInfo}</Banner> : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Latitud"
                    hint="Decimal entre −90 y 90"
                    required
                    htmlFor="pl-lat"
                    error={fe("latitude")}
                  >
                    <Input
                      id="pl-lat"
                      inputMode="decimal"
                      value={draft.latitude}
                      aria-invalid={Boolean(fe("latitude"))}
                      onChange={(e) => set("latitude", e.target.value)}
                    />
                  </FormField>
                  <FormField
                    label="Longitud"
                    hint="Decimal entre −180 y 180"
                    required
                    htmlFor="pl-lng"
                    error={fe("longitude")}
                  >
                    <Input
                      id="pl-lng"
                      inputMode="decimal"
                      value={draft.longitude}
                      aria-invalid={Boolean(fe("longitude"))}
                      onChange={(e) => set("longitude", e.target.value)}
                    />
                  </FormField>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Área (m²)"
                    hint="En metros cuadrados, mayor a 1"
                    required
                    htmlFor="pl-area"
                    error={fe("area_m2")}
                  >
                    <Input
                      id="pl-area"
                      inputMode="decimal"
                      value={draft.area_m2}
                      aria-invalid={Boolean(fe("area_m2"))}
                      onChange={(e) => set("area_m2", e.target.value)}
                    />
                  </FormField>
                  <FormField label="Origen del área" htmlFor="pl-origin">
                    <select
                      id="pl-origin"
                      className={SELECT_CLS}
                      value={draft.area_origin}
                      onChange={(e) => set("area_origin", e.target.value as Draft["area_origin"])}
                    >
                      <option value="dibujo">Del dibujo en el mapa</option>
                      <option value="manual">Medición manual</option>
                    </select>
                  </FormField>
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <div>
                  <h3 className="text-base font-semibold text-neutral-800">Cultivo y condiciones de riego</h3>
                  <p className="mt-1 text-sm text-neutral-600">Estos datos se utilizan para calcular las recomendaciones de la parcela.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Cultivo" required htmlFor="pl-crop" error={fe("crop_id")}>
                    <select id="pl-crop" className={SELECT_CLS} value={draft.crop_id} onChange={(e) => set("crop_id", e.target.value)}>
                      <option value="">Selecciona…</option>
                      {crops.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Fecha de siembra" required htmlFor="pl-sow" error={fe("sowing_date")}>
                    <Input
                      id="pl-sow"
                      type="date"
                      max={todayInput()}
                      value={draft.sowing_date}
                      onChange={(e) => set("sowing_date", e.target.value)}
                    />
                  </FormField>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Tipo de suelo" required htmlFor="pl-soil" error={fe("soil_texture_code")}>
                    <select
                      id="pl-soil"
                      className={SELECT_CLS}
                      value={draft.soil_texture_code}
                      onChange={(e) => set("soil_texture_code", e.target.value)}
                    >
                      {soils.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Sistema de riego" required htmlFor="pl-sys">
                    <select
                      id="pl-sys"
                      className={SELECT_CLS}
                      value={draft.irrigation_system}
                      onChange={(e) => set("irrigation_system", e.target.value)}
                    >
                      <option value="goteo">Goteo</option>
                      <option value="aspersion">Aspersión</option>
                      <option value="gravedad">Gravedad</option>
                    </select>
                  </FormField>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Eficiencia (0–1)"
                    hint="Goteo 0.9 · Aspersión 0.75 · Gravedad 0.6"
                    required
                    htmlFor="pl-eff"
                    error={fe("irrigation_efficiency")}
                  >
                    <Input
                      id="pl-eff"
                      inputMode="decimal"
                      value={draft.irrigation_efficiency}
                      onChange={(e) => set("irrigation_efficiency", e.target.value)}
                    />
                  </FormField>
                  <FormField label="Caudal (L/min, opcional)" htmlFor="pl-flow" error={fe("flow_lpm")}>
                    <Input
                      id="pl-flow"
                      inputMode="decimal"
                      placeholder="Ej. 20"
                      value={draft.flow_lpm}
                      onChange={(e) => set("flow_lpm", e.target.value)}
                    />
                  </FormField>
                </div>
              </>
            ) : null}
          </form>
          <DialogFooter>
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
              <Button disabled={saving} onClick={() => submitForm("plot-form")}>
                {saving ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                    {editing ? "Guardar cambios" : "Registrar parcela"}
                  </>
                ) : (
                  <>{editing ? "Guardar cambios" : "Registrar parcela"}</>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}