/* Riegos: anotar aplicado, comparar con recomendado, corregir/anular con motivo. */
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ApiError, friendlyError } from "../api/client";
import {
  correctIrrigation,
  createIrrigation,
  listIrrigations,
  listPlots,
  voidIrrigation,
} from "../api/endpoints";
import type { Irrigation, Plot } from "../api/types";
import {
  Badge,
  Banner,
  Button,
  Confirm,
  Empty,
  Field,
  Loading,
  Modal,
  PageHead,
  Pager,
  SearchInput,
  SelectInput,
  Stat,
  TextInput,
} from "../components/ui";
import { useCollection } from "../hooks/useCollection";
import { submitForm } from "../lib/dom";
import { fmtDateTime, fmtNum, localInputToIso, nowLocalInput, toNum } from "../lib/format";
import { toastError, toastOk } from "../lib/toast";

function desvioTone(desv: number): string {
  if (Math.abs(desv) <= 100) return "ok";
  return desv > 0 ? "warn" : "bad";
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
    <div className="page ops-page">
      <PageHead
        eyebrow="Historial"
        title="Riegos aplicados"
        desc="Registra el agua aplicada y compárala con la recomendación de cada parcela."
        crumbs="YakuAI / Riegos"
        actions={<Button onClick={openCreate}>Anotar riego</Button>}
      />

      {loading ? (
        <Loading text="Cargando riegos…" />
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
            <Stat value={fmtNum(activos.length)} label="Riegos activos" icon="drop" sub="Registros válidos en el historial" />
            <Stat value={`${fmtNum(totalAgua)} L`} label="Agua total aplicada" icon="gauge" sub="Volumen acumulado de los riegos activos" />
          </div>

          <section className="stack ops-register" aria-label="Historial de riegos">
            <div className="ops-section-head"><div><h2 className="section-title">Registro de aplicaciones</h2><p className="muted small">Recomendación, consumo real y trazabilidad de cada riego.</p></div></div>
            <div className="toolbar">
              <SearchInput
                value={coll.query}
                onChange={coll.setQuery}
                placeholder="Buscar por parcela o nota…"
                label="Buscar riegos"
              />
              <input
                className="input"
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
                className="input"
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
              <span className="tiny">{coll.total} registros</span>
            </div>
            {coll.total === 0 ? (
              <Empty
                icon="drop"
                title={hasFilter ? "Sin coincidencias" : "Aún no hay riegos"}
                hint={hasFilter ? "Prueba con otra búsqueda o período." : "Anota cada riego real para comparar con lo recomendado."}
                action={hasFilter ? undefined : <Button onClick={openCreate}>Anotar riego</Button>}
              />
            ) : (
              <>
                <div className="table-wrap responsive-table" tabIndex={0} role="region" aria-label="Historial de riegos">
                  <table className="tbl" role="table">
                    <caption className="sr-only">Riegos aplicados con recomendada, aplicada, desvío y estado</caption>
                    <thead role="rowgroup">
                      <tr role="row">
                        <th scope="col" role="columnheader">Fecha</th>
                        <th scope="col" role="columnheader">Parcela</th>
                        <th scope="col" role="columnheader">Recomendada</th>
                        <th scope="col" role="columnheader">Aplicada</th>
                        <th scope="col" role="columnheader">Desvío</th>
                        <th scope="col" role="columnheader">Estado</th>
                        <th scope="col" role="columnheader">
                          <span className="tiny">Acciones</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody role="rowgroup">
                      {coll.items.map((r) => {
                        const rec = toNum(r.recommended_liters);
                        const apl = toNum(r.applied_liters) ?? 0;
                        const desv = rec === null ? null : apl - rec;
                        return (
                          <tr role="row" key={r.id}>
                            <td role="cell" data-label="Fecha"><div>
                              <strong>{fmtDateTime(r.occurred_at)}</strong>
                              <div className="tiny">Registro #{r.id}</div>
                              {r.note ? <div className="tiny">{r.note}</div> : null}
                            </div></td>
                            <td role="cell" data-label="Parcela">{r.plot?.name ?? `#${r.plot_id}`}</td>
                            <td role="cell" data-label="Recomendada" className="num">{rec === null ? "—" : `${fmtNum(rec)} L`}</td>
                            <td role="cell" data-label="Aplicada" className="num"><strong>{fmtNum(apl)} L</strong></td>
                            <td role="cell" data-label="Desvío">
                              {desv === null ? (
                                "—"
                              ) : (
                                <Badge tone={desvioTone(desv)}>
                                  {desv > 0 ? "+" : ""}
                                  {fmtNum(desv)} L
                                </Badge>
                              )}
                            </td>
                            <td role="cell" data-label="Estado">
                              <Badge tone={r.status === "activo" ? "activo" : r.status === "anulado" ? "mala" : "vencido"}>
                                {r.status}
                              </Badge>
                            </td>
                            <td role="cell" data-label="Acciones">
                              {r.status === "activo" ? (
                                <span className="rowcard-actions">
                                  <Button variant="outline" size="sm" onClick={() => { setCorrecting(r); setCApplied(String(r.applied_liters)); setCMotivo(""); }}>
                                    Corregir
                                  </Button>
                                  <Button variant="danger-outline" size="sm" onClick={() => { setVoiding(r); setVMotivo(""); setConfirmVoid(false); }}>
                                    Anular
                                  </Button>
                                </span>
                              ) : (
                                <span className="tiny">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pager page={coll.page} pages={coll.pages} onPage={coll.setPage} count={`${coll.total} en total`} />
              </>
            )}
          </section>
        </>
      )}

      {open ? (
        <Modal title="Anotar riego" sub="Registra el agua que realmente aplicaste." onClose={() => setOpen(false)} busy={saving}
          foot={
            <>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button loading={saving} onClick={() => submitForm("riego-form")}>
                Guardar
              </Button>
            </>
          }
        >
          <form className="ops-irrigation-form" id="riego-form" onSubmit={(e) => void onCreate(e)}>
            <div className="form-grid">
              <Field label="Parcela" required htmlFor="rg-plot" error={fieldErrors.plot_id?.[0]}>
                <SelectInput id="rg-plot" value={fPlot} onChange={(e) => setFPlot(e.target.value)}>
                  <option value="">Selecciona…</option>
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Fecha del riego" required htmlFor="rg-at" hint="Día/mes/año, hora:minuto · ej. 12/09/2026 06:30" error={fieldErrors.occurred_at?.[0]}>
                <TextInput id="rg-at" type="datetime-local" max={nowLocalInput()} value={fAt} onChange={(e) => setFAt(e.target.value)} />
              </Field>
            </div>
            <div className="form-grid">
              <Field label="Agua aplicada (L)" required htmlFor="rg-apl" error={fieldErrors.applied_liters?.[0]}>
                <TextInput id="rg-apl" inputMode="decimal" placeholder="Ej. 4800" value={fApplied} onChange={(e) => setFApplied(e.target.value)} />
              </Field>
              <Field label="Recomendada (L, opcional)" htmlFor="rg-rec" error={fieldErrors.recommended_liters?.[0]}>
                <TextInput id="rg-rec" inputMode="decimal" placeholder="Ej. 4650" value={fRecommended} onChange={(e) => setFRecommended(e.target.value)} />
              </Field>
            </div>
            <Field label="Nota (opcional)" htmlFor="rg-note" error={fieldErrors.note?.[0]}>
              <TextInput id="rg-note" placeholder="Riego de prueba" value={fNote} onChange={(e) => setFNote(e.target.value)} />
            </Field>
          </form>
        </Modal>
      ) : null}

      {correcting ? (
        <Modal title={`Corregir riego #${correcting.id}`} sub="Se crea un registro nuevo; el anterior queda como «corregido»." onClose={() => setCorrecting(null)} busy={busy}
          foot={
            <>
              <Button variant="outline" onClick={() => setCorrecting(null)} disabled={busy}>
                Cancelar
              </Button>
              <Button loading={busy} onClick={() => void onCorrect()}>
                Guardar corrección
              </Button>
            </>
          }
        >
          <Field label="Agua aplicada corregida (L)" required htmlFor="rg-cap">
            <TextInput id="rg-cap" inputMode="decimal" value={cApplied} onChange={(e) => setCApplied(e.target.value)} />
          </Field>
          <Field label="Motivo" hint="Queda en la auditoría." required htmlFor="rg-cmo">
            <TextInput id="rg-cmo" placeholder="Medí mal el contador" value={cMotivo} onChange={(e) => setCMotivo(e.target.value)} />
          </Field>
        </Modal>
      ) : null}

      {voiding && !confirmVoid ? (
        <Modal
          title={`Anular riego #${voiding.id}`}
          sub="Escribe el motivo y confirma en el siguiente paso. No se puede deshacer."
          onClose={() => setVoiding(null)}
          busy={busy}
          foot={
            <>
              <Button variant="outline" onClick={() => setVoiding(null)} disabled={busy}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                disabled={vMotivo.trim() === ""}
                onClick={() => {
                  if (vMotivo.trim() === "") return;
                  setConfirmVoid(true);
                }}
              >
                Continuar
              </Button>
            </>
          }
        >
          <Field label="Motivo de anulación" required htmlFor="rg-vmo" hint="Quedará en la auditoría junto al registro.">
            <TextInput id="rg-vmo" placeholder="No se regó" value={vMotivo} onChange={(e) => setVMotivo(e.target.value)} />
          </Field>
        </Modal>
      ) : null}

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
