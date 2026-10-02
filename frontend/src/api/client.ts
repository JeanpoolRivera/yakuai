/* Cliente HTTP tipado para api/v1. Envuelve {data}, normaliza paginados y errores. */

export interface ApiErrorBody {
  error?: { message?: string; fields?: Record<string, string[]> };
  message?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  status: number;
  fields: Record<string, string[]>;
  /** Cuerpo útil aunque el estado sea error (ej. evaluación incompleta → 422 con {data}). */
  data: unknown;

  constructor(message: string, status = 0, fields: Record<string, string[]> = {}, data: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
    this.data = data;
  }
}

const TOKEN_KEY = "yakuai-token";

let token = "";
try {
  token = localStorage.getItem(TOKEN_KEY) ?? "";
} catch {
  token = "";
}

export function setToken(value: string): void {
  token = value;
  try {
    if (value) localStorage.setItem(TOKEN_KEY, value);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* almacenamiento no disponible */
  }
}

export function getToken(): string {
  return token;
}

interface ApiOptions {
  method?: string;
  body?: unknown;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`/api/v1/${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError("No hay conexión con el servidor. Revisa tu red e inténtalo de nuevo.", 0);
  }

  if (response.status === 204) return {} as T;
  const payload = (await response.json().catch(() => ({}))) as ApiErrorBody & { data?: T; current_page?: number; last_page?: number };

  if (!response.ok) {
    const fields = payload.error?.fields ?? payload.errors ?? {};
    const message =
      payload.error?.message ?? payload.message ?? "No se pudo completar la solicitud.";
    if (response.status === 401) {
      // Sesión vencida: la capa de auth la cierra sin acoplarse a este módulo.
      window.dispatchEvent(new Event("yakuai-unauthorized"));
    }
    throw new ApiError(message, response.status, fields, payload.data ?? null);
  }
  // Laravel list endpoints return pagination beside data, not inside it.
  // Keep that metadata so apiList can continue to subsequent pages.
  if (Array.isArray(payload.data) && typeof payload.last_page === "number") {
    return payload as T;
  }
  return payload.data as T;
}

interface PageEnvelope<T> {
  data: T[];
  current_page?: number;
  last_page?: number;
}

/**
 * Listados del backend.
 * - Paginados Laravel ({data, current_page, last_page}): recorre páginas hasta `limit`.
 * - No paginados ({data: [...][]}): devuelve el arreglo directo.
 */
export async function apiList<T>(path: string, limit = 200): Promise<T[]> {
  const sep = path.includes("?") ? "&" : "?";
  const first = await api<PageEnvelope<T> | T[]>(`${path}${sep}page=1`);
  const arr = Array.isArray(first) ? first : (first.data ?? []);
  if (Array.isArray(first) || first.last_page === undefined || (first.current_page ?? 1) >= (first.last_page ?? 1)) {
    return arr.slice(0, limit);
  }
  const out = [...arr];
  const last = first.last_page ?? 1;
  for (let p = 2; p <= last && out.length < limit; p += 1) {
    const page = await api<PageEnvelope<T>>(`${path}${sep}page=${p}`);
    if (Array.isArray(page)) break;
    out.push(...(page.data ?? []));
  }
  return out.slice(0, limit);
}

/** Mensaje comprensible para el usuario final (sin tecnicismos). */
export function friendlyError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 0) return "Sin conexión con el servidor. Inténtalo de nuevo.";
    if (err.status === 401) return "Tu sesión venció. Vuelve a ingresar.";
    if (err.status === 403) return "No tienes permiso para esta acción.";
    if (err.status === 409) return err.message || "Ese registro ya existe.";
    if (err.status === 429) return "Demasiados intentos. Espera un minuto e inténtalo de nuevo.";
    if (err.status === 422 && err.data) return "Faltan datos para decidir. Revisa el detalle.";
    if (err.status === 422) return err.message || "Revisa los datos del formulario.";
    return err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

/** Une query params ignorando vacíos. */
export function qs(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}
