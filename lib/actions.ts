"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { parseMonth, todayInSaoPaulo } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { formatBRL } from "@/lib/money";
import { paletteColors } from "@/lib/palette";
import {
  type CardInput,
  type CategoryInput,
  cardInput,
  categoryInput,
  fieldErrors,
  type JarEntryInput,
  type JarInput,
  jarEntryInput,
  jarInput,
  quickCategoryInput,
  type StarterCategoryInput,
  starterCategoriesInput,
  type TransactionInput,
  transactionInput,
} from "@/lib/schemas";
import type { Enums } from "@/lib/supabase/database.types";
import { requireUser } from "@/lib/supabase/server";

export type ActionResult =
  | { ok: true }
  | {
      ok: false;
      errors?: Record<string, string[] | undefined>;
      message?: string;
    };

const failure = { ok: false, message: m.common.tryAgain } as const;
const nameTaken: ActionResult = {
  ok: false,
  errors: { name: [m.settings.nameTaken] },
};
const uniqueViolation = "23505";
const monthClosed = "55000";

function failureFor(error: { code?: string }) {
  return error.code === monthClosed
    ? ({ ok: false, message: m.closing.locked } as const)
    : failure;
}

export async function saveTransaction(
  input: TransactionInput,
  isNew: boolean,
): Promise<ActionResult> {
  const parsed = transactionInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const t = parsed.data;
  const { supabase } = await requireUser();

  if (isNew) {
    const { error } = await supabase.from("transactions").upsert(
      {
        id: t.id,
        kind: t.kind,
        amount_cents: t.amountCents,
        occurred_on: t.occurredOn,
        description: t.description,
        category_id: t.categoryId,
        payment_kind: t.paymentKind,
        card_id: t.cardId,
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
    if (error) return failureFor(error);
  } else {
    const { data: current, error: readError } = await supabase
      .from("transactions")
      .select("installment_group_id")
      .eq("id", t.id)
      .single();
    if (readError) return failure;

    const { error } = current.installment_group_id
      ? await supabase
          .from("transactions")
          .update({ category_id: t.categoryId, description: t.description })
          .eq("installment_group_id", current.installment_group_id)
      : await supabase
          .from("transactions")
          .update({
            kind: t.kind,
            amount_cents: t.amountCents,
            occurred_on: t.occurredOn,
            description: t.description,
            category_id: t.categoryId,
            payment_kind: t.paymentKind,
            card_id: t.cardId,
          })
          .eq("id", t.id);
    if (error) return failureFor(error);
  }

  refresh();
  return { ok: true };
}

export async function deleteTransaction(
  id: string,
): Promise<{ ok: true; ids: string[] } | { ok: false; message: string }> {
  const { supabase } = await requireUser();
  const { data: current, error: readError } = await supabase
    .from("transactions")
    .select("installment_group_id")
    .eq("id", id)
    .single();
  if (readError) return failure;

  const remove = supabase.from("transactions").delete();
  const { data, error } = await (current.installment_group_id
    ? remove.eq("installment_group_id", current.installment_group_id)
    : remove.eq("id", id)
  ).select("id");
  if (error) return failureFor(error);

  refresh();
  return { ok: true, ids: data.map((row) => row.id) };
}

export async function restoreTransactions(
  ids: string[],
): Promise<ActionResult> {
  const parsed = z.array(z.uuid()).max(100).safeParse(ids);
  if (!parsed.success) return failure;
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("restore_transactions", {
    p_ids: parsed.data,
  });
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function suggestCategory(
  description: string,
  kind: Enums<"transaction_kind">,
) {
  if (!description.trim()) return null;
  const { supabase } = await requireUser();
  const { data } = await supabase.rpc("suggest_category", {
    p_description: description,
    p_kind: kind,
  });
  return data ?? null;
}

export async function createCategory(input: {
  id: string;
  kind: Enums<"transaction_kind">;
  name: string;
}): Promise<ActionResult> {
  const parsed = quickCategoryInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { supabase } = await requireUser();
  const { count } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("kind", parsed.data.kind);
  const color = paletteColors[(count ?? 0) % (paletteColors.length - 1)];

  const { error } = await supabase
    .from("categories")
    .upsert(
      { ...parsed.data, icon: "tag", color, sort_order: count ?? 0 },
      { onConflict: "id", ignoreDuplicates: true },
    );
  if (error?.code === uniqueViolation) return nameTaken;
  if (error) return failure;
  refresh();
  return { ok: true };
}

export async function saveCategory(
  input: CategoryInput,
): Promise<ActionResult> {
  const parsed = categoryInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { id, monthlyLimitCents, ...fields } = parsed.data;
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("categories")
    .update({ ...fields, monthly_limit_cents: monthlyLimitCents })
    .eq("id", id);
  if (error?.code === uniqueViolation) return nameTaken;
  if (error) return failure;
  refresh();
  return { ok: true };
}

export async function saveCard(
  input: CardInput,
  isNew: boolean,
): Promise<ActionResult> {
  const parsed = cardInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const card = parsed.data;
  const { supabase } = await requireUser();
  const fields = {
    name: card.name,
    design: card.design,
    best_purchase_day: card.bestPurchaseDay,
    due_day: card.dueDay,
  };
  const { error } = isNew
    ? await supabase
        .from("cards")
        .upsert(
          { id: card.id, ...fields },
          { onConflict: "id", ignoreDuplicates: true },
        )
    : await supabase.from("cards").update(fields).eq("id", card.id);
  if (error?.code === uniqueViolation) return nameTaken;
  if (error) return failure;
  refresh();
  return { ok: true };
}

async function setArchived(
  table: "categories" | "cards" | "jars",
  id: string,
  archived: boolean,
): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from(table)
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error?.code === uniqueViolation)
    return { ok: false, message: m.settings.nameTaken };
  if (error) return failure;
  refresh();
  return { ok: true };
}

export async function setCategoryArchived(id: string, archived: boolean) {
  return setArchived("categories", id, archived);
}

export async function setCardArchived(id: string, archived: boolean) {
  return setArchived("cards", id, archived);
}

export async function setJarArchived(id: string, archived: boolean) {
  return setArchived("jars", id, archived);
}

export async function saveJar(
  input: JarInput,
  isNew: boolean,
): Promise<ActionResult> {
  const parsed = jarInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const jar = parsed.data;
  const { supabase } = await requireUser();
  const fields = {
    name: jar.name,
    icon: jar.icon,
    color: jar.color,
    target_cents: jar.targetCents,
    target_date: jar.targetDate,
    planned_monthly_cents: jar.plannedMonthlyCents,
  };
  const { error } = isNew
    ? await supabase.rpc("create_jar", {
        p_id: jar.id,
        p_name: jar.name,
        p_icon: jar.icon,
        p_color: jar.color,
        p_opening_on: todayInSaoPaulo(),
        p_target_cents: jar.targetCents ?? undefined,
        p_target_date: jar.targetDate ?? undefined,
        p_planned_monthly_cents: jar.plannedMonthlyCents ?? undefined,
        p_opening_cents: jar.openingCents ?? undefined,
      })
    : await supabase.from("jars").update(fields).eq("id", jar.id);
  if (error?.code === uniqueViolation) return nameTaken;
  if (error) return failure;
  refresh();
  return { ok: true };
}

async function insertJarEntry(entry: JarEntryInput): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("jar_entries").upsert(
    {
      id: entry.id,
      jar_id: entry.jarId,
      kind: entry.kind,
      amount_cents: entry.amountCents,
      occurred_on: entry.occurredOn,
      note: entry.note || null,
      is_opening: entry.isOpening,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function addJarEntry(
  input: Omit<JarEntryInput, "isOpening">,
): Promise<ActionResult> {
  const parsed = jarEntryInput.safeParse({ ...input, isOpening: false });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const entry = parsed.data;
  if (entry.kind === "withdrawal") {
    const { supabase } = await requireUser();
    const { data, error } = await supabase.rpc("jar_totals");
    if (error) return failure;
    const balance =
      data.find((row) => row.jar_id === entry.jarId)?.balance_cents ?? 0;
    if (entry.amountCents > balance) {
      return {
        ok: false,
        errors: { amountCents: [m.jars.notEnough(formatBRL(balance))] },
      };
    }
  }
  return insertJarEntry(entry);
}

export async function restoreJarEntry(
  input: JarEntryInput,
): Promise<ActionResult> {
  const parsed = jarEntryInput.safeParse(input);
  if (!parsed.success) return failure;
  return insertJarEntry(parsed.data);
}

export async function deleteJarEntry(id: string): Promise<ActionResult> {
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return failure;
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("jar_entries")
    .delete()
    .eq("id", parsed.data);
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function closeMonth(month: string): Promise<ActionResult> {
  const value = parseMonth(month);
  if (!value) return failure;
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("month_closings")
    .insert({ month: `${value}-01` });
  if (error && error.code !== uniqueViolation) return failure;
  refresh();
  return { ok: true };
}

export async function reopenMonth(month: string): Promise<ActionResult> {
  const value = parseMonth(month);
  if (!value) return failure;
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("month_closings")
    .delete()
    .eq("month", `${value}-01`);
  if (error) return failure;
  refresh();
  return { ok: true };
}

export async function snoozeClosing(month: string) {
  const value = parseMonth(month);
  if (!value) return;
  const { supabase, userId } = await requireUser();
  await supabase
    .from("profiles")
    .update({ closing_snoozed_month: `${value}-01` })
    .eq("id", userId);
  refresh();
}

export async function finishOnboarding() {
  const { supabase, userId } = await requireUser();
  await supabase
    .from("profiles")
    .update({ onboarding_done_at: new Date().toISOString() })
    .eq("id", userId);
  refresh();
}

export async function createStarterCategories(
  input: StarterCategoryInput,
): Promise<ActionResult> {
  const parsed = starterCategoriesInput.safeParse(input);
  if (!parsed.success) return failure;
  const { supabase } = await requireUser();
  const { data: existing, error: readError } = await supabase
    .from("categories")
    .select("kind, name")
    .is("archived_at", null);
  if (readError) return failure;
  const taken = new Set(
    existing.map((row) => `${row.kind}:${row.name.toLowerCase()}`),
  );
  const rows = parsed.data
    .filter((row) => !taken.has(`${row.kind}:${row.name.toLowerCase()}`))
    .map((row, index) => ({ ...row, sort_order: existing.length + index }));
  if (rows.length > 0) {
    const { error } = await supabase.from("categories").insert(rows);
    if (error) return failure;
  }
  refresh();
  return { ok: true };
}
