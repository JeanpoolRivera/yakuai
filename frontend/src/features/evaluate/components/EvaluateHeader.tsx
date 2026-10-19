import { FieldModeToggle } from "@/design-system/primitives";

export function EvaluateHeader(): React.JSX.Element {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="grid gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[.1em] text-brand">Gestión del riego</p>
        <h1 className="text-d2 font-bold tracking-tight text-neutral-900">Evaluar riego</h1>
        <p className="max-w-prose text-sm text-neutral-600">Una decisión de riego, con los datos de tu parcela.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FieldModeToggle />
      </div>
    </header>
  );
}
