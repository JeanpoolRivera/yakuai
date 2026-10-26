import { MapPin } from "lucide-react";

/** Preview of the saved geographic boundary; never invent a parcel shape. */
export function PlotOutline({ boundary }: { boundary: number[][][] | null }): React.JSX.Element {
  const ring = boundary?.[0]?.filter((p) => p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1])) ?? [];
  if (ring.length < 3) return <div className="plot-outline flex items-center justify-center gap-2 text-xs text-neutral-600"><MapPin className="h-5 w-5" aria-hidden="true" />Sin contorno registrado</div>;
  const xs = ring.map((p) => p[0]);
  const ys = ring.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const longitudeScale = Math.cos(((minY + maxY) / 2) * Math.PI / 180);
  const width = (maxX - minX) * longitudeScale, height = maxY - minY;
  const scale = Math.min(240 / (width || 1), 80 / (height || 1));
  const points = ring.map(([x, y]) => `${150 + ((x - minX) * longitudeScale - width / 2) * scale},${55 - (y - minY - height / 2) * scale}`).join(" ");
  return <svg className="plot-outline" viewBox="0 0 300 110" role="img" aria-label="Vista del contorno registrado">
    <path d="M0 27H300M0 55H300M0 83H300M50 0V110M100 0V110M150 0V110M200 0V110M250 0V110" stroke="#d5e3dc" strokeWidth="1" />
    <polygon points={points} fill="#315E42" fillOpacity=".18" stroke="#35563D" strokeWidth="2" strokeLinejoin="round" />
  </svg>;
}
