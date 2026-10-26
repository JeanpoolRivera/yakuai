/* Mapa de parcelas (Leaflet). Proveedor OSM intacto; chrome con tokens YakuAI. */
import { useEffect, useId, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { centroidOf, ringAreaM2 } from "../../lib/geo";
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

// Colores de marcador/dibujo (dominio mapa; inline styles de la barra propia).
const MARKER_EDGE = "#285942";
const MARKER_FILL = "#386c50";
const SKETCH_EDGE = "#704C10";
const SKETCH_FILL = "#D6B46A";

export function MapLegend({ editable = false }: { editable?: boolean }): React.JSX.Element {
  return (
    <div role="group" aria-label="Leyenda del mapa" className="flex flex-wrap gap-x-5 gap-y-2 border-t border-neutral-200 px-3 py-3 text-xs text-neutral-700">
      <span className="inline-flex items-center gap-2">
        <span aria-hidden="true" className="h-3 w-3 rounded-full border-2 border-[#285942] bg-[#386c50]" />
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
}: {
  plots: PlotPoint[];
  editable?: boolean;
  onDraw?: (d: DrawResult) => void;
  focus?: { lat: number; lng: number } | null;
  zoom?: number;
  className?: string;
}): React.JSX.Element {
  const divRef = useRef<HTMLDivElement>(null);
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
    const map = L.map(divRef.current).setView(
      focusOk ? [focusOk.lat, focusOk.lng] : CHUPACA,
      zoom ?? (focusOk ? 18 : 15),
    );
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

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
    if (plots.length > 0) {
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

      bar = document.createElement("div");
      bar.setAttribute("role", "toolbar");
      bar.setAttribute("aria-label", "Herramientas para marcar parcela");
      bar.setAttribute("aria-orientation", "horizontal");
      bar.setAttribute(
        "style",
        "position:absolute;top:10px;left:10px;z-index:500;display:flex;flex-wrap:wrap;align-items:center;gap:8px;max-width:calc(100% - 20px);padding:8px;background:#ffffff;border:1px solid #E4E8DF;border-radius:12px;box-shadow:0 4px 14px rgba(21,43,32,.12);box-sizing:border-box;",
      );
      const paint = (b: HTMLButtonElement, active: boolean, disabled = false, toggle = false): void => {
        b.type = "button";
        b.disabled = disabled;
        if (toggle) b.setAttribute("aria-pressed", String(active));
        b.setAttribute(
          "style",
          "min-height:44px;padding:8px 12px;background:" + (active ? "#35563D" : "#ffffff") +
            ";color:" + (active ? "#ffffff" : "#202C24") +
            ";border:1px solid #35563D;border-radius:8px;font-size:14px;font-weight:600;cursor:" +
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
      btnOk.textContent = "Usar contorno";
      const badge = document.createElement("div");
      badge.setAttribute("role", "status");
      badge.setAttribute("aria-live", "polite");
      badge.setAttribute(
        "style",
        "display:flex;align-items:center;min-height:40px;padding:6px 10px;background:#F1F3ED;color:#303D33;border-radius:8px;font-size:12px;",
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
      map.getContainer().appendChild(bar);

      const refresh = (): void => {
        sketch.clearLayers();
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
        paint(btnPunto, mode === "punto", false, true);
        paint(btnEsq, mode === "esquinas", false, true);
        paint(btnUndo, false, verts.length === 0);
        paint(btnClear, false, verts.length === 0);
        paint(btnOk, false, verts.length < 3);
        const area =
          verts.length >= 3
            ? Math.round(ringAreaM2(verts.map((v): [number, number] => [v.lng, v.lat])) * 100) / 100
            : 0;
        badge.textContent =
          mode === "punto"
            ? "Toca el mapa para fijar el lugar"
            : `Esquinas: ${verts.length} · Área ≈ ${area} m²`;
      };

      btnPunto.onclick = (): void => {
        mode = "punto";
        refresh();
      };
      btnEsq.onclick = (): void => {
        mode = "esquinas";
        refresh();
      };
      btnUndo.onclick = (): void => {
        verts.pop();
        refresh();
      };
      btnClear.onclick = (): void => {
        verts.length = 0;
        refresh();
      };
      btnOk.onclick = (): void => {
        if (verts.length < 3) return;
        const ring: Ring = verts.map((v): [number, number] => [v.lng, v.lat]);
        const c = centroidOf(ring);
        onDrawRef.current?.({
          ring,
          lat: c ? Number(c.lat.toFixed(7)) : CHUPACA[0],
          lng: c ? Number(c.lng.toFixed(7)) : CHUPACA[1],
          areaM2: Math.round(ringAreaM2(ring) * 100) / 100,
        });
        mode = "punto";
        refresh();
      };

      map.on("click", (e: unknown) => {
        const ll = (e as { latlng?: L.LatLng }).latlng;
        if (!ll) return;
        const lat = Number(ll.lat.toFixed(7));
        const lng = Number(ll.lng.toFixed(7));
        if (mode === "punto") {
          verts.length = 0;
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
      map.remove();
    };
  }, [editable, plots.length === 0 ? "empty" : plots.map((p) => p.id).join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const instrId = useId();
  return (
    <div className={cn("overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-card", className)}>
      <p id={instrId} className="sr-only">
        Toca el mapa para fijar el lugar, o usa el botón Marcar esquinas para agregar
        todas las esquinas que necesites y luego Usar contorno. El dibujo autocompleta
        el paso 2 del formulario.
      </p>
      <div
        role="region"
        aria-label="Mapa de parcelas"
        aria-describedby={instrId}
        aria-live="polite"
        className="h-[320px] min-h-[280px]"
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