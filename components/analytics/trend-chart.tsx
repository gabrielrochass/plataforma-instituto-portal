import type { Route } from "next";
import Link from "next/link";
import type { MonthBar } from "@/lib/analytics";
import { formatMonth, formatShortMonth } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

const chartHeight = "9rem";

export function TrendChart({
  bars,
  average,
  selected,
  current,
  tone = "expense",
  hrefFor,
}: {
  bars: MonthBar[];
  average: number | null;
  selected: string;
  current: string;
  tone?: "expense" | "income";
  hrefFor: (month: string) => Route;
}) {
  const max = Math.max(average ?? 0, ...bars.map((bar) => bar.cents), 1);
  const hasPartial = bars.some((bar) => bar.month === current);

  return (
    <figure className="flex flex-col gap-4 rounded-2xl bg-card py-4">
      <figcaption className="flex flex-col gap-0.5 px-4">
        <span className="text-headline font-semibold">
          {selected === current
            ? m.analysis.trend
            : m.analysis.trendUntil(formatMonth(selected))}
        </span>
        <span className="text-footnote text-muted-foreground">
          {average === null
            ? m.analysis.trendNoAverage
            : m.analysis.trendAverage(formatBRL(average))}
        </span>
      </figcaption>
      <div className="flex flex-row-reverse overflow-x-auto px-4">
        <div className="relative min-w-full shrink-0">
          <ol className="grid grid-cols-[repeat(12,minmax(2.75rem,1fr))] gap-1">
            {bars.map((bar) => {
              const isSelected = bar.month === selected;
              const partial = bar.month === current;
              return (
                <li key={bar.month}>
                  <Link
                    href={hrefFor(bar.month)}
                    aria-current={isSelected ? "page" : undefined}
                    aria-label={m.analysis.bar(
                      formatMonth(bar.month),
                      bar.tracked ? formatBRL(bar.cents) : m.analysis.noData,
                      partial,
                    )}
                    className="flex flex-col gap-1.5 rounded-md"
                  >
                    <span
                      className="flex items-end"
                      style={{ height: chartHeight }}
                    >
                      <span
                        className={cn(
                          "w-full origin-bottom animate-grow-y rounded-t-[4px] transition-[height] duration-500 forced-color-adjust-none",
                          !isSelected
                            ? "text-muted-foreground"
                            : tone === "income"
                              ? "text-income"
                              : "text-expense",
                          partial
                            ? "border-2 border-b-0 border-current bg-[repeating-linear-gradient(135deg,currentColor_0_2px,transparent_2px_6px)]"
                            : "bg-current",
                        )}
                        style={{
                          height: `${(bar.cents / max) * 100}%`,
                          minHeight: bar.cents > 0 ? 3 : 0,
                        }}
                      />
                    </span>
                    <span
                      className={cn(
                        "text-center text-caption2 text-muted-foreground",
                        isSelected && "font-semibold text-foreground",
                      )}
                    >
                      {formatShortMonth(`${bar.month}-01`)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
          {average !== null && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-foreground forced-colors:border-[CanvasText]"
              style={{ top: `calc(${chartHeight} * ${1 - average / max})` }}
            />
          )}
        </div>
      </div>
      {hasPartial && (
        <p className="px-4 text-footnote text-muted-foreground">
          {m.analysis.partial}
        </p>
      )}
    </figure>
  );
}
