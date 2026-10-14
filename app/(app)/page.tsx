import { CalendarCheckIcon, ReceiptTextIcon } from "lucide-react";
import Link from "next/link";
import { Balance } from "@/components/analytics/balance";
import { CategoryDonut } from "@/components/analytics/category-donut";
import { WhereToSave } from "@/components/analytics/insights";
import { LimitList } from "@/components/analytics/limit-list";
import { EmptyState } from "@/components/app-shell/empty-state";
import { NewEntryLink } from "@/components/app-shell/new-entry-link";
import { PageHeader } from "@/components/app-shell/page-header";
import { SubmitButton } from "@/components/forms/submit-button";
import { TransactionList } from "@/components/transactions/transaction-list";
import { buttonVariants } from "@/components/ui/button";
import { snoozeClosing } from "@/lib/actions";
import {
  analysisHref,
  canCompare,
  categoryHref,
  sameDayLastMonth,
  sumThrough,
} from "@/lib/analytics";
import {
  getAboveNormal,
  getCards,
  getCategories,
  getCategoryTotals,
  getClosing,
  getDayTotals,
  getFirstDay,
  getRecentTransactions,
  getSnoozedClosing,
  getTopDescriptions,
} from "@/lib/data";
import {
  addMonths,
  formatMonthName,
  monthRange,
  todayInSaoPaulo,
} from "@/lib/dates";
import { m } from "@/lib/i18n";

export default async function HomePage() {
  const today = todayInSaoPaulo();
  const month = today.slice(0, 7);
  const previousMonth = addMonths(month, -1);
  const range = monthRange(month);
  const [
    categories,
    cards,
    recent,
    firstDay,
    totals,
    previousTotals,
    byCategory,
    unusual,
    top,
    previousClosing,
    snoozed,
  ] = await Promise.all([
    getCategories(),
    getCards(),
    getRecentTransactions(today, 5),
    getFirstDay(),
    getDayTotals(range),
    getDayTotals(monthRange(previousMonth)),
    getCategoryTotals(range),
    getAboveNormal(previousMonth),
    getTopDescriptions(range),
    getClosing(previousMonth),
    getSnoozedClosing(),
  ]);

  if (recent.length === 0) {
    return (
      <>
        <PageHeader title={m.nav.home} />
        <EmptyState
          icon={ReceiptTextIcon}
          title={m.home.emptyTitle}
          description={m.home.emptyDescription}
          action={<NewEntryLink size="lg">{m.home.emptyAction}</NewEntryLink>}
        />
      </>
    );
  }

  const monthName = formatMonthName(month);
  const showClosingPrompt =
    !previousClosing &&
    snoozed !== previousMonth &&
    firstDay !== null &&
    firstDay < range.from;
  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );
  const spendByCategory = new Map(
    byCategory.map((row) => [row.category_id, row]),
  );
  const expenseRows = byCategory.flatMap((row) => {
    const category = categoryById.get(row.category_id);
    return category?.kind === "expense"
      ? [{ category, cents: row.total_cents, entries: row.entries }]
      : [];
  });
  const limits = categories.flatMap((category) =>
    category.kind === "expense" &&
    !category.archived_at &&
    category.monthly_limit_cents
      ? [
          {
            category,
            spent: spendByCategory.get(category.id)?.total_cents ?? 0,
            limit: category.monthly_limit_cents,
            href: categoryHref(category.id, month),
          },
        ]
      : [],
  );
  limits.sort((a, b) => b.spent / b.limit - a.spent / a.limit);

  return (
    <>
      <PageHeader title={m.nav.home} />
      <div className="flex flex-col gap-8">
        {showClosingPrompt && (
          <section
            aria-labelledby="mes-terminou"
            className="flex flex-col gap-4 rounded-2xl bg-card p-4"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-link/12 text-link">
                <CalendarCheckIcon aria-hidden="true" className="size-5" />
              </span>
              <div className="flex min-w-0 flex-col">
                <h2 id="mes-terminou" className="text-body font-semibold">
                  {m.closing.ended(formatMonthName(previousMonth))}
                </h2>
                <p className="text-footnote text-muted-foreground">
                  {m.closing.endedDetail}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/balanco?mes=${previousMonth}`}
                className={buttonVariants({ size: "lg" })}
              >
                {m.closing.seeReport}
              </Link>
              <form action={snoozeClosing.bind(null, previousMonth)}>
                <SubmitButton variant="ghost" size="lg" className="w-full">
                  {m.closing.later}
                </SubmitButton>
              </form>
            </div>
          </section>
        )}

        <Balance
          title={m.balance.title(monthName)}
          income={totals.income}
          expenses={totals.expenses}
          comparison={
            canCompare(firstDay, month)
              ? {
                  current: sumThrough(totals.byDay, today),
                  previous: sumThrough(
                    previousTotals.byDay,
                    sameDayLastMonth(today),
                  ),
                  reference: m.analysis.samePeriodOf(
                    formatMonthName(previousMonth),
                  ),
                }
              : null
          }
        />

        {expenseRows.length > 0 && (
          <section
            aria-labelledby="para-onde-foi"
            className="flex flex-col gap-3"
          >
            <div className="flex items-baseline justify-between px-1">
              <h2 id="para-onde-foi" className="text-title3 font-semibold">
                {m.home.whereItWent}
              </h2>
              <Link
                href={analysisHref(month)}
                className="text-subhead font-medium text-link"
              >
                {m.home.seeAnalysis}
              </Link>
            </div>
            <CategoryDonut
              rows={expenseRows}
              total={totals.expenses}
              hrefFor={(id) => categoryHref(id, month)}
              othersHref={analysisHref(month)}
            />
          </section>
        )}

        {limits.length > 0 && (
          <section aria-labelledby="limites" className="flex flex-col gap-3">
            <h2 id="limites" className="px-1 text-title3 font-semibold">
              {m.home.limits}
            </h2>
            <LimitList rows={limits} />
          </section>
        )}

        <WhereToSave
          categories={categories}
          unusual={unusual}
          unusualMonth={previousMonth}
          top={top.slice(0, 3)}
          topMonth={month}
          expenseEntries={expenseRows.reduce(
            (sum, row) => sum + row.entries,
            0,
          )}
        />

        <section aria-labelledby="ultimos" className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between px-1">
            <h2 id="ultimos" className="text-title3 font-semibold">
              {m.home.recent}
            </h2>
            <Link
              href="/transacoes"
              className="text-subhead font-medium text-link"
            >
              {m.home.seeAll}
            </Link>
          </div>
          <TransactionList
            transactions={recent}
            categories={categories}
            cards={cards}
            today={today}
          />
        </section>
      </div>
    </>
  );
}
