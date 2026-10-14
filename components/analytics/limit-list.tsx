import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { categoryIcon } from "@/lib/category-icons";
import type { Category } from "@/lib/data";
import { m } from "@/lib/i18n";
import { formatBRL } from "@/lib/money";
import { swatch } from "@/lib/palette";
import { cn } from "@/lib/utils";

export type LimitRow = {
  category: Category;
  spent: number;
  limit: number;
  href: Route;
};

export function LimitList({ rows }: { rows: LimitRow[] }) {
  return (
    <ul className="divide-y overflow-hidden rounded-2xl bg-card">
      {rows.map(({ category, spent, limit, href }) => {
        const Icon = categoryIcon(category.icon);
        const over = spent > limit;
        const StatusIcon = over ? CircleAlertIcon : CircleCheckIcon;
        return (
          <li key={category.id}>
            <Link
              href={href}
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
                  <span className="shrink-0 text-footnote text-muted-foreground tabular-nums">
                    {m.analysis.limitOf(formatBRL(spent), formatBRL(limit))}
                  </span>
                </span>
                <span className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <span
                    className={cn(
                      "block h-full origin-left animate-grow-x rounded-full transition-[width] duration-500 forced-color-adjust-none",
                      over ? "bg-destructive" : swatch(category.color),
                    )}
                    style={{ width: `${Math.min(spent / limit, 1) * 100}%` }}
                  />
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1 text-footnote tabular-nums",
                    over ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  <StatusIcon aria-hidden="true" className="size-4 shrink-0" />
                  {over
                    ? m.analysis.limitOver(formatBRL(spent - limit))
                    : m.analysis.limitLeft(formatBRL(limit - spent))}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
