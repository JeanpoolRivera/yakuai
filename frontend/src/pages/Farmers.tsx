/* Agricultores: lista + registro/edición (solo técnico/admin). */
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ApiError, friendlyError } from "../api/client";
import { createFarmer, listFarmers, updateFarmer } from "../api/endpoints";
import type { Farmer } from "../api/types";
import {
  DataTable,
  Badge,
  Banner,
  Button,
  Empty,
  Field,
  Loading,
  Icon,
  Modal,
  PageHead,
  Pager,
  SearchInput,
  SelectInput,
  TextInput,
} from "../components/ui";
import { useCollection } from "../hooks/useCollection";
import { submitForm } from "../lib/dom";
import { fmtNum, initial } from "../lib/format";
import { toastError, toastOk } from "../lib/toast";

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
    <div className="page manage-page">
      <PageHead
        eyebrow="Personas"
        title="Agricultores"
        desc="Gestiona los contactos y las parcelas de tu comunidad agrícola."
        crumbs="YakuAI / Agricultores"
        actions={<Button onClick={openCreate}><Icon name="plus" /> Registrar agricultor</Button>}
      />

      {loading ? (
        <Loading text="Cargando agricultores…" />
      ) : error ? (
        <Banner kind="bad">
          {error}{" "}
          <button className="link" onClick={() => void load()}>
            Reintentar
          </button>
        </Banner>
      ) : (
        <section className="manage-panel" aria-label="Lista de agricultores">
          <div className="manage-section-head">
            <div><p className="eyebrow">Directorio</p><h2>Tu comunidad agrícola</h2><p>Información de contacto y parcelas vinculadas.</p></div>
            <span className="manage-total"><strong>{fmtNum(farmers.length)}</strong> registrados</span>
          </div>
          <div className="toolbar manage-toolbar">
            <SearchInput
              value={coll.query}
              onChange={coll.setQuery}
              placeholder="Buscar por nombre o teléfono…"
              label="Buscar agricultores"
            />
            <span className="tiny">
              {coll.total} {coll.total === 1 ? "agricultor" : "agricultores"}
            </span>
          </div>
          {coll.total === 0 ? (
            <Empty
              icon="users"
              title={coll.query ? "Sin coincidencias" : "Aún no hay agricultores"}
              hint={coll.query ? "Prueba con otro nombre." : "Registra al primero para asignarle parcelas."}
              action={coll.query ? undefined : <Button onClick={openCreate}><Icon name="plus" /> Registrar agricultor</Button>}
            />
          ) : (
            <>
              <DataTable label="Directorio de agricultores" rows={coll.items} rowKey={f=>f.id} columns={[
                {key:"name",label:"Agricultor",render:f=><div className="person-cell"><span className="avatar" aria-hidden="true">{twoInitials(f.name)}</span><div><strong>{f.name}</strong><small>Registro #{f.id}</small></div></div>},
                {key:"phone",label:"Teléfono",render:f=><span className="muted">{f.phone || "Sin teléfono registrado"}</span>},
                {key:"plots",label:"Parcelas",render:f=><span className="num">{fmtNum(f.plots_count ?? 0)}</span>},
                {key:"status",label:"Estado",render:f=><Badge tone={f.is_active?"ok":"neutro"}>{f.is_active?"Activo":"Inactivo"}</Badge>},
                {key:"actions",label:"Acciones",render:f=><div className="table-actions">
                  {f.phone?<a className="btn btn-ghost btn-sm" href={waLink(f.phone)} target="_blank" rel="noreferrer" aria-label={`WhatsApp de ${f.name}, abre en otra pestaña`}>WhatsApp <Icon name="arrow" size={14}/></a>:null}
                  <Button variant="outline" size="sm" onClick={()=>openEdit(f)} aria-label={`Editar a ${f.name}`}><Icon name="edit" size={15}/>Editar</Button>
                </div>}
              ]}/>
              <Pager page={coll.page} pages={coll.pages} onPage={coll.setPage} count={`${coll.total} en total`} />
            </>
          )}
        </section>
      )}

      {open ? (
        <Modal
          title={editing ? "Editar agricultor" : "Registrar agricultor"}
          sub="Registra los datos de contacto. El técnico gestiona el PIN de acceso."
          onClose={() => setOpen(false)}
          busy={saving}
          foot={
            <>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button loading={saving} onClick={() => submitForm("farmer-form")}>
                {editing ? "Guardar cambios" : "Registrar"}
              </Button>
            </>
          }
        >
          <form className="manage-form" id="farmer-form" onSubmit={(e) => void onSubmit(e)}>
            <Field label="Nombre completo" required htmlFor="fa-name" error={fieldErrors.name?.[0]}>
              <TextInput
                id="fa-name"
                placeholder="Juana Pérez"
                value={name}
                aria-invalid={Boolean(fieldErrors.name)}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field
              label="Teléfono (opcional)"
              hint="Se utiliza para contacto, sin envíos automáticos."
              htmlFor="fa-phone"
              error={fieldErrors.phone?.[0]}
            >
              <TextInput
                id="fa-phone"
                inputMode="tel"
                placeholder="999 888 777"
                value={phone}
                aria-invalid={Boolean(fieldErrors.phone)}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            <Field label="Estado" htmlFor="fa-active">
              <SelectInput
                id="fa-active"
                value={active ? "activo" : "inactivo"}
                onChange={(e) => setActive(e.target.value === "activo")}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </SelectInput>
            </Field>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
