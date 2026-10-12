/* Agricultores: lista + registro/edición (solo técnico/admin). */
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowUpRight, LoaderCircle, Pencil, Plus, Users } from "lucide-react";
import { ApiError, friendlyError } from "../api/client";
import { createFarmer, listFarmers, updateFarmer } from "../api/endpoints";
import type { Farmer } from "../api/types";
import { PageHead } from "../components/shadcn/page-head";
import { Badge } from "../components/shadcn/badge";
import { Banner, Empty, Loading } from "../components/shadcn/feedback";
import { Button } from "../components/shadcn/button";
import { Avatar, AvatarFallback } from "../components/shadcn/avatar";
import { DataTable } from "../components/shadcn/data-table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/shadcn/dialog";
import { Input } from "../components/shadcn/input";
import { PaginationControls } from "../components/shadcn/PaginationControls";
import { SearchInput } from "../components/shadcn/search-input";
import { FormField } from "../components/forms/FormField";
import { useCollection } from "../hooks/useCollection";
import { submitForm } from "../lib/dom";
import { fmtNum, initial } from "../lib/format";
import { toastError, toastOk } from "../lib/toast";

const SELECT_CLS =
  "h-12 w-full rounded-sm border border-neutral-400 bg-white px-3 text-sm text-neutral-800 transition-all hover:border-primary-600 focus-visible:border-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15 disabled:cursor-not-allowed disabled:opacity-50";

function twoInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return initial(name);
  if (parts.length === 1) return initial(parts[0]);
  return (initial(parts[0]) + initial(parts[parts.length - 1])).toUpperCase();
}

