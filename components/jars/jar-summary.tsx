import { CircleAlertIcon, CircleCheckIcon, TrendingUpIcon } from "lucide-react";
import { Money } from "@/components/ui/money";
import { categoryIcon } from "@/lib/category-icons";
import type { JarSnapshot } from "@/lib/data";
import type { JarStatus } from "@/lib/goals";
import { m } from "@/lib/i18n";
import { formatBRL } from "@/lib/money";
import { swatch } from "@/lib/palette";
import { cn } from "@/lib/utils";

const statusStyle = {
  done: { icon: CircleCheckIcon, className: "text-income" },
  "on-track": { icon: TrendingUpIcon, className: "text-link" },
  behind: { icon: CircleAlertIcon, className: "text-warning" },
} as const;

export function JarStatusLabel({ status }: { status: JarStatus }) {
  const { icon: Icon, className } = statusStyle[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-footnote font-semibold",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      {m.jars.status[status]}
    </span>
  );
}

export function JarProgress({
  snapshot,
  showName = true,
}: {
  snapshot: JarSnapshot;
  showName?: boolean;
}) {
  const { jar, balance, forecast } = snapshot;
  const Icon = categoryIcon(jar.icon);
  const target = jar.target_cents;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full text-swatch-foreground",
            swatch(jar.color),
          )}
        >
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          {showName && (
            <span className="truncate text-body font-medium">{jar.name}</span>
          )}
          <Money
            cents={balance}
            className={cn(
              "font-bold tracking-tight tabular-nums",
              showName ? "text-title3" : "text-display",
            )}
          />
        </span>
      </div>
      {target && (
        <div className="flex flex-col gap-1.5">
          <span className="h-2 overflow-hidden rounded-full bg-muted">
            <span
              className={cn(
                "block h-full origin-left animate-grow-x rounded-full transition-[width] duration-500 forced-color-adjust-none",
                swatch(jar.color),
              )}
              style={{
                width: `${Math.min(Math.max(balance, 0) / target, 1) * 100}%`,
              }}
            />
          </span>
          <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-footnote text-muted-foreground tabular-nums">
            <span>
              {m.jars.ofGoal(
                Math.floor((Math.max(balance, 0) * 100) / target),
                formatBRL(target),
              )}
            </span>
            {forecast.status && <JarStatusLabel status={forecast.status} />}
          </span>
        </div>
      )}
    </div>
  );
}
