/* Catálogos FAO (solo lectura): cultivos/etapas y suelos. */
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Layers, Sprout } from "lucide-react";
import { listCrops, listSoils } from "../api/endpoints";
import type { Crop, SoilTexture } from "../api/types";
import { PageHead } from "../components/shadcn/page-head";
import { Badge } from "../components/shadcn/badge";
import { Banner, Empty, Loading } from "../components/shadcn/feedback";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/shadcn/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/shadcn/table";
import { SearchInput } from "../components/shadcn/search-input";
import { fmtNum, toNum } from "../lib/format";
import { cn } from "../lib/utils";

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
    <div>
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
        <div className="grid gap-4">
          <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-card">
            <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-700">
              <Layers className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-2xs font-semibold uppercase tracking-wider text-primary-700">Biblioteca agronómica</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-neutral-800">Una base técnica para cada recomendación</h2>
              <p className="mt-1 text-sm text-neutral-600">Parámetros FAO-56 y Saxton &amp; Rawls. Catálogo de consulta; los cambios los realiza el administrador.</p>
            </div>
            <Badge variant="secondary" className="shrink-0">Solo lectura</Badge>
          </div>

          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Buscar cultivo o textura de suelo…"
            label="Buscar en catálogos"
          />

          <div className="grid items-start gap-4 xl:grid-cols-2">
            <Card aria-label="Cultivos y etapas">
              <CardHeader>
                <CardTitle>Cultivos y etapas</CardTitle>
                <CardDescription>Coeficientes de cultivo (Kc), duración y profundidad de raíces.</CardDescription>
              </CardHeader>
              <CardContent>
                {cropList.length === 0 ? (
                  <Empty
                    icon={<Sprout className="h-5 w-5" aria-hidden="true" />}
                    title={query ? "Sin coincidencias" : "Sin cultivos"}
                    hint={query ? "Prueba con otro nombre." : "El servidor aún no cargó el catálogo."}
                  />
                ) : (
                  <div className="grid gap-2">
                    {cropList.map((c) => {
                      const open = visibleOpen === c.id;
                      const panelId = `crop-panel-${c.id}`;
                      return (
                        <article key={c.id} className="rounded-md border border-neutral-200">
                          <button
                            type="button"
                            aria-expanded={open}
                            aria-controls={panelId}
                            onClick={() => setOpenCrop(open ? null : c.id)}
                            className="flex w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600/25"
                          >
                            <span className="min-w-0">
                              <strong className="block truncate font-semibold text-neutral-800">{c.name}</strong>
                              <span className="block truncate text-xs text-neutral-500">
                                {c.scientific_name ?? c.code}
                              </span>
                            </span>
                            <span className="flex shrink-0 items-center gap-2">
                              <Badge variant="secondary">{c.stages?.length ?? 0} etapas</Badge>
                              <ChevronDown
                                aria-hidden="true"
                                className={cn("h-4 w-4 text-neutral-500 transition-transform", open && "rotate-180")}
                              />
                            </span>
                          </button>
                          {open ? (
                            <div id={panelId} className="border-t border-neutral-200 p-3">
                              <Table>
                                <caption className="sr-only">Etapas del cultivo {c.name}</caption>
                                <TableHeader>
                                  <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                                    <TableHead>Etapa</TableHead>
                                    <TableHead className="text-right tabular-nums">Días</TableHead>
                                    <TableHead className="text-right tabular-nums">Kc</TableHead>
                                    <TableHead className="text-right tabular-nums">Raíz (m)</TableHead>
                                    <TableHead className="text-right tabular-nums">p</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {(c.stages ?? []).map((s) => (
                                    <TableRow key={s.id}>
                                      <TableCell title={ETAPAS[s.stage] ?? s.stage}>{ETAPAS[s.stage] ?? s.stage}</TableCell>
                                      <TableCell className="text-right tabular-nums">{s.days}</TableCell>
                                      <TableCell className="text-right tabular-nums">{s.kc}</TableCell>
                                      <TableCell className="text-right tabular-nums">{s.root_depth_m}</TableCell>
                                      <TableCell className="text-right tabular-nums">{s.depletion_fraction}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card aria-label="Texturas de suelo">
              <CardHeader>
                <CardTitle>Texturas de suelo</CardTitle>
                <CardDescription>Capacidad de campo y punto de marchitez en fracción volumétrica.</CardDescription>
              </CardHeader>
              <CardContent>
                {soilList.length === 0 ? (
                  <Empty
                    icon={<Layers className="h-5 w-5" aria-hidden="true" />}
                    title={query ? "Sin coincidencias" : "Sin suelos"}
                    hint={query ? "Prueba con otro nombre." : "El servidor aún no cargó el catálogo."}
                  />
                ) : (
                  <Table>
                    <caption className="sr-only">Texturas de suelo con capacidad de campo y marchitez</caption>
                    <TableHeader>
                      <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                        <TableHead>Textura</TableHead>
                        <TableHead className="text-right tabular-nums">CC</TableHead>
                        <TableHead className="text-right tabular-nums">PMP</TableHead>
                        <TableHead className="text-right tabular-nums">Agua útil</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {soilList.map((s) => {
                        const cc = toNum(s.field_capacity) ?? 0;
                        const pmp = toNum(s.wilting_point) ?? 0;
                        return (
                          <TableRow key={s.code}>
                            <TableCell>
                              <strong className="font-semibold">{s.name}</strong>
                              <div className="font-mono text-xs text-neutral-500">{s.code}</div>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{fmtNum(cc, 3)}</TableCell>
                            <TableCell className="text-right tabular-nums">{fmtNum(pmp, 3)}</TableCell>
                            <TableCell className="text-right tabular-nums">{fmtNum(cc - pmp, 3)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <dl aria-label="Significado de los parámetros" className="grid gap-x-8 gap-y-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-card sm:grid-cols-2">
            <div><dt className="font-mono text-sm font-semibold text-primary-700">Kc</dt><dd className="mt-0.5 text-sm text-neutral-600">Coeficiente de cultivo: cuánta agua usa la planta en cada etapa.</dd></div>
            <div><dt className="font-mono text-sm font-semibold text-primary-700">Zr · Raíz (m)</dt><dd className="mt-0.5 text-sm text-neutral-600">Profundidad de raíces que el riego debe alcanzar.</dd></div>
            <div><dt className="font-mono text-sm font-semibold text-primary-700">p</dt><dd className="mt-0.5 text-sm text-neutral-600">Fracción de agotamiento permitido antes de regar.</dd></div>
            <div><dt className="font-mono text-sm font-semibold text-primary-700">CC</dt><dd className="mt-0.5 text-sm text-neutral-600">Capacidad de campo: agua que el suelo retiene tras drenar.</dd></div>
            <div><dt className="font-mono text-sm font-semibold text-primary-700">PMP</dt><dd className="mt-0.5 text-sm text-neutral-600">Punto de marchitez permanente: bajo este nivel la planta no se recupera.</dd></div>
            <div><dt className="font-mono text-sm font-semibold text-primary-700">Agua útil</dt><dd className="mt-0.5 text-sm text-neutral-600">Diferencia CC menos PMP disponible para el cultivo.</dd></div>
          </dl>
          <p className="text-xs text-neutral-500">Valores de referencia FAO-56 y Saxton &amp; Rawls, pendientes de validación local en Chupaca. Catálogo de consulta.</p>
        </div>
      )}
    </div>
  );
}