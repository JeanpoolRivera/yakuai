import type { ReactNode } from "react";
import { CheckCircle2, CircleAlert, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  success: {
    box: "border-success-fg/20 bg-success-bg text-success-fg",
    Icon: CheckCircle2,
    role: "status" as const,
  },
  warning: {
    box: "border-warning-fg/20 bg-warning-bg text-warning-fg",
    Icon: TriangleAlert,
    role: "status" as const,
  },
  info: {
    box: "border-info-fg/20 bg-info-bg text-info-fg",
    Icon: Info,
    role: "status" as const,
  },
  danger: {
    box: "border-danger-fg/20 bg-danger-bg text-danger-fg",
    Icon: CircleAlert,
    role: "alert" as const,
  },
} as const;

export interface AlertProps {
  tone?: keyof typeof TONES;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function Alert({
  tone = "info",
  title,
  children,
  action,
  className,
}: AlertProps): React.JSX.Element {
  const { box, Icon, role } = TONES[tone];
  return (
    <div role={role} className={cn("flex items-start gap-3 rounded-md border p-4 text-sm", box, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-medium text-neutral-900">{title}</p> : null}
        <div className={cn("text-neutral-700", title && "mt-0.5")}>{children}</div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
