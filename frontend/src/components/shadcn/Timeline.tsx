import { cn } from "@/lib/utils";

interface TimelineItem {
  date: string;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  meta?: string;
  action?: React.ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={cn("grid gap-3", className)}>
      {items.map((item, i) => (
        <li key={`${item.title}-${i}`} className="flex gap-3">
          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700">
            {item.icon || (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-neutral-800">{item.title}</h4>
              {item.meta && <span className="text-xs text-neutral-500">{item.meta}</span>}
            </div>
            <p className="text-sm text-neutral-600">{item.subtitle}</p>
            {item.action && (
              <div className="mt-2">{item.action}</div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}