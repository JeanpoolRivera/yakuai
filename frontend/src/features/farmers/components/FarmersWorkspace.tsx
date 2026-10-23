import { PageHead } from "@/components/shadcn/page-head";
import { Badge } from "@/components/shadcn/badge";
import { Banner, Empty, Loading } from "@/components/shadcn/feedback";
import { Button } from "@/components/shadcn/button";
import { Avatar, AvatarFallback } from "@/components/shadcn/avatar";
import { DataTable } from "@/components/shadcn/data-table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { PaginationControls } from "@/components/shadcn/PaginationControls";
import { SearchInput } from "@/components/shadcn/search-input";
import { FormField } from "@/components/forms/FormField";
import { useCollection } from "@/hooks/useCollection";
import { fmtNum } from '@/lib/format';
import { submitForm } from '@/lib/dom';
import { useFarmers, useFarmerForm } from '../hooks/useFarmers';
import { FARMERS_COPY as C } from '../copy';
import { twoInitials, waLink } from '../utils';
const SELECT_CLS = "h-12 w-full rounded-sm border border-neutral-400 bg-white px-3 text-sm text-neutral-800 transition-all hover:border-primary-600 focus-visible:border-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15 disabled:cursor-not-allowed disabled:opacity-50";
export function FarmersWorkspace(): React.JSX.Element {
  const { farmers, loading, error, load } = useFarmers();
  const form = useFarmerForm();
  const { state, openCreate, openEdit, close, submit } = form;
  const coll = useCollection(farmers, {
    perPage: 8,
    search: (f, q) => `${f.name} ${f.phone ?? ""}`.toLowerCase().includes(q),
    sort: (a, b) => b.id - a.id,
  });
  return (
    <div>
      <PageHead eyebrow={C.eyebrow} title={C.title} desc={C.description} crumbs={C.crumbs} actions={
        <Button onClick={openCreate}><span className="h-4 w-4" aria-hidden="true">+</span> {C.registerButton}</Button>
      } />
      {loading ? (
        <Loading text={C.loading} />
      ) : error ? (
        <Banner kind="bad">{error} <Button variant="link" size="sm" onClick={() => void load()}>{C.retry}</Button></Banner>
      ) : (
        <section aria-label="Lista de agricultores" className="grid gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-primary-700">{C.directoryTitle}</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-neutral-800">{C.directoryDesc}</h2>
              <p className="mt-1 text-sm text-neutral-600">{C.directorySub}</p>
            </div>
            <p className="shrink-0 text-sm text-neutral-600">
              <strong className="font-semibold tabular-nums text-neutral-800">{fmtNum(farmers.length)}</strong> {C.registered}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput value={coll.query} onChange={coll.setQuery} placeholder={C.search} label={C.searchLabel} className="min-w-[200px] flex-1" />
            <span className="text-xs text-neutral-500">{coll.total} {coll.total === 1 ? "agricultor" : "agricultores"}</span>
          </div>
          {coll.total === 0 ? (
            <Empty icon={<span className="h-5 w-5" />} title={coll.query ? C.noMatch : C.noFarmers} hint={coll.query ? C.noMatchHint : C.noFarmersHint} action={coll.query ? undefined : <Button onClick={openCreate}><span className="h-4 w-4" aria-hidden="true">+</span> {C.registerButton}</Button>} />
          ) : (
            <>
              <DataTable mobileCards label="Directorio de agricultores" rows={coll.items} rowKey={(f) => f.id} columns={[
                { key: "name", label: C.nameLabel, render: (f) => (
                  <span className="flex items-center gap-2.5">
                    <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary-100 text-xs font-semibold text-primary-800">{twoInitials(f.name)}</AvatarFallback></Avatar>
                    <span><strong className="block font-semibold">{f.name}</strong><small className="block text-xs text-neutral-500">Registro #{f.id}</small></span>
                  </span>
                )},
                { key: "phone", label: C.phoneLabel, render: (f) => <span className="text-neutral-500">{f.phone || C.noPhone}</span> },
                { key: "plots", label: C.plotsLabel, numeric: true, render: (f) => <Badge variant="secondary" className="tabular-nums">{fmtNum(f.plots_count ?? 0)}</Badge> },
                { key: "status", label: C.statusLabel, render: (f) => <Badge variant={f.is_active ? "success" : "secondary"}>{f.is_active ? C.activeLabel : C.inactiveLabel}</Badge> },
                { key: "actions", label: C.actionsLabel, render: (f) => (
                  <span className="flex flex-wrap gap-1.5">
                    {f.phone ? <Button variant="ghost" size="sm" asChild><a href={waLink(f.phone)} target="_blank" rel="noreferrer" aria-label={C.waOpen(f.name)}>WhatsApp <span className="h-3.5 w-3.5" aria-hidden="true">↗</span></a></Button> : null}
                    <Button variant="outline" size="sm" onClick={() => openEdit(f)} aria-label={C.editAria(f.name)}><span className="h-[15px] w-[15px]" aria-hidden="true">✎</span> {C.editLabel}</Button>
                  </span>
                )},
              ]} />
              <PaginationControls page={coll.page} pages={coll.pages} onPageChange={coll.setPage} count={`${coll.total} ${C.inTotal}`} />
            </>
          )}
        </section>
      )}
      <Dialog open={state.open} onOpenChange={(o) => { if (!o && !state.saving) close(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{state.editing ? C.editTitle : C.registerTitle}</DialogTitle>
            <DialogDescription>{C.formDesc}</DialogDescription>
          </DialogHeader>
          <form id="farmer-form" onSubmit={(e) => { e.preventDefault(); void submit(load); }} className="grid gap-4">
            <FormField label="Nombre completo" required htmlFor="fa-name" error={state.fieldErrors.name?.[0]}>
              <Input id="fa-name" placeholder={C.namePlaceholder} value={state.name} aria-invalid={Boolean(state.fieldErrors.name)} onChange={(e) => form.setState((s) => ({ ...s, name: e.target.value }))} />
            </FormField>
            <FormField label="Teléfono (opcional)" hint={C.phoneHint} htmlFor="fa-phone" error={state.fieldErrors.phone?.[0]}>
              <Input id="fa-phone" inputMode="tel" placeholder={C.phonePlaceholder} value={state.phone} aria-invalid={Boolean(state.fieldErrors.phone)} onChange={(e) => form.setState((s) => ({ ...s, phone: e.target.value }))} />
            </FormField>
            <FormField label={C.statusLabel} htmlFor="fa-active">
              <select id="fa-active" className={SELECT_CLS} value={state.active ? "activo" : "inactivo"} onChange={(e) => form.setState((s) => ({ ...s, active: e.target.value === "activo" }))}>
                <option value="activo">{C.activeLabel}</option>
                <option value="inactivo">{C.inactiveLabel}</option>
              </select>
            </FormField>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={state.saving}>{C.cancel}</Button>
            <Button disabled={state.saving} onClick={() => submitForm("farmer-form")}>
              {state.saving ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" /> {state.editing ? C.savingEdit : C.savingRegister}</> : <>{state.editing ? C.save : C.register}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
