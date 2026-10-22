/* Mapa de parcelas con Leaflet, imágenes satelitales de Esri y dibujo de contornos. */
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

const MARKER_EDGE = "#285942";
const MARKER_FILL = "#386c50";
const SKETCH_EDGE = "#b3541e";
const SKETCH_FILL = "#e07b39";

export function PlotMap({
  plots,
  editable = false,
  onDraw,
  focus,
  zoom,
  className,
  mapHeightClassName = "h-[320px] min-h-[280px]",
}: {
  plots: PlotPoint[];
  editable?: boolean;
  onDraw?: (d: DrawResult) => void;
  focus?: { lat: number; lng: number } | null;
  zoom?: number;
  className?: string;
  mapHeightClassName?: string;
}): React.JSX.Element {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const onDrawRef = useRef(onDraw);

  useEffect(() => {
    onDrawRef.current = onDraw;
  }, [onDraw]);

  // Crear el mapa cuando se monta el componente.
  useEffect(() => {
    const container = divRef.current;
    if (!container) return;

    // Evitar reutilizar una instancia de Leaflet anterior.
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const focusOk =
      focus &&
      Number.isFinite(focus.lat) &&
      Number.isFinite(focus.lng)
        ? focus
        : null;

    const initialCenter: L.LatLngExpression = focusOk
      ? [focusOk.lat, focusOk.lng]
      : CHUPACA;

    const initialZoom = zoom ?? (focusOk ? 18 : 15);

    const map = L.map(container).setView(initialCenter, initialZoom);
    mapRef.current = map;

    // Imágenes satelitales de Esri: se conserva el proveedor actual.
    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          "Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community",
        maxZoom: 23,
        maxNativeZoom: 17,
      },
    ).addTo(map);

    // Mostrar los puntos de las parcelas registradas.
    const markers = L.featureGroup().addTo(map);

    for (const p of plots) {
      const lat = Number(p.latitude);
      const lng = Number(p.longitude);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

      const popup = document.createElement("div");
      const title = document.createElement("strong");

      title.textContent = p.name;
      popup.append(title);

      if (p.farmerName) {
        popup.append(
          document.createElement("br"),
          document.createTextNode(p.farmerName),
        );
      }

      L.circleMarker([lat, lng], {
        radius: 7,
        color: MARKER_EDGE,
        fillColor: MARKER_FILL,
        fillOpacity: 0.9,
      })
        .bindPopup(popup)
        .addTo(markers);
    }

    // En el mapa general, ajustar la vista a las parcelas existentes.
    // En el formulario, conservar el foco de la parcela que se está creando.
    if (!focusOk && plots.length > 0) {
      const points = plots
        .map(
          (p): [number, number] => [
            Number(p.latitude),
            Number(p.longitude),
          ],
        )
        .filter(
          ([lat, lng]) =>
            Number.isFinite(lat) && Number.isFinite(lng),
        );

      if (points.length > 0) {
        if (points.length === 1) {
          map.setView(points[0], zoom ?? 18);
        } else {
          map.fitBounds(L.latLngBounds(points).pad(0.3));
        }
      }
    }

    // Herramientas para marcar la ubicación y dibujar el contorno.
    let bar: HTMLDivElement | null = null;

    if (editable) {
      let mode: "punto" | "esquinas" = "punto";
      const verts: Array<{ lat: number; lng: number }> = [];
      const sketch = L.layerGroup().addTo(map);
      let point: L.Layer | null = null;

      bar = document.createElement("div");
      bar.setAttribute(
        "style",
        "position:absolute;top:10px;left:10px;z-index:1000;" +
          "display:flex;flex-wrap:wrap;gap:6px;max-width:92%;",
      );

      const paint = (
        button: HTMLButtonElement,
        active: boolean,
      ): void => {
        button.type = "button";
        button.setAttribute(
          "style",
          `background:${active ? "#285942" : "#ffffff"};` +
            `color:${active ? "#ffffff" : "#111111"};` +
            "border:1px solid #285942;border-radius:8px;" +
            "padding:6px 10px;font-size:13px;cursor:pointer;",
        );
      };

      const btnPunto = document.createElement("button");
      btnPunto.textContent = "📍 1) Fijar punto";

      const btnEsq = document.createElement("button");
      btnEsq.textContent = "⬠ 2) Marcar esquinas";

      const btnUndo = document.createElement("button");
      btnUndo.textContent = "↩ Quitar última";

      const btnClear = document.createElement("button");
      btnClear.textContent = "🗑 Limpiar";

      const btnOk = document.createElement("button");
      btnOk.textContent = "✔ Usar contorno";

      const badge = document.createElement("div");
      badge.setAttribute(
        "style",
        "background:#285942;color:#ffffff;border-radius:8px;" +
          "padding:6px 10px;font-size:13px;",
      );

      bar.append(btnPunto, btnEsq, btnUndo, btnClear, btnOk, badge);
      map.getContainer().appendChild(bar);

      const refresh = (): void => {
        sketch.clearLayers();

        for (const vertex of verts) {
          L.circleMarker([vertex.lat, vertex.lng], {
            radius: 5,
            color: SKETCH_EDGE,
            fillColor: SKETCH_FILL,
            fillOpacity: 1,
          }).addTo(sketch);
        }

        if (verts.length >= 2) {
          const line: Array<[number, number]> = verts.map(
            (vertex): [number, number] => [
              vertex.lat,
              vertex.lng,
            ],
          );

          if (verts.length >= 3) {
            line.push([verts[0].lat, verts[0].lng]);
          }

          L.polyline(line, { color: SKETCH_EDGE }).addTo(sketch);
        }

        paint(btnPunto, mode === "punto");
        paint(btnEsq, mode === "esquinas");
        paint(btnUndo, false);
        paint(btnClear, false);
        paint(btnOk, verts.length >= 3);

        btnOk.style.opacity = verts.length >= 3 ? "1" : "0.5";

        const area =
          verts.length >= 3
            ? Math.round(
                ringAreaM2(
                  verts.map(
                    (vertex): [number, number] => [
                      vertex.lng,
                      vertex.lat,
                    ],
                  ),
                ) * 100,
              ) / 100
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

        if (point) {
          map.removeLayer(point);
          point = null;
        }

        refresh();
      };

      btnOk.onclick = (): void => {
        if (verts.length < 3) return;

        const ring: Ring = verts.map(
          (vertex): [number, number] => [
            vertex.lng,
            vertex.lat,
          ],
        );

        const center = centroidOf(ring);

        onDrawRef.current?.({
          ring,
          lat: center
            ? Number(center.lat.toFixed(7))
            : CHUPACA[0],
          lng: center
            ? Number(center.lng.toFixed(7))
            : CHUPACA[1],
          areaM2: Math.round(ringAreaM2(ring) * 100) / 100,
        });

        mode = "punto";
        refresh();
      };

      map.on("click", (event: L.LeafletMouseEvent) => {
        const lat = Number(event.latlng.lat.toFixed(7));
        const lng = Number(event.latlng.lng.toFixed(7));

        if (mode === "punto") {
          verts.length = 0;

          if (point) map.removeLayer(point);

          point = L.circleMarker([lat, lng], {
            radius: 7,
            color: MARKER_EDGE,
            fillColor: MARKER_FILL,
            fillOpacity: 0.9,
          }).addTo(map);

          onDrawRef.current?.({
            ring: [],
            lat,
            lng,
            areaM2: 0,
          });

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

    // Recalcular el tamaño cuando el diálogo ya es visible.
    const invalidateMapSize = (): void => {
      if (!container.isConnected) return;

      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      map.invalidateSize({ pan: false });
    };

    let secondFrame: number | null = null;

    const firstFrame = requestAnimationFrame(() => {
      invalidateMapSize();

      secondFrame = requestAnimationFrame(() => {
        invalidateMapSize();
      });
    });

    const resizeTimer = window.setTimeout(invalidateMapSize, 400);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(invalidateMapSize)
        : null;

    resizeObserver?.observe(container);

    map.on("load", invalidateMapSize);

    return () => {
      cancelAnimationFrame(firstFrame);

      if (secondFrame !== null) {
        cancelAnimationFrame(secondFrame);
      }

      window.clearTimeout(resizeTimer);
      resizeObserver?.disconnect();
      map.off("load", invalidateMapSize);

      if (bar) bar.remove();

      map.remove();

      if (mapRef.current === map) {
        mapRef.current = null;
      }
    };
  }, [editable, plots]);

  // Actualizar el centro sin destruir el mapa ni borrar los vértices dibujados.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const focusOk =
      focus &&
      Number.isFinite(focus.lat) &&
      Number.isFinite(focus.lng);

    if (focusOk && focus) {
      map.setView(
        [focus.lat, focus.lng],
        zoom ?? 18,
        { animate: false },
      );
    } else if (zoom !== undefined) {
      map.setZoom(zoom, { animate: false });
    }

    const frame = requestAnimationFrame(() => {
      if (mapRef.current === map) {
        map.invalidateSize({ pan: false });
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [focus?.lat, focus?.lng, zoom]);

  const instrId = useId();

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-card",
        className,
      )}
    >
      <p id={instrId} className="sr-only">
        Toca el mapa para fijar el lugar, o usa el botón Marcar
        esquinas para agregar todas las esquinas que necesites y
        luego Usar contorno. El dibujo autocompleta el paso 2
        del formulario.
      </p>

      <div
        role="region"
        aria-label="Mapa de parcelas"
        aria-describedby={instrId}
        aria-live="polite"
        className={cn(
          "relative z-0 w-full overflow-hidden",
          mapHeightClassName,
        )}
        style={{
          display: "block",
          height: editable ? "280px" : "240px",
          minHeight: editable ? "280px" : "180px",
          width: "100%",
          position: "relative",
          backgroundColor: "#e8edf0",
        }}
      >
        <div
          ref={divRef}
          className="absolute inset-0"
          style={{ height: "100%", width: "100%" }}
        />
      </div>

      <p
        className="border-t border-neutral-200 px-3 py-2 text-xs text-neutral-500"
        aria-label="Parcelas en el mapa"
      >
        {plots.length === 0
          ? "Sin parcelas en el mapa."
          : `${plots.length} ${
              plots.length === 1
                ? "parcela en el mapa"
                : "parcelas en el mapa"
            }: ${plots.map((plot) => plot.name).join(", ")}`}
      </p>
    </div>
  );
}