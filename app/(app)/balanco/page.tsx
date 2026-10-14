import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  EqualIcon,
  LockIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Balance } from "@/components/analytics/balance";
import { CategoryBreakdown } from "@/components/analytics/category-breakdown";
import { WhereToSave } from "@/components/analytics/insights";
import { PageHeader } from "@/components/app-shell/page-header";
import { ClosingActions } from "@/components/closing/closing-actions";
import { MonthStepper } from "@/components/transactions/month-stepper";
import { categoryHref } from "@/lib/analytics";
import {
  type Category,
  getAboveNormal,
  getCategories,
  getCategoryTotals,
  getClosing,
  getJarNet,
  getMonthTotals,
  getTopDescriptions,
} from "@/lib/data";
import {
  addMonths,
  formatFullDate,
  formatMonthName,
  monthRange,
  parseMonth,
  todayInSaoPaulo,
} from "@/lib/dates";
import { m } from "@/lib/i18n";
import { formatBRL } from "@/lib/money";
import {
  type CategoryChange,
  movers,
  savingsRate,
  verdict,
} from "@/lib/month-report";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: m.closing.page };

const verdictIcons = {
  better: ArrowUpRightIcon,
  worse: ArrowDownRightIcon,
  same: EqualIcon,
};

export default async function ReportPage({
  searchParams,
}: PageProps<"/balanco">) {
  const { mes } = await searchParams;
  const today = todayInSaoPaulo();
  const current = today.slice(0, 7);
  const month = parseMonth(mes) ?? addMonths(current, -1);
  const previous = addMonths(month, -1);
  const range = monthRange(month);
  const over = month < current;
  const [
    categories,
    totals,
    byCategory,
    previousByCategory,
    unusual,
    top,
    jarNet,
    closedAt,
  ] = await Promise.all([
    getCategories(),
    getMonthTotals({ from: `${previous}-01`, to: range.to }),
    getCategoryTotals(range),
    getCategoryTotals(monthRange(previous)),
    over ? getAboveNormal(month) : [],
    getTopDescriptions(range),
    getJarNet(range),
    getClosing(month),
  ]);

  const monthName = formatMonthName(month);
  const previousName = formatMonthName(previous);
  const now = totals.get(month);
  const before = totals.get(previous);
  const income = now?.income_cents ?? 0;
  const expenses = now?.expense_cents ?? 0;
  const result = verdict(
    income - expenses,
    before ? before.income_cents - before.expense_cents : null,
  );
  const difference = before
    ? Math.abs(income - expenses - (before.income_cents - before.expense_cents))
    : 0;
  const rate = savingsRate(income, expenses);

  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );
  const isExpense = (id: string) => categoryById.get(id)?.kind === "expense";
  const spending = (rows: typeof byCategory) =>
    new Map(
      rows
        .filter((row) => isExpense(row.category_id))
        .map((row) => [row.category_id, row.total_cents]),
    );
  const changes = before
    ? movers(spending(byCategory), spending(previousByCategory))
    : { up: [], down: [] };
  const expenseRows = byCategory.flatMap((row) => {
    const category = categoryById.get(row.category_id);
    return category?.kind === "expense"
      ? [{ category, cents: row.total_cents, entries: row.entries }]
      : [];
  });
  const VerdictIcon = result ? verdictIcons[result] : null;

  return (
    <>
      <PageHeader
        title={m.closing.page}
        back={{ href: "/", label: m.nav.home }}
      />
      <div className="flex flex-col gap-8">
        <MonthStepper
          month={month}
          hrefFor={(target) => `/balanco?mes=${target}`}
        />

        {!now ? (
          <p className="rounded-2xl bg-card p-5 text-body text-muted-foreground">
            {m.analysis.noEntries(monthName)}
          </p>
        ) : (
          <>
            {closedAt && (
              <p className="flex items-center gap-2 px-1 text-subhead font-medium">
                <LockIcon aria-hidden="true" className="size-4 text-link" />
                {m.closing.lockedNotice}
              </p>
            )}

            <Balance
              title={m.balance.title(monthName)}
              income={income}
              expenses={expenses}
              comparison={
                before
                  ? {
                      current: expenses,
                      previous: before.expense_cents,
                      reference: m.analysis.inMonth(previousName),
                    }
                  : null
              }
            >
              {result && VerdictIcon && (
                <p
                  className={cn(
                    "flex items-start gap-1.5 text-subhead",
                    result === "worse" ? "text-expense" : "text-foreground",
                  )}
                >
                  <VerdictIcon
                    aria-hidden="true"
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      result === "better" && "text-income",
                    )}
                  />
                  {result === "same"
                    ? m.closing.same(previousName)
                    : (result === "better"
                        ? m.closing.better
                        : m.closing.worse)(previousName, formatBRL(difference))}
                </p>
              )}
            </Balance>

            <section aria-labelledby="numeros" className="flex flex-col gap-3">
              <h2 id="numeros" className="px-1 text-title3 font-semibold">
                {m.closing.figures}
              </h2>
              <dl className="divide-y overflow-hidden rounded-2xl bg-card">
                <Figure
                  label={m.closing.savingsRate}
                  value={
                    rate === null
                      ? m.closing.noIncome
                      : rate < 0
                        ? m.closing.overspent(-rate)
                        : m.closing.saved(rate)
                  }
                  negative={rate !== null && rate < 0}
                />
                <Figure
                  label={m.closing.jars}
                  value={
                    jarNet > 0
                      ? m.closing.jarsIn(formatBRL(jarNet))
                      : jarNet < 0
                        ? m.closing.jarsOut(formatBRL(-jarNet))
                        : m.closing.jarsNone
                  }
                />
              </dl>
            </section>

            {changes.up.length > 0 && (
              <Movers
                id="subiram"
                title={m.closing.up(previousName)}
                rows={changes.up}
                categoryById={categoryById}
                month={month}
              />
            )}
            {changes.down.length > 0 && (
              <Movers
                id="cairam"
                title={m.closing.down(previousName)}
                rows={changes.down}
                categoryById={categoryById}
                month={month}
              />
            )}

            {expenseRows.length > 0 && (
              <section
                aria-labelledby="por-categoria"
                className="flex flex-col gap-3"
              >
                <h2
                  id="por-categoria"
                  className="px-1 text-title3 font-semibold"
                >
                  {m.analysis.byCategory}
                </h2>
                <CategoryBreakdown
                  rows={expenseRows}
                  total={expenses}
                  hrefFor={(id) => categoryHref(id, month)}
                />
              </section>
            )}

            <WhereToSave
              categories={categories}
              unusual={unusual}
              unusualMonth={month}
              top={top.slice(0, 3)}
              topMonth={month}
              expenseEntries={expenseRows.reduce(
                (sum, row) => sum + row.entries,
                0,
              )}
            />
          </>
        )}

        {!over ? (
          <p className="px-1 text-subhead text-muted-foreground">
            {m.closing.notOver}
          </p>
        ) : (
          (now || closedAt) && (
            <ClosingActions
              month={month}
              monthName={monthName}
              closedOn={
                closedAt
                  ? formatFullDate(todayInSaoPaulo(new Date(closedAt)))
                  : null
              }
            />
          )
        )}
      </div>
    </>
  );
}

