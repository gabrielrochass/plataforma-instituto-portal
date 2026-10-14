import Link from "next/link";
import { MiniCard } from "@/components/cards/card-face";
import { categoryIcon, paymentIcons } from "@/lib/category-icons";
import type { Card, Category, Transaction } from "@/lib/data";
import { formatDayHeading } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { formatBRL } from "@/lib/money";
import { swatch } from "@/lib/palette";
import { cn } from "@/lib/utils";

export function TransactionList({
  transactions,
  categories,
  cards,
  dayTotals,
  today,
}: {
  transactions: Transaction[];
  categories: Category[];
  cards: Card[];
  dayTotals?: Map<string, number>;
  today: string;
}) {
  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );
  const cardById = new Map(cards.map((card) => [card.id, card]));
  const days = Map.groupBy(
    transactions,
    (transaction) => transaction.occurred_on,
  );

  return (
    <div className="flex flex-col gap-6">
      {[...days].map(([day, rows]) => {
        const spent = dayTotals?.get(day) ?? 0;
        const headingId = `dia-${day}`;
        return (
          <section
            key={day}
            aria-labelledby={headingId}
            className="flex flex-col gap-2"
          >
            <header className="flex items-baseline justify-between gap-4 px-1">
              <h3
                id={headingId}
                className="text-footnote font-semibold text-muted-foreground first-letter:uppercase"
              >
                {formatDayHeading(day, today)}
              </h3>
              {spent > 0 && (
                <p className="text-footnote text-muted-foreground tabular-nums">
                  <span className="sr-only">{m.transactions.dayTotal}: </span>
                  {formatBRL(spent)}
                </p>
              )}
            </header>
            <ul className="divide-y overflow-hidden rounded-2xl bg-card">
              {rows.map((row) => (
                <TransactionRow
                  key={row.id}
                  row={row}
                  category={categoryById.get(row.category_id)}
                  card={row.card_id ? cardById.get(row.card_id) : undefined}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function TransactionRow({
  row,
  category,
  card,
}: {
  row: Transaction;
  category?: Category;
  card?: Card;
}) {
  const Icon = categoryIcon(category?.icon ?? "tag");
  const PaymentIcon = paymentIcons[row.payment_kind];
  const income = row.kind === "income";

  return (
    <li>
      <Link
        href={`/lancamentos/${row.id}`}
        className="flex min-h-15 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60 focus-visible:-outline-offset-2!"
      >
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full text-swatch-foreground",
            swatch(category?.color ?? "chart-other"),
          )}
        >
          <Icon aria-hidden="true" className="size-4.5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body font-medium">
            {row.description ?? category?.name}
          </span>
          <span className="flex min-w-0 items-center gap-3 text-footnote text-muted-foreground">
            <span className="max-w-[45%] truncate">{category?.name}</span>
            <span className="flex min-w-0 items-center gap-1.5">
              {card ? (
                <MiniCard design={card.design} className="h-3 w-4.5" />
              ) : (
                <PaymentIcon aria-hidden="true" className="size-3.5 shrink-0" />
              )}
              <span className="min-w-0 truncate">
                {card?.name ?? m.payments[row.payment_kind]}
              </span>
            </span>
            {row.installment_number && row.installment_count && (
              <span className="shrink-0 rounded-full bg-secondary px-1.5 text-caption2 font-medium text-secondary-foreground tabular-nums">
                {m.transactions.installment(
                  row.installment_number,
                  row.installment_count,
                )}
              </span>
            )}
          </span>
        </span>
        <span
          className={cn(
            "shrink-0 text-body font-semibold tabular-nums",
            income && "text-income",
          )}
        >
          {income && "+"}
          {formatBRL(row.amount_cents)}
        </span>
      </Link>
    </li>
  );
}
