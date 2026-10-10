/* Catálogos FAO (solo lectura): cultivos/etapas y suelos. */
import { useEffect, useMemo, useState } from "react";
import { listCrops, listSoils } from "../api/endpoints";
import type { Crop, SoilTexture } from "../api/types";
import { Badge, Banner, Card, Empty, Icon, Loading, PageHead, SearchInput } from "../components/ui";
import { fmtNum, toNum } from "../lib/format";

const ETAPAS: Record<string, string> = {
  ini: "Inicio",
  des: "Desarrollo",
  med: "Media",
  fin: "Final",
};

export function Catalogs(): React.JSX.Element {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [soils, setSoils] = useState<SoilTexture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCrop, setOpenCrop] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const cropList = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return crops;
    return crops.filter((c) => `${c.name} ${c.code} ${c.scientific_name ?? ""}`.toLowerCase().includes(q));
  }, [crops, query]);
  const soilList = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return soils;
    return soils.filter((s) => `${s.name} ${s.code}`.toLowerCase().includes(q));
  }, [soils, query]);
  const visibleOpen = cropList.some((c) => c.id === openCrop) ? openCrop : (cropList[0]?.id ?? null);

  useEffect(() => {
    Promise.all([listCrops(), listSoils()])
      .then(([c, s]) => {
        setCrops(c);
        setSoils(s);
        if (c.length > 0) setOpenCrop(c[0].id);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "No se pudieron cargar los catálogos."),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page manage-page">
      <PageHead
        eyebrow="Referencia"
        title="Cultivos y suelos"
        desc="Consulta los parámetros agronómicos que sustentan las recomendaciones de riego."
        crumbs="YakuAI / Catálogos"
      />

      {loading ? (
        <Loading text="Cargando catálogos…" />
      ) : error ? (
        <Banner kind="bad">{error}</Banner>
      ) : (
        <div className="stack">
          <div className="manage-reference">
            <span className="manage-icon"><Icon name="layers" size={24} /></span>
            <div><p className="eyebrow">Biblioteca agronómica</p><h2>Una base técnica para cada recomendación</h2><p>Parámetros FAO-56 y Saxton &amp; Rawls. Catálogo de consulta; los cambios los realiza el administrador.</p></div>
            <Badge tone="neutro">Solo lectura</Badge>
          </div>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Buscar cultivo o textura de suelo…"
            label="Buscar en catálogos"
          />
          <div className="manage-catalog-grid">
          <Card label="Cultivos y etapas" title="Cultivos y etapas" sub="Coeficientes de cultivo (Kc), duración y profundidad de raíces.">
            {cropList.length === 0 ? (
              <Empty icon="sprout" title={query ? "Sin coincidencias" : "Sin cultivos"} hint={query ? "Prueba con otro nombre." : "El servidor aún no cargó el catálogo."} />
            ) : (
              <div className="rows">
                {cropList.map((c) => {
                  const open = visibleOpen === c.id;
                  const panelId = `crop-panel-${c.id}`;
                  return (
                    <article className="manage-crop" key={c.id}>
                      <button
                        className="spread accordion-btn manage-crop-toggle"
                        aria-expanded={open}
                        aria-controls={panelId}
                        onClick={() => setOpenCrop(open ? null : c.id)}
                      >
                        <span>
                          <strong>{c.name}</strong>
                          <span className="tiny accordion-sub">
                            {c.scientific_name ?? c.code}
                          </span>
                        </span>
                        <span className="row">
                          <Badge tone="neutro">{c.stages?.length ?? 0} etapas</Badge>
                          <span
                            aria-hidden="true"
                            className={`accordion-chevron${open ? " open" : ""}`}
                          >
                            <Icon name="chevron" size={16} />
                          </span>
                        </span>
                      </button>
                      {open ? (
                        <div className="table-wrap mt-3" id={panelId}>
                          <table className="tbl">
                            <caption className="sr-only">Etapas del cultivo {c.name}</caption>
                            <thead>
                              <tr>
                                <th scope="col">Etapa</th>
                                <th scope="col" className="num">Días</th>
                                <th scope="col" className="num">Kc</th>
                                <th scope="col" className="num">Raíz (m)</th>
                                <th scope="col" className="num">p</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(c.stages ?? []).map((s) => (
                                <tr key={s.id}>
                                  <td title={ETAPAS[s.stage] ?? s.stage}>{ETAPAS[s.stage] ?? s.stage}</td>
                                  <td className="num">{s.days}</td>
                                  <td className="num">{s.kc}</td>
                                  <td className="num">{s.root_depth_m}</td>
                                  <td className="num">{s.depletion_fraction}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </Card>

          <Card
            label="Texturas de suelo"
            title="Texturas de suelo"
            sub="Capacidad de campo y punto de marchitez en fracción volumétrica."
          >
            {soilList.length === 0 ? (
              <Empty icon="layers" title={query ? "Sin coincidencias" : "Sin suelos"} hint={query ? "Prueba con otro nombre." : "El servidor aún no cargó el catálogo."} />
            ) : (
              <div className="table-wrap">
                <table className="tbl">
                  <caption className="sr-only">Texturas de suelo con capacidad de campo y marchitez</caption>
                  <thead>
                    <tr>
                      <th scope="col">Textura</th>
                      <th scope="col" className="num">CC</th>
                      <th scope="col" className="num">PMP</th>
                      <th scope="col" className="num">Agua útil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soilList.map((s) => {
                      const cc = toNum(s.field_capacity) ?? 0;
                      const pmp = toNum(s.wilting_point) ?? 0;
                      return (
                        <tr key={s.code}>
                          <td>
                            <strong>{s.name}</strong>
                            <div className="tiny mono">{s.code}</div>
                          </td>
                          <td className="num">{fmtNum(cc, 3)}</td>
                          <td className="num">{fmtNum(pmp, 3)}</td>
                          <td className="num">{fmtNum(cc - pmp, 3)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          </div>
          <dl className="kv" aria-label="Significado de los parámetros">
            <dt className="kv-dt">Kc</dt>
            <dd className="kv-dd">Coeficiente de cultivo: cuánta agua usa la planta en cada etapa.</dd>
            <dt className="kv-dt">Zr · Raíz (m)</dt>
            <dd className="kv-dd">Profundidad de raíces que el riego debe alcanzar.</dd>
            <dt className="kv-dt">p</dt>
            <dd className="kv-dd">Fracción de agotamiento permitido antes de regar.</dd>
            <dt className="kv-dt">CC</dt>
            <dd className="kv-dd">Capacidad de campo: agua que el suelo retiene tras drenar.</dd>
            <dt className="kv-dt">PMP</dt>
            <dd className="kv-dd">Punto de marchitez permanente: bajo este nivel la planta no se recupera.</dd>
            <dt className="kv-dt">Agua útil</dt>
            <dd className="kv-dd">Diferencia CC menos PMP disponible para el cultivo.</dd>
          </dl>
          <p className="manage-caption">Valores de referencia FAO-56 y Saxton &amp; Rawls, pendientes de validación local en Chupaca. Catálogo de consulta.</p>
        </div>
      )}
    </div>
  );
}
