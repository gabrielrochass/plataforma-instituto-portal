import { ChevronRightIcon, TrendingUpIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { categoryHref } from "@/lib/analytics";
import type { Category } from "@/lib/data";
import { formatMonthName } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { formatBRL } from "@/lib/money";

export type Unusual = {
  category: Category;
  spent: number;
  usual: number;
  href: Route;
};

export type TopSpendingItem = {
  description: string;
  total_cents: number;
  entries: number;
};

export function UnusualSpending({
  items,
  monthName,
}: {
  items: Unusual[];
  monthName: string;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.category.id}>
          <Link
            href={item.href}
            className="flex min-h-15 items-center gap-3 rounded-2xl bg-card px-4 py-3 transition-colors hover:bg-muted/60"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warning/12 text-warning">
              <TrendingUpIcon aria-hidden="true" className="size-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-body font-medium">
                {m.analysis.aboveNormal(item.category.name)}
              </span>
              <span className="text-footnote text-muted-foreground tabular-nums">
                {m.analysis.aboveNormalDetail(
                  formatBRL(item.spent),
                  monthName,
                  formatBRL(item.usual),
                )}
              </span>
            </span>
            <ChevronRightIcon
              aria-hidden="true"
              className="size-5 shrink-0 text-muted-foreground"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function TopSpending({
  title,
  items,
  heading: Heading = "h3",
}: {
  title: string;
  items: TopSpendingItem[];
  heading?: "h2" | "h3";
}) {
  return (
    <section
      aria-labelledby="maiores-gastos"
      className="flex flex-col gap-2 rounded-2xl bg-card p-4"
    >
      <Heading id="maiores-gastos" className="text-headline font-semibold">
        {title}
      </Heading>
      <ol className="flex flex-col divide-y">
        {items.map((item) => (
          <li
            key={item.description}
            className="flex items-baseline justify-between gap-3 py-2.5"
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-body">{item.description}</span>
              {item.entries > 1 && (
                <span className="text-footnote text-muted-foreground">
                  {m.analysis.times(item.entries)}
                </span>
              )}
            </span>
            <span className="shrink-0 text-body font-semibold tabular-nums">
              {formatBRL(item.total_cents)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function WhereToSave({
  categories,
  unusual,
  unusualMonth,
  top,
  topMonth,
  expenseEntries,
}: {
  categories: Category[];
  unusual: { category_id: string; spent_cents: number; usual_cents: number }[];
  unusualMonth: string;
  top: TopSpendingItem[];
  topMonth: string;
  expenseEntries: number;
}) {
  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );
  const items = unusual.flatMap((item) => {
    const category = categoryById.get(item.category_id);
    return category
      ? [
          {
            category,
            spent: item.spent_cents,
            usual: item.usual_cents,
            href: categoryHref(category.id, unusualMonth),
          },
        ]
      : [];
  });
  const showTop = expenseEntries >= 3 && top.length > 0;
  if (items.length === 0 && !showTop) return null;

  return (
    <section aria-labelledby="onde-economizar" className="flex flex-col gap-3">
      <h2 id="onde-economizar" className="px-1 text-title3 font-semibold">
        {m.analysis.whereToSave}
      </h2>
      {items.length > 0 && (
        <UnusualSpending
          items={items}
          monthName={formatMonthName(unusualMonth)}
        />
      )}
      {showTop && (
        <TopSpending
          title={m.analysis.topSpending(formatMonthName(topMonth))}
          items={top}
        />
      )}
    </section>
  );
}
