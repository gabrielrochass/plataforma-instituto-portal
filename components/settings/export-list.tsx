"use client";

import { DownloadIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToday } from "@/hooks/use-today";
import {
  cardsCsv,
  categoriesCsv,
  jarEntriesCsv,
  jarsCsv,
  transactionsCsv,
} from "@/lib/export";
import { m } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

type Supabase = ReturnType<typeof createClient>;
type Page<T> = PromiseLike<{ data: T[] | null; error: unknown }>;

const pageSize = 1000;

async function fetchAll<T>(page: (from: number, to: number) => Page<T>) {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1);
    if (error) throw error;
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < pageSize) return rows;
  }
}

function names(supabase: Supabase, table: "categories" | "cards" | "jars") {
  return fetchAll((from, to) =>
    supabase.from(table).select("id, name").order("id").range(from, to),
  );
}

const files = {
  transactions: async (supabase: Supabase) => {
    const [rows, categories, cards] = await Promise.all([
      fetchAll((from, to) =>
        supabase
          .from("transactions")
          .select(
            "kind, amount_cents, occurred_on, description, category_id, payment_kind, card_id, bill_due_on, installment_number, installment_count",
          )
          .order("occurred_on")
          .order("created_at")
          .order("id")
          .range(from, to),
      ),
      names(supabase, "categories"),
      names(supabase, "cards"),
    ]);
    return { rows: rows.length, csv: transactionsCsv(rows, categories, cards) };
  },
  jarEntries: async (supabase: Supabase) => {
    const [rows, jars] = await Promise.all([
      fetchAll((from, to) =>
        supabase
          .from("jar_entries")
          .select("jar_id, kind, amount_cents, occurred_on, note, is_opening")
          .order("occurred_on")
          .order("created_at")
          .order("id")
          .range(from, to),
      ),
      names(supabase, "jars"),
    ]);
    return { rows: rows.length, csv: jarEntriesCsv(rows, jars) };
  },
  jars: async (supabase: Supabase) => {
    const rows = await fetchAll((from, to) =>
      supabase
        .from("jars")
        .select(
          "name, icon, color, target_cents, target_date, planned_monthly_cents, archived_at, created_at",
        )
        .order("created_at")
        .order("id")
        .range(from, to),
    );
    return { rows: rows.length, csv: jarsCsv(rows) };
  },
  categories: async (supabase: Supabase) => {
    const rows = await fetchAll((from, to) =>
      supabase
        .from("categories")
        .select(
          "name, kind, icon, color, monthly_limit_cents, archived_at, created_at",
        )
        .order("kind")
        .order("created_at")
        .order("id")
        .range(from, to),
    );
    return { rows: rows.length, csv: categoriesCsv(rows) };
  },
  cards: async (supabase: Supabase) => {
    const rows = await fetchAll((from, to) =>
      supabase
        .from("cards")
        .select(
          "name, design, best_purchase_day, due_day, archived_at, created_at",
        )
        .order("created_at")
        .order("id")
        .range(from, to),
    );
    return { rows: rows.length, csv: cardsCsv(rows) };
  },
};

type FileKey = keyof typeof files;

const keys = Object.keys(files) as FileKey[];

export function ExportList() {
  const today = useToday();
  const [busy, setBusy] = useState<FileKey | null>(null);
  const [status, setStatus] = useState("");

  async function download(key: FileKey) {
    setBusy(key);
    setStatus(m.exportData.preparing);
    try {
      const { rows, csv } = await files[key](createClient());
      const url = URL.createObjectURL(
        new Blob([csv], { type: "text/csv;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `${m.exportData.fileNames[key]}-${today}.csv`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus(m.exportData.done(m.exportData.files[key], rows));
    } catch {
      setStatus(m.exportData.failed);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="divide-y overflow-hidden rounded-2xl bg-card">
        {keys.map((key) => (
          <li
            key={key}
            className="flex min-h-15 items-center justify-between gap-3 py-2 pr-2 pl-4"
          >
            <span className="text-body font-medium">
              {m.exportData.files[key]}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              aria-label={m.exportData.download(m.exportData.files[key])}
              disabled={busy !== null}
              focusableWhenDisabled
              onClick={() => download(key)}
            >
              <DownloadIcon aria-hidden="true" />
              {m.exportData.downloadShort}
            </Button>
          </li>
        ))}
      </ul>
      <output className="block min-h-5 text-footnote text-muted-foreground">
        {status}
      </output>
    </div>
  );
}
