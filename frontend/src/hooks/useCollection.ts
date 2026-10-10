/* Colección en cliente: búsqueda + filtro + orden + paginación. */
import { useMemo, useState } from "react";

export interface Collection<T> {
  query: string;
  setQuery: (v: string) => void;
  page: number;
  setPage: (p: number) => void;
  total: number;
  pages: number;
  items: T[];
  perPage: number;
}

export function useCollection<T>(
  source: T[],
  opts: {
    perPage?: number;
    search?: (item: T, q: string) => boolean;
    filter?: (item: T) => boolean;
    sort?: (a: T, b: T) => number;
  } = {},
): Collection<T> {
  const { perPage = 8, search, filter, sort } = opts;
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let out = source;
    if (filter) out = out.filter(filter);
    const q = query.trim().toLowerCase();
    if (q && search) out = out.filter((it) => search(it, q));
    if (sort) out = [...out].sort(sort);
    return out;
  }, [source, query, search, filter, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, pages);
  const items = useMemo(
    () => filtered.slice((safePage - 1) * perPage, safePage * perPage),
    [filtered, safePage, perPage],
  );

  return {
    query,
    setQuery: (v: string) => {
      setQuery(v);
      setPage(1);
    },
    page: safePage,
    setPage,
    total: filtered.length,
    pages,
    items,
    perPage,
  };
}
