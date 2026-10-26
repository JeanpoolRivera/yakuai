import { useMemo, useState } from "react";
import { MessageCircle, Pencil, UserRoundPlus, Users } from "lucide-react";
import { useFarmers, useFarmerForm } from "../hooks/useFarmers";
import { FARMERS_COPY as C } from "../copy";
import { PageHeading, Metric, StatusBadge, EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/workspace/WorkspaceKit";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { SearchInput } from "@/components/shadcn/search-input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/shadcn/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";

export function FarmersWorkspace(): React.JSX.Element {
  const { farmers, loading, error, load } = useFarmers();
  const form = useFarmerForm();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("todos");
  const q = query.trim().toLocaleLowerCase("es");
  const visible = useMemo(() => farmers.filter((farmer) => {
    const matches = `${farmer.name} ${farmer.phone ?? ""}`.toLocaleLowerCase("es").includes(q);
    return matches && (status === "todos" || farmer.is_active === (status === "activos"));
  }), [farmers, q, status]);
  const active = farmers.filter((farmer) => farmer.is_active).length;

  function setField<K extends "name" | "phone" | "active">(key: K, value: typeof form.state[K]): void {
    form.setState((previous) => ({ ...previous, [key]: value, fieldErrors: {} }));
  }
  const fieldError = (key: string): string | undefined => form.state.fieldErrors[key]?.[0];

  return <div className="space-y-6">
    <PageHeading eyebrow="Gestión de personas" title={C.title} description={C.description} action={<Button onClick={form.openCreate}><UserRoundPlus size={16} aria-hidden="true" />{C.registerButton}</Button>} />
    {error ? <ErrorBlock message={error} retry={() => void load()} /> : null}
    {loading ? <LoadingBlock label={C.loading} /> : <>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Resumen de agricultores"><Metric label="Personas registradas" value={farmers.length} detail="Directorio de la comunidad" icon={<Users size={17} />} tone="brand" /><Metric label="Activos" value={active} detail="Pueden usar el servicio" /><Metric label="Parcelas vinculadas" value={farmers.reduce((sum, farmer) => sum + (farmer.plots_count ?? farmer.plots?.length ?? 0), 0)} detail="En el directorio" /></section>
      <Card className="space-y-4 rounded-xl p-4 sm:p-5"><div><h2 className="font-semibold text-neutral-900">{C.directoryTitle}</h2><p className="mt-1 text-sm text-neutral-600">{C.directorySub}</p></div><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]"><SearchInput value={query} onChange={setQuery} placeholder={C.search} label={C.searchLabel} /><label className="grid gap-1 text-xs font-medium text-neutral-700">Estado<select value={status} onChange={(e) => setStatus(e.target.value)} className="min-h-12 rounded-md border border-neutral-300 bg-white px-3 text-sm"><option value="todos">Todos</option><option value="activos">Activos</option><option value="inactivos">Inactivos</option></select></label></div><p className="border-t border-neutral-200 pt-3 text-xs text-neutral-500">{visible.length} de {farmers.length} {C.registered}</p></Card>
      {visible.length ? <>
        <Card className="hidden overflow-hidden rounded-xl md:block"><Table><caption className="sr-only">Directorio de agricultores</caption><TableHeader className="bg-neutral-50"><TableRow><TableHead>{C.nameLabel}</TableHead><TableHead>{C.phoneLabel}</TableHead><TableHead>{C.plotsLabel}</TableHead><TableHead>{C.statusLabel}</TableHead><TableHead><span className="sr-only">{C.actionsLabel}</span></TableHead></TableRow></TableHeader><TableBody>{visible.map((farmer) => <TableRow key={farmer.id}><TableCell className="font-semibold text-neutral-900">{farmer.name}</TableCell><TableCell>{farmer.phone ?? C.noPhone}</TableCell><TableCell>{farmer.plots_count ?? farmer.plots?.length ?? 0}</TableCell><TableCell><StatusBadge value={farmer.is_active ? "activa" : "inactivo"} label={farmer.is_active ? C.activeLabel : C.inactiveLabel} /></TableCell><TableCell><div className="flex justify-end gap-1">{farmer.phone ? <Button asChild variant="ghost" size="icon" aria-label={`WhatsApp de ${farmer.name}, abre en otra pestaña`}><a href={`https://wa.me/${farmer.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><MessageCircle size={17} aria-hidden="true" /></a></Button> : null}<Button variant="ghost" size="icon" aria-label={`Editar a ${farmer.name}`} onClick={() => form.openEdit(farmer)}><Pencil size={16} aria-hidden="true" /></Button></div></TableCell></TableRow>)}</TableBody></Table></Card>
        <div className="grid gap-3 md:hidden">{visible.map((farmer) => <Card key={farmer.id} className="rounded-xl p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-neutral-900">{farmer.name}</h3><p className="mt-1 text-sm text-neutral-600">{farmer.phone ?? C.noPhone}</p></div><StatusBadge value={farmer.is_active ? "activa" : "inactivo"} label={farmer.is_active ? C.activeLabel : C.inactiveLabel} /></div><div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-3"><span className="text-sm text-neutral-600">{farmer.plots_count ?? farmer.plots?.length ?? 0} parcelas</span><div className="flex gap-2">{farmer.phone ? <Button asChild variant="outline" size="sm"><a href={`https://wa.me/${farmer.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><MessageCircle size={15} aria-hidden="true" />WhatsApp</a></Button> : null}<Button variant="outline" size="sm" aria-label={`Editar a ${farmer.name}`} onClick={() => form.openEdit(farmer)}><Pencil size={15} aria-hidden="true" />Editar</Button></div></div></Card>)}</div>
      </> : <EmptyBlock title={query || status !== "todos" ? C.noMatch : C.noFarmers} description={query || status !== "todos" ? C.noMatchHint : C.noFarmersHint} action={!query && status === "todos" ? <Button onClick={form.openCreate}>{C.registerButton}</Button> : <Button variant="outline" onClick={() => { setQuery(""); setStatus("todos"); }}>Limpiar filtros</Button>} />}
    </>}
    <Dialog open={form.state.open} onOpenChange={(open) => { if (!open) form.close(); }}>
      <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{form.state.editing ? C.editTitle : C.registerTitle}</DialogTitle><DialogDescription>{C.formDesc}</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <label className="grid gap-1.5 text-sm font-medium text-neutral-800">{C.nameLabel}<Input autoFocus value={form.state.name} maxLength={120} aria-invalid={Boolean(fieldError("name"))} onChange={(e) => setField("name", e.target.value)} placeholder={C.namePlaceholder} />{fieldError("name") ? <span className="text-xs text-danger-700">{fieldError("name")}</span> : null}</label>
          <label className="grid gap-1.5 text-sm font-medium text-neutral-800">{C.phoneLabel}<Input type="tel" autoComplete="tel" value={form.state.phone} maxLength={30} aria-invalid={Boolean(fieldError("phone"))} onChange={(e) => setField("phone", e.target.value)} placeholder={C.phonePlaceholder} />{fieldError("phone") ? <span className="text-xs text-danger-700">{fieldError("phone")}</span> : <span className="text-xs font-normal text-neutral-500">{C.phoneHint}</span>}</label>
          <label className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3"><span><span className="block text-sm font-medium text-neutral-800">{C.statusLabel}</span><span className="text-xs text-neutral-500">{form.state.active ? C.activeLabel : C.inactiveLabel}</span></span><input type="checkbox" checked={form.state.active} onChange={(e) => setField("active", e.target.checked)} aria-label={C.statusLabel} className="h-5 w-5 accent-primary-700" /></label>
        </div>
        <DialogFooter><Button type="button" variant="outline" onClick={form.close}>{C.cancel}</Button><Button loading={form.state.saving} onClick={() => void form.submit(load)}>{form.state.editing ? C.save : C.register}</Button></DialogFooter>
    </DialogContent>
    </Dialog>
  </div>;
}


