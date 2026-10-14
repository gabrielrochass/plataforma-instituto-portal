import "server-only";

import { hashToken, isTokenShape } from "@/lib/invite-token";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function getInvite(token: string) {
  if (!isTokenShape(token)) return null;
  const { data, error } = await createAdminClient()
    .rpc("invite_info", { p_token_hash: hashToken(token) })
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPasswordReset(token: string) {
  if (!isTokenShape(token)) return null;
  const { data, error } = await createAdminClient()
    .rpc("password_reset_info", { p_token_hash: hashToken(token) })
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getSignedInEmail() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data ? (data.claims.email ?? "") : null;
}
