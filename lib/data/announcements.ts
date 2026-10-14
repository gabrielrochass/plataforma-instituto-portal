import "server-only";

import { cache } from "react";
import { requireUser } from "@/lib/supabase/server";

export const getAnnouncements = cache(async () => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("announcement_list");
  if (error) throw error;
  return data;
});

export type Announcement = Awaited<ReturnType<typeof getAnnouncements>>[number];
