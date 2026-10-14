import { toCsv } from "@/lib/csv";
import { todayInSaoPaulo } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { formatPlainAmount } from "@/lib/money";
import type { Tables } from "@/lib/supabase/database.types";

type Named = { id: string; name: string };
type Labels = Readonly<Record<string, string>>;

const column = m.exportData.columns;

function label(labels: Labels, key: string) {
  return labels[key] ?? key;
}

function amount(cents: number | null) {
  return cents === null ? "" : formatPlainAmount(cents);
}

function day(timestamp: string | null) {
  return timestamp ? todayInSaoPaulo(new Date(timestamp)) : "";
}

function names(rows: Named[]) {
  return new Map(rows.map(({ id, name }) => [id, name]));
}

export type TransactionExport = Pick<
  Tables<"transactions">,
  | "kind"
  | "amount_cents"
  | "occurred_on"
  | "description"
  | "category_id"
  | "payment_kind"
  | "card_id"
  | "bill_due_on"
  | "installment_number"
  | "installment_count"
>;

export function transactionsCsv(
  rows: TransactionExport[],
  categories: Named[],
  cards: Named[],
) {
  const categoryNames = names(categories);
  const cardNames = names(cards);
  return toCsv(
    [
      column.date,
      column.kind,
      column.amount,
      column.description,
      column.category,
      column.payment,
      column.card,
      column.billDue,
      column.installment,
    ],
    rows.map((row) => [
      row.occurred_on,
      m.entry[row.kind],
      amount(row.amount_cents),
      row.description,
      categoryNames.get(row.category_id),
      m.payments[row.payment_kind],
      row.card_id ? cardNames.get(row.card_id) : "",
      row.bill_due_on,
      row.installment_number && row.installment_count
        ? m.exportData.installment(
            row.installment_number,
            row.installment_count,
          )
        : "",
    ]),
  );
}

export type JarEntryExport = Pick<
  Tables<"jar_entries">,
  "jar_id" | "kind" | "amount_cents" | "occurred_on" | "note" | "is_opening"
>;

export function jarEntriesCsv(rows: JarEntryExport[], jars: Named[]) {
  const jarNames = names(jars);
  return toCsv(
    [column.jar, column.date, column.kind, column.amount, column.note],
    rows.map((row) => [
      jarNames.get(row.jar_id),
      row.occurred_on,
      row.is_opening
        ? m.jars.openingEntry
        : row.kind === "deposit"
          ? m.jars.depositEntry
          : m.jars.withdrawalEntry,
      amount(row.amount_cents),
      row.note,
    ]),
  );
}

export type JarExport = Pick<
  Tables<"jars">,
  | "name"
  | "icon"
  | "color"
  | "target_cents"
  | "target_date"
  | "planned_monthly_cents"
  | "archived_at"
  | "created_at"
>;

export function jarsCsv(rows: JarExport[]) {
  return toCsv(
    [
      column.name,
      column.icon,
      column.color,
      column.goal,
      column.deadline,
      column.planned,
      column.archivedAt,
      column.createdAt,
    ],
    rows.map((row) => [
      row.name,
      label(m.icons, row.icon),
      label(m.colors, row.color),
      amount(row.target_cents),
      row.target_date,
      amount(row.planned_monthly_cents),
      day(row.archived_at),
      day(row.created_at),
    ]),
  );
}

export type CategoryExport = Pick<
  Tables<"categories">,
  | "name"
  | "kind"
  | "icon"
  | "color"
  | "monthly_limit_cents"
  | "archived_at"
  | "created_at"
>;

export function categoriesCsv(rows: CategoryExport[]) {
  return toCsv(
    [
      column.name,
      column.kind,
      column.icon,
      column.color,
      column.monthlyLimit,
      column.archivedAt,
      column.createdAt,
    ],
    rows.map((row) => [
      row.name,
      m.entry[row.kind],
      label(m.icons, row.icon),
      label(m.colors, row.color),
      amount(row.monthly_limit_cents),
      day(row.archived_at),
      day(row.created_at),
    ]),
  );
}

export type CardExport = Pick<
  Tables<"cards">,
  | "name"
  | "design"
  | "best_purchase_day"
  | "due_day"
  | "archived_at"
  | "created_at"
>;

export function cardsCsv(rows: CardExport[]) {
  return toCsv(
    [
      column.name,
      column.design,
      column.bestDay,
      column.dueDay,
      column.archivedAt,
      column.createdAt,
    ],
    rows.map((row) => [
      row.name,
      label(m.cardDesigns, row.design),
      row.best_purchase_day,
      row.due_day,
      day(row.archived_at),
      day(row.created_at),
    ]),
  );
}
