import {
  ChartPieIcon,
  ChevronRightIcon,
  LockIcon,
  LockOpenIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CategoryBreakdown } from "@/components/analytics/category-breakdown";
import { WhereToSave } from "@/components/analytics/insights";
import { MonthSummary } from "@/components/analytics/month-summary";
import { TrendChart } from "@/components/analytics/trend-chart";
import { EmptyState } from "@/components/app-shell/empty-state";
import { NewEntryLink } from "@/components/app-shell/new-entry-link";
import { PageHeader } from "@/components/app-shell/page-header";
import { MonthStepper } from "@/components/transactions/month-stepper";
import {
  analysisHref,
  canCompare,
  categoryHref,
  monthBars,
  monthlyAverage,
  sameDayLastMonth,
  sumThrough,
} from "@/lib/analytics";
import {
  getAboveNormal,
  getCategories,
  getCategoryTotals,
  getClosing,
  getDayTotals,
  getFirstDay,
  getMonthTotals,
  getTopDescriptions,
} from "@/lib/data";
import {
  addMonths,
  formatMonthName,
  monthRange,
  parseMonth,
  todayInSaoPaulo,
} from "@/lib/dates";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.nav.insights };

export default async function InsightsPage({
  searchParams,
}: PageProps<"/analises">) {
  const { mes } = await searchParams;
  const today = todayInSaoPaulo();
  const current = today.slice(0, 7);
  const month = parseMonth(mes) ?? current;
  const previousMonth = addMonths(month, -1);
  const range = monthRange(month);
  const isCurrent = month === current;
  const [
    categories,
    firstDay,
    series,
    byCategory,
    top,
    unusual,
    days,
    previousDays,
    closedAt,
  ] = await Promise.all([
    getCategories(),
    getFirstDay(),
    getMonthTotals({ from: `${addMonths(month, -11)}-01`, to: range.to }),
    getCategoryTotals(range),
    getTopDescriptions(range),
    month < current ? getAboveNormal(month) : [],
    isCurrent ? getDayTotals(range) : null,
    isCurrent ? getDayTotals(monthRange(previousMonth)) : null,
    month < current ? getClosing(month) : null,
  ]);

  if (!firstDay) {
    return (
      <>
        <PageHeader title={m.nav.insights} />
        <EmptyState
          icon={ChartPieIcon}
          title={m.insights.emptyTitle}
          description={m.insights.emptyDescription}
          action={
            <NewEntryLink size="lg">{m.transactions.emptyAction}</NewEntryLink>
          }
        />
      </>
    );
  }

  const monthName = formatMonthName(month);
  const expenses = series.get(month)?.expense_cents ?? 0;
  const income = series.get(month)?.income_cents ?? 0;
  const previousName = formatMonthName(previousMonth);
  const comparison =
    month > current || !canCompare(firstDay, month)
      ? null
      : days && previousDays
        ? {
            current: sumThrough(days.byDay, today),
            previous: sumThrough(previousDays.byDay, sameDayLastMonth(today)),
            reference: m.analysis.samePeriodOf(previousName),
          }
        : {
            current: expenses,
            previous: series.get(previousMonth)?.expense_cents ?? 0,
            reference: m.analysis.inMonth(previousName),
          };

  const bars = monthBars(
    new Map([...series].map(([key, row]) => [key, row.expense_cents])),
    month,
    firstDay,
  );
  const tracked = bars.filter((bar) => bar.tracked).length;

  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );
  const rows = byCategory.flatMap((row) => {
    const category = categoryById.get(row.category_id);
    return category
      ? [{ category, cents: row.total_cents, entries: row.entries }]
      : [];
  });
  const expenseRows = rows.filter((row) => row.category.kind === "expense");
  const incomeRows = rows.filter((row) => row.category.kind === "income");

  return (
    <>
      <PageHeader title={m.nav.insights} />
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <MonthStepper month={month} hrefFor={analysisHref} />
          <MonthSummary
            title={m.analysis.spentIn(monthName)}
            cents={expenses}
            comparison={comparison}
            income={income}
          />
          {month < current && (
            <Link
              href={`/balanco?mes=${month}`}
              className="flex min-h-15 items-center gap-3 rounded-2xl bg-card px-4 py-3 transition-colors hover:bg-muted/60"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-link/12 text-link">
                {closedAt ? (
                  <LockIcon aria-hidden="true" className="size-5" />
                ) : (
                  <LockOpenIcon aria-hidden="true" className="size-5" />
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-body font-medium">
                  {m.closing.title(monthName)}
                </span>
                <span className="text-footnote text-muted-foreground">
                  {closedAt ? m.closing.closedState : m.closing.openState}
                </span>
              </span>
              <ChevronRightIcon
                aria-hidden="true"
                className="size-5 shrink-0 text-muted-foreground"
              />
            </Link>
          )}
        </div>

        {tracked >= 2 ? (
          <TrendChart
            bars={bars}
            average={monthlyAverage(bars, firstDay, current)}
            selected={month}
            current={current}
            hrefFor={analysisHref}
          />
        ) : (
          <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
            {m.analysis.trendEmpty}
          </p>
        )}

        <section
          aria-labelledby="por-categoria"
          className="flex flex-col gap-3"
        >
          <h2 id="por-categoria" className="px-1 text-title3 font-semibold">
            {m.analysis.byCategory}
          </h2>
          {expenseRows.length > 0 ? (
            <CategoryBreakdown
              rows={expenseRows}
              total={expenses}
              hrefFor={(id) => categoryHref(id, month)}
            />
          ) : (
            <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
              {m.analysis.emptyMonth(monthName)}
            </p>
          )}
        </section>

        <WhereToSave
          categories={categories}
          unusual={unusual}
          unusualMonth={month}
          top={top}
          topMonth={month}
          expenseEntries={expenseRows.reduce(
            (sum, row) => sum + row.entries,
            0,
          )}
        />

        {incomeRows.length > 0 && (
          <section aria-labelledby="receitas" className="flex flex-col gap-3">
            <h2 id="receitas" className="px-1 text-title3 font-semibold">
              {m.analysis.incomeByCategory}
            </h2>
            <CategoryBreakdown
              rows={incomeRows}
              total={income}
              hrefFor={(id) => categoryHref(id, month)}
            />
          </section>
        )}
      </div>
    </>
  );
}
