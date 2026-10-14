"use server";

import { redirect } from "next/navigation";
import { signInPath } from "@/lib/auth-paths";
import { m } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, requireUser } from "@/lib/supabase/server";

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

export async function deleteAccount(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  if (formData.get("confirm") !== "on") {
    return { message: m.account.confirmRequired };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(signInPath());
  const { error } = await createAdminClient().auth.admin.deleteUser(user.id);
  if (error) return { message: m.common.tryAgain };
  await supabase.auth.signOut({ scope: "local" });
  redirect("/entrar?conta=excluida");
}