function Figure({
  label,
  value,
  negative = false,
}: {
  label: string;
  value: string;
  negative?: boolean;
}) {
  return (
    <div className="flex min-h-15 flex-wrap items-center justify-between gap-x-3 px-4 py-3">
      <dt className="text-body">{label}</dt>
      <dd
        className={cn(
          "text-body font-semibold tabular-nums",
          negative && "text-expense",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function Movers({
  id,
  title,
  rows,
  categoryById,
  month,
}: {
  id: string;
  title: string;
  rows: CategoryChange[];
  categoryById: Map<string, Category>;
  month: string;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="px-1 text-title3 font-semibold">
        {title}
      </h2>
      <ul className="divide-y overflow-hidden rounded-2xl bg-card">
        {rows.map((row) => {
          const up = row.change > 0;
          const Icon = up ? ArrowUpRightIcon : ArrowDownRightIcon;
          return (
            <li key={row.categoryId}>
              <Link
                href={categoryHref(row.categoryId, month)}
                className="flex min-h-15 items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/60 focus-visible:-outline-offset-2!"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-body font-medium">
                    {categoryById.get(row.categoryId)?.name}
                  </span>
                  <span className="text-footnote text-muted-foreground tabular-nums">
                    {formatBRL(row.current)}
                  </span>
                </span>
                <span
                  className={cn(
                    "flex shrink-0 items-center gap-1 text-subhead font-medium tabular-nums",
                    up ? "text-expense" : "text-income",
                  )}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {(up ? m.closing.more : m.closing.less)(
                    formatBRL(Math.abs(row.change)),
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
