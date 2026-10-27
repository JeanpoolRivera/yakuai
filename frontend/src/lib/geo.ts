/* Utilidades geográficas para contornos de parcelas (coordenadas [lng, lat]). */

export type Ring = Array<[number, number]>;

const EARTH_RADIUS_M = 6_371_000;
const DEG_TO_RAD = Math.PI / 180;

type XY = [number, number];

function projectRing(ring: Ring): { points: XY[]; originLng: number; originLat: number; cosLat: number } {
  const originLng = ring[0]?.[0] ?? 0;
  const originLat = ring.reduce((sum, point) => sum + point[1], 0) / ring.length;
  const cosLat = Math.cos(originLat * DEG_TO_RAD);
  const points = ring.map(([lng, lat]): XY => [
    EARTH_RADIUS_M * cosLat * (lng - originLng) * DEG_TO_RAD,
    EARTH_RADIUS_M * (lat - originLat) * DEG_TO_RAD,
  ]);
  return { points, originLng, originLat, cosLat };
}

function signedDoubleArea(points: XY[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    sum += x1 * y2 - x2 * y1;
  }
  return sum;
}

export function ringAreaM2(ring: Ring): number {
  if (ring.length < 3 || ring.some(([lng, lat]) => !Number.isFinite(lng) || !Number.isFinite(lat))) return 0;
  const { points } = projectRing(ring);
  return Math.abs(signedDoubleArea(points) / 2);
}

function orientation(a: XY, b: XY, c: XY): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function segmentsIntersect(a: XY, b: XY, c: XY, d: XY): boolean {
  const abC = orientation(a, b, c);
  const abD = orientation(a, b, d);
  const cdA = orientation(c, d, a);
  const cdB = orientation(c, d, b);
  return abC * abD < 0 && cdA * cdB < 0;
}

export function isValidRing(ring: Ring): boolean {
  if (ring.length < 3 || ring.some(([lng, lat]) => !Number.isFinite(lng) || !Number.isFinite(lat))) return false;
  if (ringAreaM2(ring) < 0.01) return false;
  const projected = projectRing(ring).points;
  for (let i = 0; i < projected.length; i += 1) {
    const a = projected[i];
    const b = projected[(i + 1) % projected.length];
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.01) return false;
    for (let j = i + 1; j < projected.length; j += 1) {
      const adjacent = j === (i + 1) % projected.length || (j + 1) % projected.length === i;
      if (adjacent) continue;
      if (segmentsIntersect(a, b, projected[j], projected[(j + 1) % projected.length])) return false;
    }
  }
  return true;
}

export function centroidOf(ring: Ring): { lat: number; lng: number } | null {
  if (ring.length < 3 || ring.some(([lng, lat]) => !Number.isFinite(lng) || !Number.isFinite(lat))) return null;
  const { points, originLng, originLat, cosLat } = projectRing(ring);
  const doubleArea = signedDoubleArea(points);
  if (Math.abs(doubleArea) < 0.01 || Math.abs(cosLat) < 1e-8) return null;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < points.length; i += 1) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    const cross = x1 * y2 - x2 * y1;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  cx /= 3 * doubleArea;
  cy /= 3 * doubleArea;
  return {
    lng: originLng + (cx / (EARTH_RADIUS_M * cosLat)) / DEG_TO_RAD,
    lat: originLat + (cy / EARTH_RADIUS_M) / DEG_TO_RAD,
  };
}
