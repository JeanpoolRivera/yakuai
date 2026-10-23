import type { Crop, SoilTexture } from "@/api/types";

export const ETAPAS: Record<string, string> = {
  ini: "Inicio",
  des: "Desarrollo",
  med: "Media",
  fin: "Final",
};

export function waterUseful(cc: number, pmp: number): number {
  return cc - pmp;
}

export function kcMeterWidth(kc: number, maxKc: number): string {
  const width = maxKc > 0 ? (kc / maxKc) * 100 : 0;
  return `${Math.max(0, width)}%`;
}

export function formatKc(kc: number): string {
  return kc.toFixed(2);
}

export function formatDepth(depth: number): string {
  return depth.toFixed(2);
}

export function filterCrops(crops: Crop[], query: string) {
  if (!query.trim()) return crops;
  const q = query.trim().toLowerCase();
  return crops.filter((c) => `${c.name} ${c.code} ${c.scientific_name ?? ""}`.toLowerCase().includes(q));
}

export function filterSoils(soils: SoilTexture[], query: string) {
  if (!query.trim()) return soils;
  const q = query.trim().toLowerCase();
  return soils.filter((s) => `${s.name} ${s.code}`.toLowerCase().includes(q));
}