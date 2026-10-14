import "server-only";

import { cache } from "react";
import type { UnitRole } from "@/lib/roles";
import { requireUser } from "@/lib/supabase/server";

export const getUnits = cache(async () => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("units")
    .select("id, code, name")
    .is("archived_at", null)
    .order("code");
  if (error) throw error;
  return data;
});

export const getTeam = cache(async () => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("team_members");
  if (error) throw error;
  return data.map((member) => ({
    ...member,
    memberships: member.memberships as { unit_id: string; role: UnitRole }[],
  }));
});

export type TeamMember = Awaited<ReturnType<typeof getTeam>>[number];

export async function getPendingInvites() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("pending_invites");
  if (error) throw error;
  return data;
}
