/* Mapa de parcelas (Leaflet). Proveedor OSM intacto; chrome con tokens YakuAI. */
import { useEffect, useId, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { centroidOf, isValidRing, ringAreaM2 } from "../../lib/geo";
import type { Ring } from "../../lib/geo";
import { cn } from "@/lib/utils";

export interface DrawResult {
  ring: Ring;
  lat: number;
  lng: number;
  areaM2: number;
}

export interface PlotPoint {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
  farmerName?: string;
}

const CHUPACA: [number, number] = [-12.0667, -75.2833];

type Basemap = "satellite" | "streets";

const BASEMAPS: Record<Basemap, { url: string; attribution: string; maxZoom: number; maxNativeZoom: number }> = {
  satellite: {
    url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community",
    maxZoom: 23,
    maxNativeZoom: 17,
  },
  streets: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19,
    maxNativeZoom: 19,
  },
};

function createBasemapLayer(basemap: Basemap): L.TileLayer {
  const source = BASEMAPS[basemap];
  return L.tileLayer(source.url, { attribution: source.attribution, maxZoom: source.maxZoom, maxNativeZoom: source.maxNativeZoom });
}

// Colores de marcador/dibujo (dominio mapa; inline styles de la barra propia).
const MARKER_EDGE = "#09525C";
const MARKER_FILL = "#087F8C";
const SKETCH_EDGE = "#704C10";
const SKETCH_FILL = "#D6B46A";

export function MapLegend({ editable = false }: { editable?: boolean }): React.JSX.Element {
  return (
    <div role="group" aria-label="Leyenda del mapa" className="flex flex-wrap gap-x-5 gap-y-2 border-t border-neutral-200 px-3 py-3 text-xs text-neutral-700">
      <span className="inline-flex items-center gap-2">
        <span aria-hidden="true" className="h-3 w-3 rounded-full border-2 border-primary-700 bg-primary-500" />
        Parcela registrada
      </span>
      {editable ? (
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="h-3 w-3 rounded-sm border-2 border-[#704C10] bg-[#F3E2B8]" />
          Contorno en edición
        </span>
      ) : null}
    </div>
  );
}

