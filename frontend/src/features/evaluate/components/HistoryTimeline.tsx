import { useMemo } from "react";
import { CalendarClock } from "lucide-react";
import type { Evaluation } from "@/api/types";
import { cn } from "@/lib/utils";
import { Badge, EmptyState, type BadgeProps } from "@/design-system/primitives";
import { reasonShort } from "../copy";
import { dayKey, dayLabel, litersRange, timeLabel } from "../utils";

type BadgeTone = NonNullable<BadgeProps["tone"]>;

function historyTone(evaluation: Evaluation): BadgeTone {
  return evaluation.is_critical ? "danger" : evaluation.result;
}

export interface HistoryTimelineProps {
  items: Evaluation[];
  className?: string;
}

export function HistoryTimeline({ items, className }: HistoryTimelineProps): React.JSX.Element {
  const groups = useMemo(() => {
    const acc: Array<{ key: string; label: string; items: Evaluation[] }> = [];
    for (const item of items) {
      const key = dayKey(item.evaluated_at);
      const last = acc[acc.length - 1];
      if (last?.key === key) last.items.push(item);
      else acc.push({ key, label: dayLabel(item.evaluated_at), items: [item] });
    }
    return acc;
  }, [items]);

  if (!items.length) {
    return (
      <EmptyState
        icon={<CalendarClock className="h-5 w-5" />}
        title="Sin historial"
        description="Esta parcela aún no tiene evaluaciones."
        className={className}
      />
    );
  }

  return (
    <div className={cn("grid gap-4", className)}>
      {groups.map((group) => (
        <section key={group.key} aria-label={group.label} className="overflow-hidden rounded-lg border border-border bg-white">
          <h3 className="border-b border-border bg-neutral-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-600">
            {group.label}
          </h3>
          <ol>
            {group.items.map((item) => (
              <li
                key={item.id}
                className="grid gap-2 border-b border-border px-4 py-3 last:border-b-0 sm:grid-cols-[7rem_1fr_auto] sm:items-center sm:gap-4"
              >
                <time dateTime={item.evaluated_at} className="text-xs tabular-nums text-neutral-600">
                  {timeLabel(item.evaluated_at)}
                </time>
                <Badge tone={historyTone(item)}>
                  {item.is_critical ? "Riego prioritario" : reasonShort(item.reason)}
                </Badge>
                <span className="text-sm font-semibold tabular-nums text-neutral-800">
                  {litersRange(item.min_liters, item.max_liters) ?? "—"}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
