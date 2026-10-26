import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-12 text-center",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="grid h-12 w-12 place-items-center rounded-md bg-primary-50 text-primary-600"
      >
        {icon ?? <Inbox className="h-5 w-5" />}
      </span>
      <p className="font-display text-xl font-medium text-neutral-900">{title}</p>
      {description ? (
        <p className="max-w-[42ch] text-sm text-neutral-600 text-pretty">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
