"use server";

import { redirect } from "next/navigation";
import { type ActionResult, failure, fieldErrors } from "@/lib/action-result";
import { password } from "@/lib/credentials";
import { m } from "@/lib/i18n";
import { hashToken, isTokenShape } from "@/lib/invite-token";
import { type AcceptInviteInput, acceptInviteInput } from "@/lib/schemas/team";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, requireUser } from "@/lib/supabase/server";

const unavailable = { ok: false, message: m.invite.invalidText } as const;

export async function acceptInvite(
  token: string,
  input: AcceptInviteInput,
): Promise<ActionResult> {
  if (!isTokenShape(token)) return unavailable;
  const parsed = acceptInviteInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { name, email, password: secret } = parsed.data;
  const hash = hashToken(token);

  const admin = createAdminClient();
  const { data: invite, error: inviteError } = await admin
    .rpc("invite_info", { p_token_hash: hash })
    .maybeSingle();
  if (inviteError) return failure;
  if (!invite) return unavailable;

  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password: secret,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (createError?.code === "email_exists") {
    return { ok: false, errors: { email: [m.invite.emailTaken] } };
  }
  if (createError) return failure;

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: secret,
  });
  if (signInError) return failure;
  const { error } = await supabase.rpc("accept_invite", { p_token_hash: hash });
  if (error) return unavailable;
  return { ok: true };
}

export async function acceptInviteSignedIn(token: string) {
  if (!isTokenShape(token)) redirect("/");
  const { supabase } = await requireUser();
  await supabase.rpc("accept_invite", { p_token_hash: hashToken(token) });
  redirect("/");
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<ActionResult> {
  if (!isTokenShape(token)) return unavailable;
  const parsed = password.safeParse(newPassword);
  if (!parsed.success) {
    return {
      ok: false,
      errors: { password: [parsed.error.issues[0].message] },
    };
  }
  const admin = createAdminClient();
  const { data: userId, error } = await admin.rpc("consume_password_reset", {
    p_token_hash: hashToken(token),
  });
  if (error || !userId) return unavailable;
  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    password: parsed.data,
  });
  if (updateError) return failure;
  return { ok: true };
}
