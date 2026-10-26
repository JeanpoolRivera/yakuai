import { Plus } from "lucide-react";
import { Button, FieldModeToggle } from "@/design-system/primitives";
import { pageCopy } from "../copy";

export interface IrrigationHeaderProps {
  isStaff: boolean;
  onCreate: () => void;
}

export function IrrigationHeader({ isStaff, onCreate }: IrrigationHeaderProps): React.JSX.Element {
  const copy = pageCopy(isStaff);

  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="grid gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[.1em] text-brand">{copy.eyebrow}</p>
        <h1 className="text-d2 font-bold tracking-tight text-neutral-900">{copy.title}</h1>
        <p className="text-sm text-neutral-600">{copy.description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FieldModeToggle />
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {copy.cta}
        </Button>
      </div>
    </header>
  );
}
