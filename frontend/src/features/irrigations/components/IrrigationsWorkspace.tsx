import { useMemo, useState } from "react";
import { Droplets, FilePlus2, Filter, Search, X } from "lucide-react";
import { pageCopy, statusLabel, STATUS_ORDER, STATUS_FILTER_LABEL, PERIOD_LABEL, deviationIcon, deviationLabel, originLabel, EMPTY_FILTERED_TITLE, EMPTY_FILTERED_HINT, NO_PLOTS, FORM_TITLE, FORM_HINT } from "../copy";
import { deviationFor, deviationLevel } from "../utils";
import type { Irrigation } from "@/api/types";
import type { UseIrrigationsResult } from "../hooks/useIrrigations";
import type { UseIrrigationFiltersResult } from "../hooks/useIrrigationFilters";
import type { IrrigationMutationsResult } from "../hooks/useIrrigationMutations";
import { PageHeading, Metric, StatusBadge, EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/workspace/WorkspaceKit";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { GuardedInput } from "@/components/forms/GuardedInput";
import { SearchInput } from "@/components/shadcn/search-input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/shadcn/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { fmtDateTime, fmtNum, nowLocalInput } from "@/lib/format";

type DialogMode = "create" | "detail" | "correct" | "annul" | null;

export function IrrigationsWorkspace({ isStaff, irrigations, filters, mutations }: { isStaff: boolean; irrigations: UseIrrigationsResult; filters: UseIrrigationFiltersResult; mutations: IrrigationMutationsResult }): React.JSX.Element {
  const copy = pageCopy(isStaff);
  const [mode, setMode] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<Irrigation | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const [plotId, setPlotId] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  const [applied, setApplied] = useState("");
  const [recommended, setRecommended] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});


  const rows = useMemo(() => filters.filtered.slice(0, visibleCount), [filters.filtered, visibleCount]);
  const fieldError = (key: string): string | undefined => localErrors[key] ?? mutations.fieldErrors[key]?.[0];
  function clearFieldErrors(): void { setLocalErrors({}); mutations.clearFieldErrors(); }

  function openCreate(): void {
    setPlotId(irrigations.plots[0] ? String(irrigations.plots[0].id) : "");
    setOccurredAt(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    setApplied(""); setRecommended(""); setNote(""); clearFieldErrors(); setMode("create");
  }
  function openDetail(item: Irrigation): void { setSelected(item); setMode("detail"); setReason(""); }
  function close(): void { setMode(null); setSelected(null); clearFieldErrors(); }
  async function submitCreate(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const errors: Record<string, string> = {};
    const occurredDate = new Date(occurredAt);
    const appliedValue = Number(applied);
    const recommendedValue = recommended.trim() ? Number(recommended) : null;
    if (!plotId) errors.plot_id = "Selecciona una parcela.";
    if (!occurredAt || !Number.isFinite(occurredDate.getTime()) || occurredDate.getTime() > Date.now()) errors.occurred_at = "Usa una fecha válida que no sea futura.";
    if (!applied.trim() || !Number.isFinite(appliedValue) || appliedValue <= 0 || appliedValue > 99999999.99 || Math.round(appliedValue * 100) !== appliedValue * 100) errors.applied_liters = "Litros: mayor que 0 y hasta 2 decimales.";
    if (recommendedValue !== null && (!Number.isFinite(recommendedValue) || recommendedValue < 0 || recommendedValue > 99999999.99 || Math.round(recommendedValue * 100) !== recommendedValue * 100)) errors.recommended_liters = "Litros recomendados: 0–99 999 999,99; máximo 2 decimales.";
    if (note.length > 255) errors.note = "Nota: máximo 255 caracteres.";
    setLocalErrors(errors);
    if (Object.keys(errors).length) return;
    const ok = await mutations.create({ plot_id: Number(plotId), occurred_at: occurredDate.toISOString().slice(0, 19), applied_liters: appliedValue, recommended_liters: recommendedValue, note: note.trim() || undefined });
    if (ok) close();
  }
  async function submitCorrect(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const value = Number(applied);
    const errors: Record<string, string> = {};
    if (!applied.trim() || !Number.isFinite(value) || value <= 0 || value > 99999999.99 || Math.round(value * 100) !== value * 100) errors.applied_liters = "Litros: mayor que 0 y hasta 2 decimales.";
    if (!reason.trim()) errors.motivo = "Escribe un motivo.";
    if (reason.trim().length > 255) errors.motivo = "Motivo: máximo 255 caracteres.";
    setLocalErrors(errors);
    if (Object.keys(errors).length || !selected) return;
    if (await mutations.correct(selected.id, value, reason.trim())) close();
  }
  async function submitAnnul(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!selected) return;
    const errors = reason.trim() ? {} : { motivo: "Escribe un motivo." };
    setLocalErrors(errors);
    if (Object.keys(errors).length) return;
    if (await mutations.annul(selected.id, reason.trim())) close();
  }
  return <div className="space-y-6">
    <PageHeading eyebrow={copy.eyebrow} title={copy.title} description={copy.description} action={<Button onClick={openCreate} disabled={irrigations.plots.length === 0}><FilePlus2 size={16} aria-hidden="true" />{copy.cta}</Button>} />
    {irrigations.error ? <ErrorBlock message={irrigations.error} retry={() => void irrigations.reload()} /> : null}
    {irrigations.loading ? <LoadingBlock label="Cargando historial de riego…" /> : <>
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Resumen de riegos">
        <Metric label="Riegos vigentes" value={fmtNum(filters.summary.activeCount)} detail={`${filters.counts.corregido} corregidos · ${filters.counts.anulado} anulados`} icon={<Droplets size={17} />} tone="brand" />
        <Metric label="Agua aplicada" value={`${fmtNum(filters.summary.appliedLiters)} L`} detail="Solo registros vigentes" icon={<Droplets size={17} />} />
        <Metric label="Agua recomendada" value={`${fmtNum(filters.summary.recommendedLiters)} L`} detail={`${filters.summary.withRecommendation} con recomendación`} icon={<Filter size={17} />} />
        <Metric label="Diferencia" value={filters.summary.deviation === null ? "—" : `${filters.summary.deviation > 0 ? "+" : ""}${fmtNum(filters.summary.deviation)} L`} detail={filters.summary.deviation === null ? "Sin recomendaciones para comparar" : deviationLabel(filters.summary.level)} tone={filters.summary.level === "over" ? "warning" : filters.summary.level === "under" ? "danger" : "default"} />
      </section>

      <Card className="space-y-4 rounded-xl p-4 sm:p-5">
        <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-700"><Search size={17} aria-hidden="true" /></span><div><h2 className="font-semibold text-neutral-900">Buscar y filtrar</h2><p className="mt-1 text-sm text-neutral-600">Acota el historial por parcela, fecha o estado.</p></div></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(14rem,1.4fr)_repeat(4,minmax(8rem,1fr))_auto]">
          <div className="self-end"><SearchInput value={filters.filters.query} onChange={(query) => filters.update({ query })} placeholder={copy.searchPlaceholder} label="Buscar riegos por parcela o nota" /></div>
          <label className="grid gap-1 text-xs font-medium text-neutral-700">Estado<select value={filters.filters.status} onChange={(e) => filters.update({ status: e.target.value as typeof filters.filters.status })} className="min-h-12 rounded-md border border-neutral-300 bg-white px-3 text-sm"><option value="todos">Todos los estados</option>{STATUS_ORDER.filter((s) => s !== "todos").map((s) => <option value={s} key={s}>{STATUS_FILTER_LABEL[s]}</option>)}</select></label>
          <label className="grid gap-1 text-xs font-medium text-neutral-700">Período<select value={filters.filters.period} onChange={(e) => filters.update({ period: e.target.value as typeof filters.filters.period, from: null, to: null })} className="min-h-12 rounded-md border border-neutral-300 bg-white px-3 text-sm">{Object.entries(PERIOD_LABEL).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label className="grid gap-1 text-xs font-medium text-neutral-700">Parcela<select value={filters.filters.plotId ?? ""} onChange={(e) => filters.update({ plotId: e.target.value ? Number(e.target.value) : null })} className="min-h-12 rounded-md border border-neutral-300 bg-white px-3 text-sm"><option value="">Todas</option>{irrigations.plots.map((plot) => <option key={plot.id} value={plot.id}>{plot.name}</option>)}</select></label>
          <label className="grid gap-1 text-xs font-medium text-neutral-700">Desde<input type="date" max={filters.filters.to ?? undefined} value={filters.filters.from ?? ""} onChange={(e) => filters.update({ from: e.target.value || null })} className="min-h-12 rounded-md border border-neutral-300 bg-white px-3 text-sm" /></label>
          <Button variant="ghost" onClick={() => { filters.reset(); setVisibleCount(20); }} className="sm:col-span-2 xl:col-span-1"><X size={15} aria-hidden="true" />Limpiar</Button>
        </div>
        {filters.filters.from ? <label className="inline-flex items-center gap-2 text-sm text-neutral-700">Hasta<input type="date" min={filters.filters.from ?? undefined} value={filters.filters.to ?? ""} onChange={(e) => filters.update({ to: e.target.value || null })} className="min-h-10 rounded-md border border-neutral-300 bg-white px-2" /></label> : null}
        <div className="flex items-center justify-between border-t border-neutral-200 pt-3 text-xs text-neutral-500"><span>{filters.total} registros</span>{filters.hasFilters ? <Button variant="link" size="sm" onClick={filters.reset}>Quitar filtros</Button> : null}</div>
      </Card>

      {!irrigations.plots.length && !irrigations.items.length ? <EmptyBlock title="No hay parcelas disponibles" description={NO_PLOTS} /> : !filters.filtered.length ? <EmptyBlock title={filters.hasFilters ? EMPTY_FILTERED_TITLE : copy.emptyTitle} description={filters.hasFilters ? EMPTY_FILTERED_HINT : copy.emptyHint} action={!filters.hasFilters && irrigations.plots.length ? <Button onClick={openCreate}>{copy.cta}</Button> : undefined} /> : <>
        <section aria-label="Historial detallado" className="space-y-3">
          <div className="flex items-end justify-between gap-3"><div><h2 className="text-base font-semibold text-neutral-900">Registros de riego</h2><p className="mt-1 text-sm text-neutral-600">Los datos corregidos o anulados quedan en la trazabilidad.</p></div><span className="text-xs text-neutral-500">{rows.length} de {filters.total}</span></div>
          <Card className="hidden overflow-hidden rounded-xl md:block"><Table><caption className="sr-only">Historial de riegos con fecha, parcela, litros, diferencia y estado</caption><TableHeader className="bg-neutral-50"><TableRow><TableHead>Fecha</TableHead><TableHead>Parcela</TableHead><TableHead className="text-right">Recomendado</TableHead><TableHead className="text-right">Aplicado</TableHead><TableHead>Diferencia</TableHead><TableHead>Estado</TableHead><TableHead><span className="sr-only">Acciones</span></TableHead></TableRow></TableHeader><TableBody>{rows.map((item) => { const deviation = deviationFor(item); const level = deviationLevel(item); return <TableRow key={item.id}><TableCell className="whitespace-nowrap text-sm text-neutral-700">{fmtDateTime(item.occurred_at)}</TableCell><TableCell className="font-medium text-neutral-900">{item.plot?.name ?? `Parcela #${item.plot_id}`}</TableCell><TableCell className="text-right tabular-nums">{item.recommended_liters === null ? "—" : `${fmtNum(item.recommended_liters)} L`}</TableCell><TableCell className="text-right font-semibold tabular-nums">{fmtNum(item.applied_liters)} L</TableCell><TableCell className="whitespace-nowrap"><span className={level === "over" ? "text-warning-800" : level === "under" ? "text-danger-700" : "text-neutral-600"}>{deviationIcon(level)} {deviation === null ? "—" : `${deviation > 0 ? "+" : ""}${fmtNum(deviation)} L`}</span></TableCell><TableCell><StatusBadge value={item.status} label={statusLabel(item.status)} /></TableCell><TableCell><Button variant="ghost" size="sm" aria-label={`Abrir registro de ${item.plot?.name ?? item.plot_id} del ${fmtDateTime(item.occurred_at)}`} onClick={() => openDetail(item)}>Ver</Button></TableCell></TableRow>; })}</TableBody></Table></Card>
          <div className="grid gap-3 md:hidden">{rows.map((item) => { const deviation = deviationFor(item); const level = deviationLevel(item); return <Card key={item.id} className="rounded-xl p-4"><button type="button" className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40" aria-label={`Abrir registro de ${item.plot?.name ?? item.plot_id} del ${fmtDateTime(item.occurred_at)}`} onClick={() => openDetail(item)}><div className="flex items-start justify-between gap-2"><div><p className="font-semibold text-neutral-900">{item.plot?.name ?? `Parcela #${item.plot_id}`}</p><p className="mt-1 text-xs text-neutral-500">{fmtDateTime(item.occurred_at)}</p></div><StatusBadge value={item.status} label={statusLabel(item.status)} /></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-neutral-500">Aplicado</p><p className="mt-0.5 font-semibold tabular-nums text-neutral-900">{fmtNum(item.applied_liters)} L</p></div><div><p className="text-xs text-neutral-500">Recomendado</p><p className="mt-0.5 tabular-nums text-neutral-800">{item.recommended_liters === null ? "—" : `${fmtNum(item.recommended_liters)} L`}</p></div></div><p className="mt-3 text-xs text-neutral-600">Diferencia: {deviation === null ? "Sin referencia" : `${deviationIcon(level)} ${deviation > 0 ? "+" : ""}${fmtNum(deviation)} L · ${deviationLabel(level)}`}</p></button></Card>; })}</div>
        </section>
        {filters.total > visibleCount ? <div className="text-center"><Button variant="outline" onClick={() => setVisibleCount((n) => n + 20)}>Ver {Math.min(20, filters.total - visibleCount)} registros anteriores</Button></div> : null}
      </>}
    </>}

    <Dialog open={mode !== null} onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        {mode === "create" ? <><DialogHeader><DialogTitle>{FORM_TITLE.create}</DialogTitle><DialogDescription>{FORM_HINT.create}</DialogDescription></DialogHeader><form noValidate onSubmit={(event) => void submitCreate(event)} className="space-y-4">
          <label className="grid gap-1.5 text-sm font-medium text-neutral-800">Parcela<select required aria-invalid={Boolean(fieldError("plot_id"))} aria-describedby={fieldError("plot_id") ? "irrigation-plot-error" : undefined} value={plotId} onChange={(e) => { setPlotId(e.target.value); clearFieldErrors(); }} className="min-h-12 rounded-md border border-neutral-300 bg-white px-3"><option value="" disabled>Selecciona una parcela</option>{irrigations.plots.map((plot) => <option value={plot.id} key={plot.id}>{plot.name}</option>)}</select>{fieldError("plot_id") ? <span id="irrigation-plot-error" className="validation-message" role="alert">{fieldError("plot_id")}</span> : null}</label>
          <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium text-neutral-800">Fecha y hora<input required type="datetime-local" max={nowLocalInput()} aria-invalid={Boolean(fieldError("occurred_at"))} aria-describedby={fieldError("occurred_at") ? "irrigation-date-error" : undefined} value={occurredAt} onChange={(e) => { setOccurredAt(e.target.value); clearFieldErrors(); }} className="min-h-12 rounded-md border border-neutral-300 px-3" />{fieldError("occurred_at") ? <span id="irrigation-date-error" className="validation-message" role="alert">{fieldError("occurred_at")}</span> : null}</label><label className="grid gap-1.5 text-sm font-medium text-neutral-800">Agua aplicada (L)<GuardedInput guardMode="decimal" maxDecimals={2} required value={applied} onValueChange={(value) => { setApplied(value); clearFieldErrors(); }} aria-invalid={Boolean(fieldError("applied_liters"))} aria-describedby={fieldError("applied_liters") ? "irrigation-applied-error" : undefined} />{fieldError("applied_liters") ? <span id="irrigation-applied-error" className="validation-message" role="alert">{fieldError("applied_liters")}</span> : null}</label></div>
          <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium text-neutral-800">Recomendado (L)<GuardedInput guardMode="decimal" maxDecimals={2} value={recommended} onValueChange={(value) => { setRecommended(value); clearFieldErrors(); }} aria-invalid={Boolean(fieldError("recommended_liters"))} aria-describedby={fieldError("recommended_liters") ? "irrigation-recommended-error" : undefined} />{fieldError("recommended_liters") ? <span id="irrigation-recommended-error" className="validation-message" role="alert">{fieldError("recommended_liters")}</span> : null}</label><label className="grid gap-1.5 text-sm font-medium text-neutral-800">Nota (opcional)<GuardedInput guardMode="text" value={note} onValueChange={(value) => { setNote(value); clearFieldErrors(); }} maxLength={255} aria-invalid={Boolean(fieldError("note"))} aria-describedby={fieldError("note") ? "irrigation-note-error" : undefined} />{fieldError("note") ? <span id="irrigation-note-error" className="validation-message" role="alert">{fieldError("note")}</span> : null}</label></div>
          <DialogFooter><Button type="button" variant="outline" onClick={close}>Cancelar</Button><Button type="submit" loading={mutations.busy}>Guardar riego</Button></DialogFooter>
        </form></> : null}
        {mode === "detail" && selected ? <><DialogHeader><DialogTitle>Detalle del riego</DialogTitle><DialogDescription>{selected.plot?.name ?? `Parcela #${selected.plot_id}`} · {fmtDateTime(selected.occurred_at)}</DialogDescription></DialogHeader><div className="grid grid-cols-2 gap-3 rounded-lg bg-neutral-50 p-4 text-sm"><div><p className="text-xs text-neutral-500">Aplicado</p><p className="mt-1 font-semibold tabular-nums">{fmtNum(selected.applied_liters)} L</p></div><div><p className="text-xs text-neutral-500">Recomendado</p><p className="mt-1 font-semibold tabular-nums">{selected.recommended_liters === null ? "—" : `${fmtNum(selected.recommended_liters)} L`}</p></div><div><p className="text-xs text-neutral-500">Estado</p><div className="mt-1"><StatusBadge value={selected.status} label={statusLabel(selected.status)} /></div></div><div><p className="text-xs text-neutral-500">Origen</p><p className="mt-1">{originLabel(selected.origin)}</p></div>{selected.note ? <p className="col-span-2 text-neutral-700">{selected.note}</p> : null}</div><DialogFooter className="flex-wrap"><Button variant="outline" onClick={close}>Cerrar</Button>{selected.status === "activo" ? <><Button variant="outline" onClick={() => { setApplied(String(Number(selected.applied_liters))); setReason(""); setMode("correct"); }}>Corregir</Button><Button variant="danger" onClick={() => { setReason(""); setMode("annul"); }}>Anular</Button></> : null}</DialogFooter></> : null}
        {mode === "correct" && selected ? <><DialogHeader><DialogTitle>{FORM_TITLE.correct}</DialogTitle><DialogDescription>{FORM_HINT.correct}</DialogDescription></DialogHeader><form noValidate onSubmit={(event) => void submitCorrect(event)} className="space-y-4"><label className="grid gap-1.5 text-sm font-medium text-neutral-800">Cantidad aplicada correcta (L)<GuardedInput guardMode="decimal" maxDecimals={2} required value={applied} onValueChange={(value) => { setApplied(value); clearFieldErrors(); }} aria-invalid={Boolean(fieldError("applied_liters"))} aria-describedby={fieldError("applied_liters") ? "irrigation-correct-applied-error" : undefined} />{fieldError("applied_liters") ? <span id="irrigation-correct-applied-error" className="validation-message" role="alert">{fieldError("applied_liters")}</span> : null}</label><label className="grid gap-1.5 text-sm font-medium text-neutral-800">Motivo de la corrección<GuardedInput guardMode="text" required maxLength={255} value={reason} onValueChange={(value) => { setReason(value); clearFieldErrors(); }} aria-invalid={Boolean(fieldError("motivo"))} aria-describedby={fieldError("motivo") ? "irrigation-reason-error" : undefined} />{fieldError("motivo") ? <span id="irrigation-reason-error" className="validation-message" role="alert">{fieldError("motivo")}</span> : null}</label><DialogFooter><Button type="button" variant="outline" onClick={() => setMode("detail")}>Volver</Button><Button type="submit" loading={mutations.busy}>Guardar corrección</Button></DialogFooter></form></> : null}
        {mode === "annul" && selected ? <><DialogHeader><DialogTitle>{FORM_TITLE.void}</DialogTitle><DialogDescription>{FORM_HINT.void}</DialogDescription></DialogHeader><form noValidate onSubmit={(event) => void submitAnnul(event)} className="space-y-4"><label className="grid gap-1.5 text-sm font-medium text-neutral-800">Motivo de anulación<GuardedInput guardMode="text" required maxLength={255} value={reason} onValueChange={(value) => { setReason(value); clearFieldErrors(); }} aria-invalid={Boolean(fieldError("motivo"))} aria-describedby={fieldError("motivo") ? "irrigation-reason-error" : undefined} />{fieldError("motivo") ? <span id="irrigation-reason-error" className="validation-message" role="alert">{fieldError("motivo")}</span> : null}</label><DialogFooter><Button type="button" variant="outline" onClick={() => setMode("detail")}>Volver</Button><Button type="submit" variant="danger" loading={mutations.busy}>Anular riego</Button></DialogFooter></form></> : null}
      </DialogContent>
    </Dialog>
  </div>;
}










