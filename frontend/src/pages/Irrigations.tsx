/* Riegos: anotar aplicado, comparar con recomendado, corregir/anular con motivo. */
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { ApiError, friendlyError } from "../api/client";
import {
  correctIrrigation,
  createIrrigation,
  listIrrigations,
  listPlots,
  voidIrrigation,
} from "../api/endpoints";
import type { Irrigation, Plot } from "../api/types";
import { PageHead } from "../components/shadcn/page-head";
import { Stat } from "../components/shadcn/Stat";
import { Badge } from "../components/shadcn/badge";
import { Banner, Empty, Loading } from "../components/shadcn/feedback";
import { Button } from "../components/shadcn/button";
import { Confirm } from "../components/shadcn/confirm";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/shadcn/dialog";
import { Input } from "../components/shadcn/input";
import { PaginationControls } from "../components/shadcn/PaginationControls";
import { SearchInput } from "../components/shadcn/search-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/shadcn/table";
import { FormField } from "../components/forms/FormField";
import { useCollection } from "../hooks/useCollection";
import { submitForm } from "../lib/dom";
import { fmtDateTime, fmtNum, localInputToIso, nowLocalInput, toNum } from "../lib/format";
import { toastError, toastOk } from "../lib/toast";

const SELECT_CLS =
  "h-12 w-full rounded-sm border border-neutral-400 bg-white px-3 text-sm text-neutral-800 transition-all hover:border-primary-600 focus-visible:border-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15 disabled:cursor-not-allowed disabled:opacity-50";

const DATE_CLS =
  "h-12 rounded-sm border border-neutral-400 bg-white px-3 text-sm text-neutral-800 transition-all hover:border-primary-600 focus-visible:border-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15";

function desvioTone(desv: number): string {
  if (Math.abs(desv) <= 100) return "ok";
  return desv > 0 ? "warn" : "bad";
}

function desvioVariant(tone: string): "success" | "warning" | "destructive" {
  if (tone === "warn") return "warning";
  if (tone === "bad") return "destructive";
  return "success";
}

