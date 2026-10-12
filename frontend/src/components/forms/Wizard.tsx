import type { ReactNode } from "react";
import { Button } from "@/components/shadcn/button";
import { Stepper } from "@/components/shadcn/Stepper";

export function Wizard({
  steps,
  current,
  children,
  onBack,
  onNext,
  backLabel = "Atrás",
  nextLabel = "Continuar",
  busy = false,
}: {
  steps: string[];
  current: number;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  busy?: boolean;
}): React.JSX.Element {
  return (
    <div className="grid gap-6">
      <Stepper steps={steps} current={current} />
      <div>{children}</div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>
          {onBack ? (
            <Button variant="outline" onClick={onBack} disabled={current <= 1 || busy}>
              {backLabel}
            </Button>
          ) : null}
        </span>
        {onNext ? (
          <Button onClick={onNext} disabled={busy}>
            {busy ? (
              <>
                <span className="h-4 w-4 animate-spin" aria-hidden="true" />
                {nextLabel}
              </>
            ) : (
              nextLabel
            )}
          </Button>
        ) : null}
      </div>
    </div>
  );
}