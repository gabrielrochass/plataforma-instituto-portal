import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { TopSpending } from "@/components/analytics/insights";
import { MonthSummary } from "@/components/analytics/month-summary";
import { TrendChart } from "@/components/analytics/trend-chart";
import { PageHeader } from "@/components/app-shell/page-header";
import { MonthStepper } from "@/components/transactions/month-stepper";
import { TransactionList } from "@/components/transactions/transaction-list";
import {
  analysisHref,
  categoryHref,
  monthBars,
  monthlyAverage,
} from "@/lib/analytics";
import {
  getCards,
  getCategories,
  getFirstDay,
  getMonthTotals,
  getTopDescriptions,
  getTransactions,
} from "@/lib/data";
import {
  addMonths,
  formatMonthName,
  monthRange,
  parseMonth,
  todayInSaoPaulo,
} from "@/lib/dates";
import { m } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: PageProps<"/analises/categorias/[id]">): Promise<Metadata> {
  const { id } = await params;
  const category = (await getCategories()).find(
    (candidate) => candidate.id === id,
  );
  return {
    title: category ? m.analysis.categoryTitle(category.name) : m.nav.insights,
  };
}

export default async function CategoryInsightsPage({
  params,
  searchParams,
}: PageProps<"/analises/categorias/[id]">) {
  const [{ id }, { mes }] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(id).success) notFound();
  const today = todayInSaoPaulo();
  const current = today.slice(0, 7);
  const month = parseMonth(mes) ?? current;
  const range = monthRange(month);
  const [categories, cards, firstDay, series, top, rows] = await Promise.all([
    getCategories(),
    getCards(),
    getFirstDay(),
    getMonthTotals({ from: `${addMonths(month, -11)}-01`, to: range.to }, id),
    getTopDescriptions(range, id),
    getTransactions(range, { categoryId: id }),
  ]);
  const category = categories.find((candidate) => candidate.id === id);
  if (!category) notFound();

  const column = category.kind === "expense" ? "expense_cents" : "income_cents";
  const monthName = formatMonthName(month);
  const total = series.get(month)?.[column] ?? 0;
  const bars = monthBars(
    new Map([...series].map(([key, row]) => [key, row[column]])),
    month,
    firstDay,
  );
  const average = monthlyAverage(bars, firstDay, current);
  const hrefFor = (target: string) => categoryHref(id, target);

  return (
    <>
      <PageHeader
        title={category.name}
        back={{ href: analysisHref(month), label: m.nav.insights }}
      />
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <MonthStepper month={month} hrefFor={hrefFor} />
          <MonthSummary
            title={
              category.kind === "expense"
                ? m.analysis.spentIn(monthName)
                : m.analysis.incomeIn(monthName)
            }
            cents={total}
            comparison={
              average === null || month > current
                ? null
                : {
                    current: total,
                    previous: average,
                    reference: m.analysis.yourAverage,
                  }
            }
          />
        </div>

        {bars.filter((bar) => bar.tracked).length >= 2 && (
          <TrendChart
            bars={bars}
            average={average}
            selected={month}
            current={current}
            tone={category.kind}
            hrefFor={hrefFor}
          />
        )}

        {top.length > 0 && (
          <TopSpending
            title={m.analysis.topSpending(monthName)}
            items={top}
            heading="h2"
          />
        )}

        <section aria-labelledby="lancamentos" className="flex flex-col gap-3">
          <h2 id="lancamentos" className="px-1 text-title3 font-semibold">
            {m.analysis.entriesIn(monthName)}
          </h2>
          {rows.length > 0 ? (
            <TransactionList
              transactions={rows}
              categories={categories}
              cards={cards}
              today={today}
            />
          ) : (
            <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
              {m.analysis.noEntries(monthName)}
            </p>
          )}
        </section>
      </div>
    </>
  );
}
