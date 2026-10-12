interface PaginationControlsProps {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
  count?: string;
}

export function PaginationControls({
  page,
  pages,
  onPageChange,
  count,
}: PaginationControlsProps) {
  if (pages <= 1) {
    return count ? <span className="text-xs text-neutral-500">{count}</span> : null;
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Página anterior"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        <span>Anterior</span>
      </button>
      <nav aria-label="Paginación" className="flex items-center gap-1">
        <button
          type="button"
          className="inline-flex h-9 min-w-9 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => onPageChange(1)}
          aria-current={1 === page ? "page" : undefined}
          disabled={page === 1}
        >
          1
        </button>
        {page > 3 && <span className="flex h-9 w-8 items-center justify-center text-neutral-400">…</span>}
        <button
          type="button"
          className="inline-flex h-9 min-w-9 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => onPageChange(2)}
          aria-current={2 === page ? "page" : undefined}
          disabled={false}
        >
          2
        </button>
        <button
          type="button"
          className="inline-flex h-9 min-w-9 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => onPageChange(3)}
          aria-current={3 === page ? "page" : undefined}
          disabled={false}
        >
          3
        </button>
        <button
          type="button"
          className="inline-flex h-9 min-w-9 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => onPageChange(4)}
          aria-current={4 === page ? "page" : undefined}
          disabled={false}
        >
          4
        </button>
        <button
          type="button"
          className="inline-flex h-9 min-w-9 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => onPageChange(5)}
          aria-current={5 === page ? "page" : undefined}
          disabled={false}
        >
          5
        </button>
        <button
          type="button"
          disabled={page >= 5}
          onClick={() => onPageChange(6)}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Página siguiente"
        >
          <span>Siguiente</span>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
        </button>
      </nav>
    </div>
  );
}