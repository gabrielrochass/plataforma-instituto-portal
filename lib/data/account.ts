import "server-only";

import { cache } from "react";
import { requireUser } from "@/lib/supabase/server";

export const getProfile = cache(async () => {
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, onboarding_done_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
});
