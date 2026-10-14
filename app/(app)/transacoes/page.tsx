import { ArrowLeftRightIcon, LockIcon, SearchXIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/app-shell/empty-state";
import { NewEntryLink } from "@/components/app-shell/new-entry-link";
import { PageHeader } from "@/components/app-shell/page-header";
import { MonthStepper } from "@/components/transactions/month-stepper";
import { TransactionList } from "@/components/transactions/transaction-list";
import { TransactionSearch } from "@/components/transactions/transaction-search";
import {
  getCards,
  getCategories,
  getClosing,
  getDayTotals,
  getTransactions,
} from "@/lib/data";
import { monthRange, parseMonth, todayInSaoPaulo } from "@/lib/dates";
import { filtersHref, hasFilters, parseFilters } from "@/lib/filters";
import { m } from "@/lib/i18n";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: m.nav.transactions };

export default async function TransactionsPage({
  searchParams,
}: PageProps<"/transacoes">) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const today = todayInSaoPaulo();
  const month = parseMonth(params.mes) ?? today.slice(0, 7);
  const searching = filters.query !== null;
  const range = searching ? null : monthRange(month);
  const [transactions, totals, categories, cards, closedAt] = await Promise.all(
    [
      getTransactions(range, filters),
      getDayTotals(range, filters),
      getCategories(),
      getCards(),
      searching ? null : getClosing(month),
    ],
  );
  const net = totals.income - totals.expenses;

  return (
    <>
      <PageHeader title={m.nav.transactions} />
      <div className="flex flex-col gap-4">
        <TransactionSearch
          filters={filters}
          month={month}
          categories={categories}
          cards={cards}
        />
        {!searching && (
          <MonthStepper
            month={month}
            hrefFor={(target) => filtersHref(filters, target)}
          />
        )}
        <output className="flex flex-wrap justify-center gap-x-3 text-footnote text-muted-foreground tabular-nums">
          <span>
            {searching
              ? m.transactions.results(totals.count)
              : m.transactions.count(totals.count)}
          </span>
          <span>
            {m.transactions.expenses} {formatBRL(totals.expenses)}
          </span>
          {totals.income > 0 && (
            <span>
              {m.transactions.income} {formatBRL(totals.income)}
            </span>
          )}
          {!hasFilters(filters) && totals.count > 0 && (
            <span
              className={cn(
                "font-medium text-foreground",
                net < 0 && "text-expense",
              )}
            >
              {m.transactions.balance(formatBRL(net))}
            </span>
          )}
        </output>
        {closedAt && (
          <p className="flex flex-wrap items-center justify-center gap-x-2 text-footnote">
            <span className="flex items-center gap-1.5 font-medium">
              <LockIcon aria-hidden="true" className="size-4 text-link" />
              {m.closing.lockedNotice}
            </span>
            <Link
              href={`/balanco?mes=${month}`}
              className="flex min-h-11 items-center font-medium text-link"
            >
              {m.closing.seeReport}
            </Link>
          </p>
        )}
        {totals.count > transactions.length && (
          <p className="text-center text-footnote text-muted-foreground">
            {m.transactions.truncated(transactions.length)}
          </p>
        )}
        {transactions.length > 0 ? (
          <TransactionList
            transactions={transactions}
            categories={categories}
            cards={cards}
            dayTotals={totals.byDay}
            today={today}
          />
        ) : hasFilters(filters) ? (
          <EmptyState
            icon={SearchXIcon}
            title={m.transactions.noResults}
            description={m.transactions.noResultsHint}
          />
        ) : (
          <EmptyState
            icon={ArrowLeftRightIcon}
            title={m.transactions.emptyTitle}
            description={m.transactions.emptyDescription}
            action={
              <NewEntryLink size="lg">
                {m.transactions.emptyAction}
              </NewEntryLink>
            }
          />
        )}
      </div>
    </>
  );
}
