import "server-only";

import { cache } from "react";
import { addMonths, todayInSaoPaulo } from "@/lib/dates";
import { searchArgs, type TransactionFilters } from "@/lib/filters";
import { forecastJar, paceMonths } from "@/lib/goals";
import { requireUser } from "@/lib/supabase/server";

export const getCategories = cache(async () => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("categories")
    .select("id, kind, name, icon, color, monthly_limit_cents, archived_at")
    .order("sort_order")
    .order("created_at");
  if (error) throw error;
  return data;
});

export const getCards = cache(async () => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("cards")
    .select("id, name, design, best_purchase_day, due_day, archived_at")
    .order("sort_order")
    .order("created_at");
  if (error) throw error;
  return data;
});

const transactionColumns =
  "id, kind, amount_cents, occurred_on, description, category_id, payment_kind, card_id, installment_group_id, installment_number, installment_count, installment_purchased_on";

type Range = { from: string; to: string };

function filterArgs(range: Range | null, filters: Partial<TransactionFilters>) {
  return {
    ...(range && { p_from: range.from, p_to: range.to }),
    ...searchArgs(filters),
  };
}

export async function getTransactions(
  range: Range | null,
  filters: Partial<TransactionFilters> = {},
) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .rpc("filtered_transactions", filterArgs(range, filters))
    .select(`${transactionColumns}, created_at`)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id")
    .range(0, 999);
  if (error) throw error;
  return data;
}

export async function getRecentTransactions(today: string, limit: number) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("transactions")
    .select(transactionColumns)
    .lte("occurred_on", today)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getTransaction(id: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("transactions")
    .select(transactionColumns)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getLastPayment() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("transactions")
    .select("payment_kind, card_id")
    .eq("kind", "expense")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getDayTotals(
  range: Range | null,
  filters: Partial<TransactionFilters> = {},
) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc(
    "filtered_day_totals",
    filterArgs(range, filters),
  );
  if (error) throw error;
  const [totals] = data;
  return {
    expenses: totals?.total_expense_cents ?? 0,
    income: totals?.total_income_cents ?? 0,
    count: totals?.total_entries ?? 0,
    byDay: new Map(data.map((day) => [day.day, day.expense_cents])),
  };
}

export const getFirstDay = cache(async () => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("transactions")
    .select("occurred_on")
    .order("occurred_on")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.occurred_on ?? null;
});

export async function getMonthTotals(range: Range, categoryId?: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("month_totals", {
    p_from: range.from,
    p_to: range.to,
    ...(categoryId && { p_category_id: categoryId }),
  });
  if (error) throw error;
  return new Map(data.map((row) => [row.month.slice(0, 7), row]));
}

export async function getCategoryTotals(range: Range) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("category_totals", {
    p_from: range.from,
    p_to: range.to,
  });
  if (error) throw error;
  return data;
}

export async function getTopDescriptions(range: Range, categoryId?: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("top_descriptions", {
    p_from: range.from,
    p_to: range.to,
    ...(categoryId && { p_category_id: categoryId }),
  });
  if (error) throw error;
  return data;
}

export async function getAboveNormal(month: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("above_normal", {
    p_month: `${month}-01`,
  });
  if (error) throw error;
  return data;
}

export const getClosing = cache(async (month: string) => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("month_closings")
    .select("closed_at")
    .eq("month", `${month}-01`)
    .maybeSingle();
  if (error) throw error;
  return data?.closed_at ?? null;
});

export async function getOnboardingDone() {
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_done_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.onboarding_done_at != null;
}

export async function getSnoozedClosing() {
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("closing_snoozed_month")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.closing_snoozed_month?.slice(0, 7) ?? null;
}

export async function getJarNet(range: Range) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("jar_months", {
    p_from: range.from,
    p_to: range.to,
  });
  if (error) throw error;
  return data.reduce((sum, row) => sum + row.net_cents, 0);
}

export const getJars = cache(async () => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("jars")
    .select(
      "id, name, icon, color, target_cents, target_date, planned_monthly_cents, archived_at, created_at",
    )
    .order("sort_order")
    .order("created_at");
  if (error) throw error;
  return data;
});

export async function getJarSnapshots(today: string) {
  const { supabase } = await requireUser();
  const currentMonth = today.slice(0, 7);
  const [jars, totals, months] = await Promise.all([
    getJars(),
    supabase.rpc("jar_totals"),
    supabase.rpc("jar_months", {
      p_from: `${addMonths(currentMonth, -paceMonths)}-01`,
      p_to: `${currentMonth}-01`,
    }),
  ]);
  if (totals.error) throw totals.error;
  if (months.error) throw months.error;
  const totalById = new Map(totals.data.map((row) => [row.jar_id, row]));
  return jars.map((jar) => {
    const total = totalById.get(jar.id);
    const balance = total?.balance_cents ?? 0;
    const nets = new Map(
      months.data
        .filter((row) => row.jar_id === jar.id)
        .map((row) => [row.month.slice(0, 7), row.net_cents]),
    );
    return {
      jar,
      balance,
      forecast: forecastJar({
        target: jar.target_cents,
        targetDate: jar.target_date,
        planned: jar.planned_monthly_cents,
        start: {
          on: todayInSaoPaulo(new Date(jar.created_at)),
          cents: total?.opening_cents ?? 0,
        },
        balance,
        nets,
        firstMonth: total?.first_month?.slice(0, 7) ?? null,
        today,
      }),
    };
  });
}

export async function getJarEntries(jarId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("jar_entries")
    .select("id, kind, amount_cents, occurred_on, note, is_opening")
    .eq("jar_id", jarId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data;
}

export type Jar = Awaited<ReturnType<typeof getJars>>[number];
export type JarSnapshot = Awaited<ReturnType<typeof getJarSnapshots>>[number];
export type JarEntry = Awaited<ReturnType<typeof getJarEntries>>[number];
export type Category = Awaited<ReturnType<typeof getCategories>>[number];
export type Card = Awaited<ReturnType<typeof getCards>>[number];
export type Transaction = NonNullable<
  Awaited<ReturnType<typeof getTransaction>>
>;
export type Payment = NonNullable<Awaited<ReturnType<typeof getLastPayment>>>;
