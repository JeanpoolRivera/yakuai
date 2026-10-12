import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { cn } from "@/lib/utils";

export interface TableColumn<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  numeric?: boolean;
}

/** Tabla simple con el mismo contrato que `DataTable` legacy.
 * Para tablas avanzadas (orden, filtros, paginación) usar TanStack Table en la página.
 */
export function DataTable<T>({
  label,
  rows,
  columns,
  rowKey,
}: {
  label: string;
  rows: T[];
  columns: TableColumn<T>[];
  rowKey: (row: T) => string | number;
}): React.JSX.Element {
  return (
    <div className="relative w-full overflow-x-auto rounded-md border border-neutral-200" role="region" aria-label={label} tabIndex={0}>
      <Table>
        <caption className="sr-only">{label}</caption>
        <TableHeader>
          <TableRow className="bg-neutral-50 hover:bg-neutral-50">
            {columns.map((c) => (
              <TableHead key={c.key} className={cn(c.numeric && "text-right tabular-nums")}>
                {c.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={rowKey(row)}>
              {columns.map((c) => (
                <TableCell key={c.key} data-label={c.label} className={cn(c.numeric && "text-right tabular-nums")}>
                  {c.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}