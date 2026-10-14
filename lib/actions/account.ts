"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { m } from "@/lib/i18n";
import { requireUser } from "@/lib/supabase/server";

export async function signOut() {
  const { supabase } = await requireUser();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/entrar");
}

export type FormState = { message: string } | null;

export async function signOutEverywhere(_: FormState): Promise<FormState> {
  const { supabase } = await requireUser();
  const { error } = await supabase.auth.signOut({ scope: "others" });
  if (error) return { message: m.account.signOutEverywhereFailed };
  await supabase.auth.signOut({ scope: "local" });
  redirect("/entrar");
}

export async function finishOnboarding() {
  const { supabase, userId } = await requireUser();
  await supabase
    .from("profiles")
    .update({ onboarding_done_at: new Date().toISOString() })
    .eq("id", userId);
  refresh();
}