export function Irrigations(): React.JSX.Element {
  const [items, setItems] = useState<Irrigation[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fPlot, setFPlot] = useState("");
  const [fApplied, setFApplied] = useState("");
  const [fRecommended, setFRecommended] = useState("");
  const [fAt, setFAt] = useState(nowLocalInput());
  const [fNote, setFNote] = useState("");
  const [fDesde, setFDesde] = useState("");
  const [fHasta, setFHasta] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [correcting, setCorrecting] = useState<Irrigation | null>(null);
  const [cApplied, setCApplied] = useState("");
  const [cMotivo, setCMotivo] = useState("");
  const [voiding, setVoiding] = useState<Irrigation | null>(null);
  const [confirmVoid, setConfirmVoid] = useState(false);
  const [vMotivo, setVMotivo] = useState("");
  const [busy, setBusy] = useState(false);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const [r, p] = await Promise.all([listIrrigations(), listPlots()]);
      setItems(r);
      setPlots(p);
    } catch (err) {
      setError(friendlyError(err, "No se pudieron cargar los riegos."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const coll = useCollection(items, {
    perPage: 10,
    search: (r, q) => `${r.id} ${r.plot?.name ?? ""} ${r.note ?? ""}`.toLowerCase().includes(q),
    filter: (r) => {
      const day = r.occurred_at.slice(0, 10);
      if (fDesde && day < fDesde) return false;
      if (fHasta && day > fHasta) return false;
      return true;
    },
    sort: (a, b) => (a.occurred_at < b.occurred_at ? 1 : -1),
  });

  const hasFilter = coll.query !== "" || fDesde !== "" || fHasta !== "";

  const activos = items.filter((r) => r.status === "activo");
  const totalAgua = activos.reduce((a, r) => a + (toNum(r.applied_liters) ?? 0), 0);

  function openCreate(): void {
    setFPlot("");
    setFApplied("");
    setFRecommended("");
    setFAt(nowLocalInput());
    setFNote("");
    setFieldErrors({});
    setOpen(true);
  }

  async function onCreate(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!fPlot || fApplied.trim() === "") {
      toastError("Elige la parcela y escribe cuánta agua aplicaste.");
      return;
    }
    setSaving(true);
    setFieldErrors({});
    try {
      await createIrrigation({
        plot_id: Number(fPlot),
        occurred_at: localInputToIso(fAt),
        applied_liters: Number(fApplied),
        recommended_liters: fRecommended.trim() === "" ? null : Number(fRecommended),
        note: fNote.trim() || undefined,
      });
      toastOk("Riego anotado.");
      setOpen(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setFieldErrors(err.fields);
        toastError("Revisa los campos marcados.");
      } else {
        toastError(friendlyError(err, "No se pudo anotar el riego."));
      }
    } finally {
      setSaving(false);
    }
  }

  async function onCorrect(): Promise<void> {
    if (!correcting || cApplied.trim() === "" || cMotivo.trim() === "") {
      toastError("Escribe el valor corregido y el motivo.");
      return;
    }
    setBusy(true);
    try {
      await correctIrrigation(correcting.id, Number(cApplied), cMotivo.trim());
      toastOk("Corrección guardada sin borrar el historial.");
      setCorrecting(null);
      await load();
    } catch (err) {
      toastError(friendlyError(err, "No se pudo corregir."));
    } finally {
      setBusy(false);
    }
  }

  async function onVoid(): Promise<void> {
    if (!voiding || vMotivo.trim() === "") {
      toastError("Escribe el motivo de la anulación.");
      return;
    }
    setBusy(true);
    try {
      await voidIrrigation(voiding.id, vMotivo.trim());
      toastOk("Registro anulado.");
      setConfirmVoid(false);
      setVoiding(null);
      await load();
    } catch (err) {
      toastError(friendlyError(err, "No se pudo anular."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHead
        eyebrow="Historial"
        title="Riegos aplicados"
        desc="Registra el agua aplicada y compárala con la recomendación de cada parcela."
        crumbs="YakuAI / Riegos"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Anotar riego
          </Button>
        }
      />

      {loading ? (
        <Loading text="Cargando riegos…" />
      ) : error ? (
        <Banner kind="bad">
          {error}{" "}
          <Button variant="link" size="sm" onClick={() => void load()}>
            Reintentar
          </Button>
        </Banner>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat value={fmtNum(activos.length)} label="Riegos activos" sub="Registros válidos en el historial" />
            <Stat value={`${fmtNum(totalAgua)} L`} label="Agua total aplicada" sub="Volumen acumulado de los riegos activos" />
          </div>

          <section aria-label="Historial de riegos" className="mt-4 grid gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-neutral-800">Registro de aplicaciones</h2>
              <p className="mt-1 text-sm text-neutral-600">Recomendación, consumo real y trazabilidad de cada riego.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput
                value={coll.query}
                onChange={coll.setQuery}
                placeholder="Buscar por parcela o nota…"
                label="Buscar riegos"
                className="min-w-[200px] flex-1"
              />
              <input
                className={DATE_CLS}
                type="date"
                aria-label="Desde"
                value={fDesde}
                max={fHasta || undefined}
                onChange={(e) => {
                  setFDesde(e.target.value);
                  coll.setPage(1);
                }}
              />
              <input
                className={DATE_CLS}
                type="date"
                aria-label="Hasta"
                value={fHasta}
                min={fDesde || undefined}
                onChange={(e) => {
                  setFHasta(e.target.value);
                  coll.setPage(1);
                }}
              />
              {fDesde || fHasta ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFDesde("");
                    setFHasta("");
                    coll.setPage(1);
                  }}
                >
                  Limpiar
                </Button>
              ) : null}
              <span className="text-xs text-neutral-500">{coll.total} registros</span>
            </div>
            {coll.total === 0 ? (
              <Empty
                title={hasFilter ? "Sin coincidencias" : "Aún no hay riegos"}
                hint={hasFilter ? "Prueba con otra búsqueda o período." : "Anota cada riego real para comparar con lo recomendado."}
                action={hasFilter ? undefined : <Button onClick={openCreate}>Anotar riego</Button>}
              />
            ) : (
              <>
                <div className="relative w-full overflow-x-auto rounded-md border border-neutral-200" role="region" aria-label="Historial de riegos" tabIndex={0}>
                  <Table>
                    <caption className="sr-only">Riegos aplicados con recomendada, aplicada, desvío y estado</caption>
                    <TableHeader>
                      <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                        <TableHead>Fecha</TableHead>
                        <TableHead>Parcela</TableHead>
                        <TableHead className="text-right tabular-nums">Recomendada</TableHead>
                        <TableHead className="text-right tabular-nums">Aplicada</TableHead>
                        <TableHead>Desvío</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>
                          <span className="text-xs font-normal text-neutral-500">Acciones</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coll.items.map((r) => {
                        const rec = toNum(r.recommended_liters);
                        const apl = toNum(r.applied_liters) ?? 0;
                        const desv = rec === null ? null : apl - rec;
                        return (
                          <TableRow key={r.id}>
                            <TableCell>
                              <div>
                                <strong className="font-semibold">{fmtDateTime(r.occurred_at)}</strong>
                                <div className="text-xs text-neutral-500">Registro #{r.id}</div>
                                {r.note ? <div className="text-xs text-neutral-500">{r.note}</div> : null}
                              </div>
                            </TableCell>
                            <TableCell>{r.plot?.name ?? `#${r.plot_id}`}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {rec === null ? "—" : <>{fmtNum(rec)} L<span className="volume-bar recommended" aria-hidden="true"><i style={{ width: `${Math.max(0, rec) / Math.max(rec, apl, 1) * 100}%` }} /></span></>}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              <strong className="font-semibold">{fmtNum(apl)} L</strong>
                              <span className="volume-bar" aria-hidden="true"><i style={{ width: `${Math.max(0, apl) / Math.max(rec ?? 0, apl, 1) * 100}%` }} /></span>
                            </TableCell>
                            <TableCell>
                              {desv === null ? (
                                "—"
                              ) : (
                                <Badge variant={desvioVariant(desvioTone(desv))}>
                                  {desv > 0 ? "+" : ""}
                                  {fmtNum(desv)} L
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={r.status === "activo" ? "success" : r.status === "anulado" ? "destructive" : "secondary"}>
                                {r.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {r.status === "activo" ? (
                                <span className="flex flex-wrap gap-1.5">
                                  <Button variant="outline" size="sm" onClick={() => { setCorrecting(r); setCApplied(String(r.applied_liters)); setCMotivo(""); }}>
                                    Corregir
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => { setVoiding(r); setVMotivo(""); setConfirmVoid(false); }}
                                    className="border-danger-100 text-danger-600 hover:bg-danger-50 hover:text-danger-600"
                                  >
                                    Anular
                                  </Button>
                                </span>
                              ) : (
                                <span className="text-xs text-neutral-500">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
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
        </>
      )}

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o && !saving) setOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anotar riego</DialogTitle>
            <DialogDescription>Registra el agua que realmente aplicaste.</DialogDescription>
          </DialogHeader>
          <form id="riego-form" onSubmit={(e) => void onCreate(e)} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Parcela" required htmlFor="rg-plot" error={fieldErrors.plot_id?.[0]}>
                <select id="rg-plot" className={SELECT_CLS} value={fPlot} onChange={(e) => setFPlot(e.target.value)}>
                  <option value="">Selecciona…</option>
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Fecha del riego" required htmlFor="rg-at" hint="Día/mes/año, hora:minuto · ej. 12/09/2026 06:30" error={fieldErrors.occurred_at?.[0]}>
                <Input id="rg-at" type="datetime-local" max={nowLocalInput()} value={fAt} onChange={(e) => setFAt(e.target.value)} />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Agua aplicada (L)" required htmlFor="rg-apl" error={fieldErrors.applied_liters?.[0]}>
                <Input id="rg-apl" inputMode="decimal" placeholder="Ej. 4800" value={fApplied} onChange={(e) => setFApplied(e.target.value)} />
              </FormField>
              <FormField label="Recomendada (L, opcional)" htmlFor="rg-rec" error={fieldErrors.recommended_liters?.[0]}>
                <Input id="rg-rec" inputMode="decimal" placeholder="Ej. 4650" value={fRecommended} onChange={(e) => setFRecommended(e.target.value)} />
              </FormField>
            </div>
            <FormField label="Nota (opcional)" htmlFor="rg-note" error={fieldErrors.note?.[0]}>
              <Input id="rg-note" placeholder="Riego de prueba" value={fNote} onChange={(e) => setFNote(e.target.value)} />
            </FormField>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button disabled={saving} onClick={() => submitForm("riego-form")}>
              {saving ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Guardar
                </>
              ) : (
                <>Guardar</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={correcting !== null}
        onOpenChange={(o) => {
          if (!o && !busy) setCorrecting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{correcting ? `Corregir riego #${correcting.id}` : "Corregir riego"}</DialogTitle>
            <DialogDescription>Se crea un registro nuevo; el anterior queda como «corregido».</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <FormField label="Agua aplicada corregida (L)" required htmlFor="rg-cap">
              <Input id="rg-cap" inputMode="decimal" value={cApplied} onChange={(e) => setCApplied(e.target.value)} />
            </FormField>
            <FormField label="Motivo" hint="Queda en la auditoría." required htmlFor="rg-cmo">
              <Input id="rg-cmo" placeholder="Medí mal el contador" value={cMotivo} onChange={(e) => setCMotivo(e.target.value)} />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrecting(null)} disabled={busy}>
              Cancelar
            </Button>
            <Button disabled={busy} onClick={() => void onCorrect()}>
              {busy ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Guardar corrección
                </>
              ) : (
                <>Guardar corrección</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={voiding !== null && !confirmVoid}
        onOpenChange={(o) => {
          if (!o && !busy) setVoiding(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{voiding ? `Anular riego #${voiding.id}` : "Anular riego"}</DialogTitle>
            <DialogDescription>Escribe el motivo y confirma en el siguiente paso. No se puede deshacer.</DialogDescription>
          </DialogHeader>
          <FormField label="Motivo de anulación" required htmlFor="rg-vmo" hint="Quedará en la auditoría junto al registro.">
            <Input id="rg-vmo" placeholder="No se regó" value={vMotivo} onChange={(e) => setVMotivo(e.target.value)} />
          </FormField>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoiding(null)} disabled={busy}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={vMotivo.trim() === ""}
              onClick={() => {
                if (vMotivo.trim() === "") return;
                setConfirmVoid(true);
              }}
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {voiding && confirmVoid ? (
        <Confirm
          title={`Anular riego #${voiding.id}`}
          body={`Quedará marcado como anulado con el motivo “${vMotivo.trim()}”. No se puede deshacer.`}
          confirmLabel="Anular registro"
          busy={busy}
          onConfirm={() => void onVoid()}
          onCancel={() => setConfirmVoid(false)}
        />
      ) : null}
    </div>
  );
}
