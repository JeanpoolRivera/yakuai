import type {ReactNode} from "react";
export interface TableColumn<T> { key:string; label:string; render:(row:T)=>ReactNode; numeric?:boolean; }
export function DataTable<T>({label,rows,columns,rowKey}:{label:string; rows:T[]; columns:TableColumn<T>[]; rowKey:(row:T)=>string|number}):React.JSX.Element {
 return <div className="table-wrap responsive-table" role="region" aria-label={label} tabIndex={0}>
  <table className="tbl" role="table"><caption className="sr-only">{label}</caption>
   <thead role="rowgroup"><tr role="row">{columns.map(c=><th role="columnheader" scope="col" key={c.key} className={c.numeric?"num":undefined}>{c.label}</th>)}</tr></thead>
   <tbody role="rowgroup">{rows.map(row=><tr role="row" key={rowKey(row)}>{columns.map(c=><td role="cell" key={c.key} data-label={c.label} className={c.numeric?"num":undefined}>{c.render(row)}</td>)}</tr>)}</tbody>
  </table>
 </div>;
}