export function PlotMap({
  plots,
  editable = false,
  onDraw,
  focus,
  zoom,
  className,
  mapClassName,
  initialBasemap = "streets",
}: {
  plots: PlotPoint[];
  editable?: boolean;
  onDraw?: (d: DrawResult) => void;
  focus?: { lat: number; lng: number } | null;
  zoom?: number;
  className?: string;
  mapClassName?: string;
  initialBasemap?: Basemap;
}): React.JSX.Element {
  const divRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const basemapRef = useRef<Basemap>(initialBasemap);
  const [basemap, setBasemap] = useState<Basemap>(initialBasemap);
  const onDrawRef = useRef(onDraw);

  useEffect(() => {
    onDrawRef.current = onDraw;
  }, [onDraw]);

  useEffect(() => {
    if (!divRef.current) return;
    // Vista inicial: si hay foco (paso 2 del formulario) se centra ahí con zoom
    // cercano 18, porque parcelas de 100-200 m² son invisibles en zoom 15.
    const focusOk =
      focus && Number.isFinite(focus.lat) && Number.isFinite(focus.lng) ? focus : null;
    const map = L.map(divRef.current, { maxZoom: BASEMAPS[basemapRef.current].maxZoom }).setView(
      focusOk ? [focusOk.lat, focusOk.lng] : CHUPACA,
      zoom ?? (focusOk ? 18 : 15),
    );
    const initialLayer = createBasemapLayer(basemapRef.current).addTo(map);
    mapRef.current = map;
    tileLayerRef.current = initialLayer;

    const markers = L.featureGroup().addTo(map);
    for (const p of plots) {
      const lat = Number(p.latitude);
      const lng = Number(p.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const popup = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = p.name;
      popup.append(title);
      if (p.farmerName) popup.append(document.createElement("br"), document.createTextNode(p.farmerName));
      L.circleMarker([lat, lng], { radius: 7, color: MARKER_EDGE, fillColor: MARKER_FILL, fillOpacity: 0.9 })
        .bindPopup(popup)
        .addTo(markers);
    }
    if (plots.length > 0 && !editable) {
      const pts = plots
        .map((p) => [Number(p.latitude), Number(p.longitude)] as [number, number])
        .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
      if (pts.length > 0) map.fitBounds(L.latLngBounds(pts).pad(0.3));
    }

    // Barra propia de dibujo (sin dependencias externas): sin límite de vértices.
    // 1) Fijar punto con un toque. 2) Marcar esquinas una por una y confirmar.
    let bar: HTMLDivElement | null = null;
    if (editable) {
      let mode: "punto" | "esquinas" = "punto";
      const verts: Array<{ lat: number; lng: number }> = [];
      const sketch = L.layerGroup().addTo(map);
      let point: L.Layer | null = null;
      let committedRing: Ring | null = null;
      let lastSelected: { lat: number; lng: number } | null = null;

      bar = document.createElement("div");
      bar.setAttribute("role", "toolbar");
      bar.setAttribute("aria-label", "Herramientas para marcar parcela");
      bar.setAttribute("aria-orientation", "horizontal");
      bar.setAttribute(
        "style",
        "position:relative;display:flex;flex-wrap:wrap;align-items:center;gap:8px;width:100%;padding:8px;background:#ffffff;border:1px solid #E4E8DF;border-radius:10px;box-sizing:border-box;",
      );
      const paint = (b: HTMLButtonElement, active: boolean, disabled = false, toggle = false): void => {
        b.type = "button";
        b.disabled = disabled;
        if (toggle) b.setAttribute("aria-pressed", String(active));
        b.setAttribute(
          "style",
          "min-height:44px;padding:8px 12px;background:" + (active ? "var(--color-primary-700)" : "#ffffff") +
            ";color:" + (active ? "#ffffff" : "#202C24") +
            ";border:1px solid " + (active ? "var(--color-primary-700)" : "var(--color-neutral-300)") + ";border-radius:8px;font-size:14px;font-weight:600;cursor:" +
            (disabled ? "not-allowed" : "pointer") + ";opacity:" + (disabled ? ".55" : "1") + ";",
        );
      };
      const btnPunto = document.createElement("button");
      btnPunto.textContent = "Ubicar punto";
      btnPunto.setAttribute("aria-label", "Modo: ubicar punto");
      const btnEsq = document.createElement("button");
      btnEsq.textContent = "Dibujar contorno";
      btnEsq.setAttribute("aria-label", "Modo: dibujar contorno");
      const btnUndo = document.createElement("button");
      btnUndo.textContent = "Deshacer";
      const btnClear = document.createElement("button");
      btnClear.textContent = "Limpiar";
      const btnOk = document.createElement("button");
      btnOk.textContent = "Confirmar contorno";
      const badge = document.createElement("div");
      badge.setAttribute("role", "status");
      badge.setAttribute("aria-live", "polite");
      badge.setAttribute(
        "style",
        "display:flex;flex:1 1 100%;align-items:center;min-height:40px;padding:6px 10px;background:var(--color-primary-50);color:var(--color-neutral-800);border-radius:8px;font-size:12px;",
      );
      bar.append(btnPunto, btnEsq, btnUndo, btnClear, btnOk, badge);
      bar.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        const controls = Array.from(bar?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ?? []);
        const current = controls.indexOf(document.activeElement as HTMLButtonElement);
        if (current < 0 || controls.length === 0) return;
        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        controls[(current + direction + controls.length) % controls.length]?.focus();
      });
      toolbarRef.current?.appendChild(bar);

      const refresh = (): void => {
        sketch.clearLayers();
        if (mode === "esquinas") {
          for (const v of verts) {
            L.circleMarker([v.lat, v.lng], {
              radius: 5,
              color: SKETCH_EDGE,
              fillColor: SKETCH_FILL,
              fillOpacity: 1,
            }).addTo(sketch);
          }
          if (verts.length >= 2) {
            const line: Array<[number, number]> = verts.map((v): [number, number] => [v.lat, v.lng]);
            if (verts.length >= 3) line.push([verts[0].lat, verts[0].lng]);
            L.polyline(line, { color: SKETCH_EDGE }).addTo(sketch);
          }
        } else if (committedRing) {
          L.polygon(committedRing.map(([lng, lat]) => [lat, lng]), {
            color: SKETCH_EDGE,
            fillColor: SKETCH_FILL,
            fillOpacity: 0.25,
          }).addTo(sketch);
        }

        const ring: Ring = verts.map((v): [number, number] => [v.lng, v.lat]);
        const valid = mode === "esquinas" && isValidRing(ring);
        const area = valid ? Math.round(ringAreaM2(ring) * 100) / 100 : 0;
        const center = valid ? centroidOf(ring) : lastSelected;
        paint(btnPunto, mode === "punto", false, true);
        paint(btnEsq, mode === "esquinas", false, true);
        paint(btnUndo, false, verts.length === 0);
        paint(btnClear, false, verts.length === 0 && !committedRing);
        paint(btnOk, false, !valid);
        badge.textContent =
          mode === "punto"
            ? committedRing ? `Contorno confirmado · ${area || Math.round(ringAreaM2(committedRing) * 100) / 100} m²` : "Toca el mapa para fijar el lugar"
            : verts.length < 3
              ? `Esquinas: ${verts.length} · Agrega al menos 3 para calcular el área`
              : valid
                ? `Esquinas: ${verts.length} · Área ≈ ${area} m²`
                : "Contorno inválido: evita cruces y puntos repetidos";

        if (mode === "esquinas" && lastSelected) {
          onDrawRef.current?.({
            ring: valid ? ring : [],
            lat: Number((center?.lat ?? lastSelected.lat).toFixed(7)),
            lng: Number((center?.lng ?? lastSelected.lng).toFixed(7)),
            areaM2: area,
          });
        }
      };

      btnPunto.onclick = (): void => {
        const candidate: Ring = verts.map((v): [number, number] => [v.lng, v.lat]);
        if (isValidRing(candidate)) {
          committedRing = candidate;
          const center = centroidOf(candidate);
          if (center) lastSelected = center;
          verts.length = 0;
        }
        mode = "punto";
        refresh();
      };
      btnEsq.onclick = (): void => {
        if (committedRing) {
          const center = centroidOf(committedRing);
          if (center) lastSelected = center;
          committedRing = null;
          onDrawRef.current?.({ ring: [], lat: lastSelected?.lat ?? CHUPACA[0], lng: lastSelected?.lng ?? CHUPACA[1], areaM2: 0 });
        }
        mode = "esquinas";
        refresh();
      };
      btnUndo.onclick = (): void => {
        verts.pop();
        if (verts.length) lastSelected = verts[verts.length - 1];
        refresh();
      };
      btnClear.onclick = (): void => {
        if (committedRing) {
          const center = centroidOf(committedRing);
          if (center) lastSelected = center;
        }
        verts.length = 0;
        committedRing = null;
        if (lastSelected) onDrawRef.current?.({ ring: [], ...lastSelected, areaM2: 0 });
        refresh();
      };
      btnOk.onclick = (): void => {
        const ring: Ring = verts.map((v): [number, number] => [v.lng, v.lat]);
        if (!isValidRing(ring)) return;
        const center = centroidOf(ring);
        if (!center) return;
        committedRing = ring;
        lastSelected = center;
        onDrawRef.current?.({
          ring,
          lat: Number(center.lat.toFixed(7)),
          lng: Number(center.lng.toFixed(7)),
          areaM2: Math.round(ringAreaM2(ring) * 100) / 100,
        });
        verts.length = 0;
        mode = "punto";
        refresh();
      };

      map.on("click", (e: unknown) => {
        const ll = (e as { latlng?: L.LatLng }).latlng;
        if (!ll) return;
        const lat = Number(ll.lat.toFixed(7));
        const lng = Number(ll.lng.toFixed(7));
        lastSelected = { lat, lng };
        if (mode === "punto") {
          verts.length = 0;
          committedRing = null;
          if (point) map.removeLayer(point);
          point = L.circleMarker([lat, lng], {
            radius: 7,
            color: MARKER_EDGE,
            fillColor: MARKER_FILL,
            fillOpacity: 0.9,
          }).addTo(map);
          onDrawRef.current?.({ ring: [], lat, lng, areaM2: 0 });
          refresh();
          return;
        }
        if (point) {
          map.removeLayer(point);
          point = null;
        }
        verts.push({ lat, lng });
        refresh();
      });

      refresh();
    }

    const raf = requestAnimationFrame(() => map.invalidateSize());
    const ro =
      typeof ResizeObserver !== "undefined" && divRef.current
        ? new ResizeObserver(() => map.invalidateSize())
        : null;
    if (divRef.current && ro) ro.observe(divRef.current);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      if (bar) bar.remove();
      if (mapRef.current === map) { mapRef.current = null; tileLayerRef.current = null; }
      map.remove();
    };
  }, [editable, plots.length === 0 ? "empty" : plots.map((p) => p.id).join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  function changeBasemap(next: Basemap): void {
    if (next === basemapRef.current) return;
    basemapRef.current = next;
    const map = mapRef.current;
    if (map) {
      tileLayerRef.current?.remove();
      map.setMaxZoom(BASEMAPS[next].maxZoom);
      tileLayerRef.current = createBasemapLayer(next).addTo(map);
    }
    setBasemap(next);
  }

  const instrId = useId();
  return (
    <div className={cn("overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-card", className)}>
      <p id={instrId} className="sr-only">
        Toca el mapa para fijar la ubicación o agrega tres o más esquinas. El área y las coordenadas se actualizan al dibujar; puedes confirmar el contorno antes de continuar.
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white px-3 py-3">
        <div>
          <p className="text-sm font-semibold text-neutral-900">Ubicación y contorno</p>
          <p className="text-xs text-neutral-600">Cambia la vista para ubicar mejor la parcela.</p>
        </div>
        <div role="group" aria-label="Tipo de mapa" className="inline-flex rounded-lg border border-neutral-300 bg-neutral-50 p-1">
          {(["satellite", "streets"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={basemap === option}
              onClick={() => changeBasemap(option)}
              className={cn(
                "min-h-10 rounded-md px-3 text-sm font-semibold transition-colors",
                basemap === option ? "bg-primary-700 text-white shadow-sm" : "text-neutral-700 hover:bg-white",
              )}
            >
              {option === "satellite" ? "Satélite" : "Calles"}
            </button>
          ))}
        </div>
      </div>
      {editable ? <div ref={toolbarRef} className="border-b border-neutral-200 bg-neutral-50 p-2" /> : null}
      <div
        role="region"
        aria-label="Mapa de parcelas"
        aria-describedby={instrId}
        aria-live="polite"
        className={cn("h-[320px] min-h-[280px]", mapClassName)}
      >
        <div ref={divRef} style={{ height: "100%", width: "100%" }} />
      </div>
      <MapLegend editable={editable} />
      <p className="border-t border-neutral-200 px-3 py-2 text-xs text-neutral-600" aria-label="Parcelas en el mapa">
        {plots.length === 0
          ? "Sin parcelas en el mapa."
          : `${plots.length} ${plots.length === 1 ? "parcela en el mapa" : "parcelas en el mapa"}: ${plots.map((p) => p.name).join(", ")}`}
      </p>
    </div>
  );
}





