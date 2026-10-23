import { useMemo, useState } from "react";
import { ChevronDown } from 'lucide-react';
import { PageHead } from "@/components/shadcn/page-head";
import { Badge } from "@/components/shadcn/badge";
import { Banner, Empty, Loading } from "@/components/shadcn/feedback";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { SearchInput } from "@/components/shadcn/search-input";
import { fmtNum, toNum } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCatalogs } from "../hooks/useCatalogs";
import { CATALOGS_COPY as C } from "../copy";
import { ETAPAS, filterCrops, filterSoils, kcMeterWidth } from "../utils";

export function CatalogsWorkspace(): React.JSX.Element {
  const { crops, soils, loading, error } = useCatalogs();
  const [openCrop, setOpenCrop] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const cropList = useMemo(() => filterCrops(crops, query), [crops, query]);
  const soilList = useMemo(() => filterSoils(soils, query), [soils, query]);
  const visibleOpen = cropList.some((c) => c.id === openCrop) ? openCrop : (cropList[0]?.id ?? null);

  return (
    <div>
      <PageHead eyebrow={C.eyebrow} title={C.title} desc={C.description} crumbs={C.crumbs} />
      {loading ? (
        <Loading text={C.loading} />
      ) : error ? (
        <Banner kind="bad">{error}</Banner>
      ) : (
        <div className="grid gap-4">
          <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-card">
            <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-700">
              <span className="text-xl">📚</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-2xs font-semibold uppercase tracking-wider text-primary-700">{C.libraryTitle}</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-neutral-800">{C.libraryDesc}</h2>
              <p className="mt-1 text-sm text-neutral-600">{C.libraryNote}</p>
            </div>
            <Badge variant="secondary" className="shrink-0">{C.readOnly}</Badge>
          </div>

          <SearchInput value={query} onChange={setQuery} placeholder={C.search} label={C.searchLabel} />

          <div className="grid items-start gap-4 xl:grid-cols-2">
            <Card aria-label="Cultivos y etapas">
              <CardHeader>
                <CardTitle>{C.cropsTitle}</CardTitle>
                <CardDescription>{C.cropsDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                {cropList.length === 0 ? (
                  <Empty icon={<span className="h-5 w-5" />} title={query ? C.noMatch : C.noCrops} hint={query ? C.noMatchHint : C.noDataHint} />
                ) : (
                  <div className="grid gap-2">
                    {cropList.map((c) => {
                      const open = visibleOpen === c.id;
                      const panelId = `crop-panel-${c.id}`;
                      const maxKc = Math.max(...(c.stages ?? []).map((s) => Number(s.kc)), 1);
                      return (
                        <article key={c.id} className="rounded-md border border-neutral-200">
                          <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpenCrop(open ? null : c.id)} className="flex w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600/25">
                            <span className="min-w-0">
                              <strong className="block truncate font-semibold text-neutral-800">{c.name}</strong>
                              <span className="block truncate text-xs text-neutral-500">{c.scientific_name ?? c.code}</span>
                            </span>
                            <span className="flex shrink-0 items-center gap-2">
                              <Badge variant="secondary">{C.stagesLabel(c.stages?.length ?? 0)}</Badge>
                              <ChevronDown aria-hidden="true" className={cn("h-4 w-4 text-neutral-500 transition-transform", open && "rotate-180")} />
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
                                      <TableCell className="text-right tabular-nums">
                                        {s.kc}
                                        <div className="catalog-meter" aria-hidden="true">
                                          <span style={{ width: kcMeterWidth(Number(s.kc), maxKc) }} />
                                        </div>
                                      </TableCell>
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
                <CardTitle>{C.soilsTitle}</CardTitle>
                <CardDescription>{C.soilsDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                {soilList.length === 0 ? (
                  <Empty icon={<span className="h-5 w-5" />} title={query ? C.noMatch : C.noSoils} hint={query ? C.noMatchHint : C.noDataHint} />
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

          <div aria-label="Significado de los parámetros" className="grid gap-x-8 gap-y-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-card sm:grid-cols-2">
            <div><dt className="font-mono text-sm font-semibold text-primary-700">{C.glossary.kc.label}</dt><dd className="mt-0.5 text-sm text-neutral-600">{C.glossary.kc.desc}</dd></div>
            <div><dt className="font-mono text-sm font-semibold text-primary-700">{C.glossary.zr.label}</dt><dd className="mt-0.5 text-sm text-neutral-600">{C.glossary.zr.desc}</dd></div>
            <div><dt className="font-mono text-sm font-semibold text-primary-700">{C.glossary.p.label}</dt><dd className="mt-0.5 text-sm text-neutral-600">{C.glossary.p.desc}</dd></div>
            <div><dt className="font-mono text-sm font-semibold text-primary-700">{C.glossary.cc.label}</dt><dd className="mt-0.5 text-sm text-neutral-600">{C.glossary.cc.desc}</dd></div>
            <div><dt className="font-mono text-sm font-semibold text-primary-700">{C.glossary.pmp.label}</dt><dd className="mt-0.5 text-sm text-neutral-600">{C.glossary.pmp.desc}</dd></div>
            <div><dt className="font-mono text-sm font-semibold text-primary-700">{C.glossary.aw.label}</dt><dd className="mt-0.5 text-sm text-neutral-600">{C.glossary.aw.desc}</dd></div>
          </div>
          <p className="text-xs text-neutral-500">{C.footnote}</p>
        </div>
      )}
    </div>
  );
}
