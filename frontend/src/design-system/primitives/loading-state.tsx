import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  text?: string;
  className?: string;
}

export function LoadingState({
  text = "Cargando…",
  className,
}: LoadingStateProps): React.JSX.Element {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-sm text-neutral-600",
        className,
      )}
    >
      <LoaderCircle className="h-6 w-6 animate-spin text-primary-500" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}
