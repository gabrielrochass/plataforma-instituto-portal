import type { Metadata } from "next";
import { EntryForm } from "@/components/entry/entry-form";
import { getCards, getCategories, getLastPayment } from "@/lib/data";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.entry.newTitle };

export default async function NewEntryPage() {
  const [categories, cards, lastPayment] = await Promise.all([
    getCategories(),
    getCards(),
    getLastPayment(),
  ]);
  return (
    <EntryForm
      categories={categories}
      cards={cards}
      transaction={null}
      lastPayment={lastPayment}
    />
  );
}
