import { useMemo, useState } from "react";
import { Check, Droplet, Sprout } from "lucide-react";
import type { Plot } from "@/api/types";
import { cn } from "@/lib/utils";
import { fmtDate, fmtNum } from "@/lib/format";
import {
  Button,
  EmptyState,
  SearchInput,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/design-system/primitives";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { IRRIGATION_SYSTEM_LABEL, PLOT_HEADER_NOTE } from "../copy";

function PlotList({
  plots,
  selectedId,
  onSelect,
  showFarmerBadge,
  disabled,
}: {
  plots: Plot[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  showFarmerBadge: boolean;
  disabled: boolean;
}): React.JSX.Element {
  return (
    <ul className="grid gap-1">
      {plots.map((plot) => {
        const selected = selectedId === plot.id;
        return (
          <li key={plot.id}>
            <button
              type="button"
              aria-pressed={selected}
              aria-label={`Seleccionar ${plot.name}`}
              disabled={disabled}
              onClick={() => onSelect(plot.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-50",
                selected ? "border-brand-soft bg-brand-soft" : "border-transparent hover:bg-brand-soft/60",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-md",
                  selected ? "bg-brand text-white" : "bg-brand-soft text-brand",
                )}
              >
                <Sprout className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm font-semibold text-neutral-800">{plot.name}</strong>
                <small className="block truncate text-xs text-neutral-600">
                  {plot.crop?.name ?? "Sin cultivo"} · {fmtNum(plot.area_m2)} m²
                </small>
                {showFarmerBadge && plot.farmer?.name ? (
                  <small className="mt-1 block truncate text-xs text-neutral-600">{plot.farmer.name}</small>
                ) : null}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border",
                  selected ? "border-brand bg-brand text-white" : "border-border",
                )}
              >
                {selected ? <Check className="h-3 w-3" /> : null}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export interface PlotSelectorProps {
  plots: Plot[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onEvaluate: () => void;
  evaluating?: boolean;
  disabled?: boolean;
  showFarmerBadge?: boolean;
  className?: string;
}

export function PlotSelector({
  plots,
  selectedId,
  onSelect,
  onEvaluate,
  evaluating = false,
  disabled = false,
  showFarmerBadge = false,
  className,
}: PlotSelectorProps): React.JSX.Element {
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(9);
  const [sheetOpen, setSheetOpen] = useState(false);

  const selected = useMemo(() => plots.find((plot) => plot.id === selectedId) ?? null, [plots, selectedId]);
  const matching = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return plots;
    return plots.filter((plot) => `${plot.name} ${plot.crop?.name ?? ""}`.toLocaleLowerCase().includes(needle));
  }, [plots, query]);

  const list = (
    <div className="grid gap-3">
      <SearchInput
        label="Buscar parcela o cultivo"
        placeholder="Buscar parcela o cultivo"
        value={query}
        onChange={(value) => {
          setQuery(value);
          setVisible(9);
        }}
        disabled={disabled}
      />
      {!plots.length ? (
        <EmptyState
          icon={<Sprout className="h-5 w-5" />}
          title="Sin parcelas"
          description="Primero debe registrarse una parcela."
        />
      ) : !matching.length ? (
        <EmptyState
          title="No encontramos esa parcela"
          description="Prueba con otro nombre o cultivo."
          action={
            <Button variant="outline" onClick={() => setQuery("")}>
              Ver todas las parcelas
            </Button>
          }
        />
      ) : (
        <>
          <PlotList
            plots={matching.slice(0, visible)}
            selectedId={selectedId}
            onSelect={(id) => {
              setSheetOpen(false);
              onSelect(id);
            }}
            showFarmerBadge={showFarmerBadge}
            disabled={disabled}
          />
          {visible < matching.length ? (
            <Button variant="ghost" onClick={() => setVisible((n) => n + 9)}>
              Mostrar más parcelas
            </Button>
          ) : null}
        </>
      )}
    </div>
  );

  const context = selected ? (
    <dl className="grid gap-2 text-xs">
      <div className="flex justify-between gap-3">
        <dt className="text-neutral-600">Sistema de riego</dt>
        <dd className="font-medium text-neutral-800">{IRRIGATION_SYSTEM_LABEL[selected.irrigation_system]}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-neutral-600">Fecha de siembra</dt>
        <dd className="font-medium text-neutral-800">{fmtDate(selected.sowing_date)}</dd>
      </div>
    </dl>
  ) : (
    <p className="text-xs text-neutral-600">Selecciona una parcela para continuar.</p>
  );

  const evaluate = (
    <Button
      className="w-full"
      onClick={onEvaluate}
      disabled={!selected || disabled || evaluating}
      loading={evaluating}
    >
      <Droplet className="h-4 w-4" aria-hidden="true" />
      Evaluar esta parcela
    </Button>
  );

  return (
    <aside
      aria-label="Seleccionar parcela"
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-white shadow-sm",
        "lg:sticky lg:top-[84px] lg:flex lg:max-h-[calc(100dvh-6.5rem)] lg:flex-col",
        className,
      )}
    >
      <header className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-800">Selecciona la parcela</h2>
          <p className="text-xs text-neutral-600">{showFarmerBadge ? PLOT_HEADER_NOTE.staff : PLOT_HEADER_NOTE.farmer}</p>
        </div>
      </header>

      {isMobile ? (
        <div className="grid gap-4 p-4">
          <div className="rounded-lg border border-border p-4">
            {selected ? (
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-md bg-brand text-white">
                  <Sprout className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <strong className="block truncate text-sm font-semibold text-neutral-800">{selected.name}</strong>
                  <small className="block truncate text-xs text-neutral-600">
                    {selected.crop?.name ?? "Sin cultivo"} · {fmtNum(selected.area_m2)} m²
                  </small>
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-600">Ninguna parcela seleccionada.</p>
            )}
          </div>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline">Cambiar parcela</Button>
            </SheetTrigger>
            <SheetContent side="bottom">
              <SheetHeader>
                <SheetTitle>Elegir parcela</SheetTitle>
                <SheetDescription>Busca y elige la parcela que quieres evaluar.</SheetDescription>
              </SheetHeader>
              {list}
            </SheetContent>
          </Sheet>
          {context}
          {evaluate}
        </div>
      ) : (
        <div className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
          <div className="p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">{list}</div>
          <div className="grid gap-4 border-t border-border bg-neutral-50/60 p-4">
            {context}
            {evaluate}
          </div>
        </div>
      )}
    </aside>
  );
}
