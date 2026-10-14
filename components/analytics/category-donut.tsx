import { ChevronRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { CategorySpend } from "@/components/analytics/category-breakdown";
import { percentOf } from "@/lib/analytics";
import { m } from "@/lib/i18n";
import { formatBRL } from "@/lib/money";
import { swatch, swatchColor } from "@/lib/palette";
import { cn } from "@/lib/utils";

const size = 176;
const stroke = 28;
const radius = (size - stroke) / 2;
const circumference = 2 * Math.PI * radius;
const gap = 2;

type Slice = {
  key: string;
  name: string;
  color: string;
  cents: number;
  href: Route;
};

export function CategoryDonut({
  rows,
  total,
  hrefFor,
  othersHref,
}: {
  rows: CategorySpend[];
  total: number;
  hrefFor: (categoryId: string) => Route;
  othersHref: Route;
}) {
  const top = rows.slice(0, 5);
  const others = rows.slice(5).reduce((sum, row) => sum + row.cents, 0);
  const slices: Slice[] = [
    ...top.map(({ category, cents }) => ({
      key: category.id,
      name: category.name,
      color: category.color,
      cents,
      href: hrefFor(category.id),
    })),
    ...(others > 0
      ? [
          {
            key: "outras",
            name: m.home.otherCategories,
            color: "chart-other",
            cents: others,
            href: othersHref,
          },
        ]
      : []),
  ];
  let offset = 0;
  const arcs = slices.map((slice) => {
    const length = (slice.cents / total) * circumference;
    const arc = {
      ...slice,
      dash: Math.max(length - (slices.length > 1 ? gap : 0), 0.5),
      offset,
    };
    offset += length;
    return arc;
  });

  return (
    <figure className="flex flex-col gap-4 overflow-hidden rounded-2xl bg-card p-4">
      <div className="relative mx-auto size-44">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden="true"
          className="size-full -rotate-90"
        >
          {arcs.map((arc) => (
            <circle
              key={arc.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={stroke}
              strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
              strokeDashoffset={-arc.offset}
              stroke={swatchColor(arc.color)}
              className="forced-color-adjust-none"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-footnote text-muted-foreground">
            {m.balance.expenses}
          </span>
          <span className="text-headline font-semibold tabular-nums">
            {formatBRL(total)}
          </span>
        </div>
      </div>
      <figcaption className="sr-only">
        {m.home.donutSummary(
          slices[0]?.name ?? "",
          percentOf(slices[0]?.cents ?? 0, total),
        )}
      </figcaption>
      <ol className="-mx-4 -mb-4 divide-y border-t">
        {slices.map((slice) => (
          <li key={slice.key}>
            <Link
              href={slice.href}
              className="flex min-h-12 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/60 focus-visible:-outline-offset-2!"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-3 shrink-0 rounded-full forced-color-adjust-none",
                  swatch(slice.color),
                )}
              />
              <span className="min-w-0 flex-1 truncate text-body">
                {slice.name}
              </span>
              <span className="shrink-0 text-body font-semibold tabular-nums">
                {formatBRL(slice.cents)}
              </span>
              <span className="w-10 shrink-0 text-right text-footnote text-muted-foreground tabular-nums">
                {m.analysis.percent(percentOf(slice.cents, total))}
              </span>
              <ChevronRightIcon
                aria-hidden="true"
                className="size-5 shrink-0 text-muted-foreground"
              />
            </Link>
          </li>
        ))}
      </ol>
    </figure>
  );
}
