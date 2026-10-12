import type { ReactNode } from "react";
import { Button } from "./button";
import { Stepper } from "./Stepper";
import { cn } from "@/lib/utils";

interface WizardProps {
  steps: string[];
  current: number;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  busy?: boolean;
  className?: string;
}

export function Wizard({
  steps,
  current,
  children,
  onBack,
  onNext,
  backLabel = "Atrás",
  nextLabel = "Continuar",
  busy = false,
  className,
}: WizardProps) {
  return (
    <div className={cn("grid gap-6", className)}>
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