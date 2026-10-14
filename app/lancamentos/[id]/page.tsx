import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { EntryForm } from "@/components/entry/entry-form";
import {
  getCards,
  getCategories,
  getClosing,
  getTransaction,
} from "@/lib/data";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.entry.editTitle };

export default async function EditEntryPage({
  params,
}: PageProps<"/lancamentos/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [transaction, categories, cards] = await Promise.all([
    getTransaction(id),
    getCategories(),
    getCards(),
  ]);
  if (!transaction) notFound();
  const month = transaction.occurred_on.slice(0, 7);
  const closedAt = await getClosing(month);
  return (
    <EntryForm
      categories={categories}
      cards={cards}
      transaction={transaction}
      closedMonth={closedAt ? month : null}
    />
  );
}