function waLink(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

export function Farmers(): React.JSX.Element {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Farmer | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      setFarmers(await listFarmers());
    } catch (err) {
      setError(friendlyError(err, "No se pudieron cargar los agricultores."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const coll = useCollection(farmers, {
    perPage: 8,
    search: (f, q) => `${f.name} ${f.phone ?? ""}`.toLowerCase().includes(q),
    sort: (a, b) => b.id - a.id,
  });

  function openCreate(): void {
    setEditing(null);
    setName("");
    setPhone("");
    setActive(true);
    setFieldErrors({});
    setOpen(true);
  }

  function openEdit(f: Farmer): void {
    setEditing(f);
    setName(f.name);
    setPhone(f.phone ?? "");
    setActive(f.is_active);
    setFieldErrors({});
    setOpen(true);
  }

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (name.trim().length < 2) {
      toastError("El nombre debe tener al menos 2 letras.");
      return;
    }
    setSaving(true);
    setFieldErrors({});
    try {
      const body = { name: name.trim(), phone: phone.trim() || undefined, is_active: active };
      if (editing) {
        await updateFarmer(editing.id, body);
        toastOk("Agricultor actualizado.");
      } else {
        await createFarmer(body);
        toastOk("Agricultor registrado.");
      }
      setOpen(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setFieldErrors(err.fields);
        toastError("Revisa los campos marcados.");
      } else {
        toastError(friendlyError(err, "No se pudo guardar."));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHead
        eyebrow="Personas"
        title="Agricultores"
        desc="Gestiona los contactos y las parcelas de tu comunidad agrícola."
        crumbs="YakuAI / Agricultores"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Registrar agricultor
          </Button>
        }
      />

      {loading ? (
        <Loading text="Cargando agricultores…" />
      ) : error ? (
        <Banner kind="bad">
          {error}{" "}
          <Button variant="link" size="sm" onClick={() => void load()}>
            Reintentar
          </Button>
        </Banner>
      ) : (
        <section aria-label="Lista de agricultores" className="grid gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-primary-700">Directorio</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-neutral-800">Tu comunidad agrícola</h2>
              <p className="mt-1 text-sm text-neutral-600">Información de contacto y parcelas vinculadas.</p>
            </div>
            <p className="shrink-0 text-sm text-neutral-600">
              <strong className="font-semibold tabular-nums text-neutral-800">{fmtNum(farmers.length)}</strong> registrados
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={coll.query}
              onChange={coll.setQuery}
              placeholder="Buscar por nombre o teléfono…"
              label="Buscar agricultores"
              className="min-w-[200px] flex-1"
            />
            <span className="text-xs text-neutral-500">
              {coll.total} {coll.total === 1 ? "agricultor" : "agricultores"}
            </span>
          </div>
          {coll.total === 0 ? (
            <Empty
              icon={<Users className="h-5 w-5" aria-hidden="true" />}
              title={coll.query ? "Sin coincidencias" : "Aún no hay agricultores"}
              hint={coll.query ? "Prueba con otro nombre." : "Registra al primero para asignarle parcelas."}
              action={
                coll.query ? undefined : (
                  <Button onClick={openCreate}>
                    <Plus className="h-4 w-4" aria-hidden="true" /> Registrar agricultor
                  </Button>
                )
              }
            />
          ) : (
            <>
              <DataTable
                label="Directorio de agricultores"
                rows={coll.items}
                rowKey={(f) => f.id}
                columns={[
                  {
                    key: "name",
                    label: "Agricultor",
                    render: (f) => (
                      <span className="flex items-center gap-2.5">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary-100 text-xs font-semibold text-primary-800">
                            {twoInitials(f.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          <strong className="block font-semibold">{f.name}</strong>
                          <small className="block text-xs text-neutral-500">Registro #{f.id}</small>
                        </span>
                      </span>
                    ),
                  },
                  {
                    key: "phone",
                    label: "Teléfono",
                    render: (f) => <span className="text-neutral-500">{f.phone || "Sin teléfono registrado"}</span>,
                  },
                  {
                    key: "plots",
                    label: "Parcelas",
                    numeric: true,
                    render: (f) => <span className="tabular-nums">{fmtNum(f.plots_count ?? 0)}</span>,
                  },
                  {
                    key: "status",
                    label: "Estado",
                    render: (f) => (
                      <Badge variant={f.is_active ? "success" : "secondary"}>{f.is_active ? "Activo" : "Inactivo"}</Badge>
                    ),
                  },
                  {
                    key: "actions",
                    label: "Acciones",
                    render: (f) => (
                      <span className="flex flex-wrap gap-1.5">
                        {f.phone ? (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={waLink(f.phone)} target="_blank" rel="noreferrer" aria-label={`WhatsApp de ${f.name}, abre en otra pestaña`}>
                              WhatsApp <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </a>
                          </Button>
                        ) : null}
                        <Button variant="outline" size="sm" onClick={() => openEdit(f)} aria-label={`Editar a ${f.name}`}>
                          <Pencil className="h-[15px] w-[15px]" aria-hidden="true" />
                          Editar
                        </Button>
                      </span>
                    ),
                  },
                ]}
              />
              <PaginationControls
                page={coll.page}
                pages={coll.pages}
                onPageChange={coll.setPage}
                count={`${coll.total} en total`}
              />
            </>
          )}
        </section>
      )}

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o && !saving) setOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar agricultor" : "Registrar agricultor"}</DialogTitle>
            <DialogDescription>Registra los datos de contacto. El técnico gestiona el PIN de acceso.</DialogDescription>
          </DialogHeader>
          <form id="farmer-form" onSubmit={(e) => void onSubmit(e)} className="grid gap-4">
            <FormField label="Nombre completo" required htmlFor="fa-name" error={fieldErrors.name?.[0]}>
              <Input
                id="fa-name"
                placeholder="Juana Pérez"
                value={name}
                aria-invalid={Boolean(fieldErrors.name)}
                onChange={(e) => setName(e.target.value)}
              />
            </FormField>
            <FormField
              label="Teléfono (opcional)"
              hint="Se utiliza para contacto, sin envíos automáticos."
              htmlFor="fa-phone"
              error={fieldErrors.phone?.[0]}
            >
              <Input
                id="fa-phone"
                inputMode="tel"
                placeholder="999 888 777"
                value={phone}
                aria-invalid={Boolean(fieldErrors.phone)}
                onChange={(e) => setPhone(e.target.value)}
              />
            </FormField>
            <FormField label="Estado" htmlFor="fa-active">
              <select
                id="fa-active"
                className={SELECT_CLS}
                value={active ? "activo" : "inactivo"}
                onChange={(e) => setActive(e.target.value === "activo")}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </FormField>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button disabled={saving} onClick={() => submitForm("farmer-form")}>
              {saving ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  {editing ? "Guardar cambios" : "Registrar"}
                </>
              ) : (
                <>{editing ? "Guardar cambios" : "Registrar"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}