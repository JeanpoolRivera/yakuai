import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  text?: string;
  className?: string;
}

export function LoadingState({ text = "Cargando…", className }: LoadingStateProps): React.JSX.Element {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex items-center justify-center gap-3 py-10 text-sm text-neutral-600", className)}
    >
      <LoaderCircle className="h-5 w-5 animate-spin text-brand" aria-hidden="true" />
      {text}
    </div>
  );
}
