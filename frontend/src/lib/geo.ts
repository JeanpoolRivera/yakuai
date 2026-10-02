/* Utilidades geográficas: área de un anillo dibujado (aprox. equirectangular). */

export type Ring = Array<[number, number]>; // [lng, lat]

export function ringAreaM2(ring: Ring): number {
  if (ring.length < 3) return 0;
  const R = 6371000;
  const lat0 = ring.reduce((a, p) => a + p[1], 0) / ring.length;
  const cos = Math.cos((lat0 * Math.PI) / 180);
  const pts = ring.map(([lng, lat]) => [(lng * Math.PI * R * cos) / 180, (lat * Math.PI * R) / 180]);
  let sum = 0;
  for (let i = 0; i < pts.length; i += 1) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum / 2);
}

export function centroidOf(ring: Ring): { lat: number; lng: number } | null {
  if (ring.length === 0) return null;
  const lat = ring.reduce((a, p) => a + p[1], 0) / ring.length;
  const lng = ring.reduce((a, p) => a + p[0], 0) / ring.length;
  return { lat, lng };
}
