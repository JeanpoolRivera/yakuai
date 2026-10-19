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

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong/40 bg-white px-6 py-10 text-center",
        className,
      )}
    >
      <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-full bg-neutral-100 text-neutral-600">
        {icon ?? <Inbox className="h-5 w-5" />}
      </span>
      <p className="text-base font-semibold text-neutral-800">{title}</p>
      {description ? <p className="max-w-[52ch] text-sm text-neutral-600">{description}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
