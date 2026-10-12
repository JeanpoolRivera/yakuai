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
  mobileCards = false,
}: {
  label: string;
  rows: T[];
  columns: TableColumn<T>[];
  rowKey: (row: T) => string | number;
  mobileCards?: boolean;
}): React.JSX.Element {
  return (
    <div className={cn("relative w-full overflow-x-auto rounded-md border border-neutral-200", mobileCards && "mobile-card-table")} role="region" aria-label={label} tabIndex={0}>
      <Table role="table">
        <caption className="sr-only">{label}</caption>
        <TableHeader role="rowgroup">
          <TableRow role="row" className="bg-neutral-50 hover:bg-neutral-50">
            {columns.map((c) => (
              <TableHead role="columnheader" key={c.key} className={cn(c.numeric && "text-right tabular-nums")}>
                {c.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody role="rowgroup">
          {rows.map((row) => (
            <TableRow role="row" key={rowKey(row)}>
              {columns.map((c) => (
                <TableCell role="cell" key={c.key} data-label={c.label} className={cn(c.numeric && "text-right tabular-nums")}>
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
