import { ChevronRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { percentOf } from "@/lib/analytics";
import { categoryIcon } from "@/lib/category-icons";
import type { Category } from "@/lib/data";
import { m } from "@/lib/i18n";
import { formatBRL } from "@/lib/money";
import { swatch } from "@/lib/palette";
import { cn } from "@/lib/utils";

export type CategorySpend = { category: Category; cents: number };

export function CategoryBreakdown({
  rows,
  total,
  hrefFor,
}: {
  rows: CategorySpend[];
  total: number;
  hrefFor: (categoryId: string) => Route;
}) {
  const max = rows[0]?.cents ?? 1;

  return (
    <ol className="divide-y overflow-hidden rounded-2xl bg-card">
      {rows.map(({ category, cents }) => {
        const Icon = categoryIcon(category.icon);
        const percent = percentOf(cents, total);
        return (
          <li key={category.id}>
            <Link
              href={hrefFor(category.id)}
              className="flex min-h-15 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60 focus-visible:-outline-offset-2!"
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full text-swatch-foreground",
                  swatch(category.color),
                )}
              >
                <Icon aria-hidden="true" className="size-4.5" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="truncate text-body font-medium">
                    {category.name}
                  </span>
                  <span className="shrink-0 text-body font-semibold tabular-nums">
                    {formatBRL(cents)}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className={cn(
                        "block h-full origin-left animate-grow-x rounded-full transition-[width] duration-500 forced-color-adjust-none",
                        swatch(category.color),
                      )}
                      style={{ width: `${(cents / max) * 100}%` }}
                    />
                  </span>
                  <span className="w-10 shrink-0 text-right text-footnote text-muted-foreground tabular-nums">
                    {m.analysis.percent(percent)}
                  </span>
                </span>
              </span>
              <ChevronRightIcon
                aria-hidden="true"
                className="size-5 shrink-0 text-muted-foreground"
              />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
