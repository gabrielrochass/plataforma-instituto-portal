import "server-only";

import { forbidden, redirect } from "next/navigation";
import { cache } from "react";
import {
  can,
  hasAccess,
  isAdminOf,
  type Membership,
  type Viewer,
} from "@/lib/roles";
import { requireUser } from "@/lib/supabase/server";

export const getViewer = cache(async (): Promise<Viewer> => {
  const { supabase, userId, claims } = await requireUser();
  const [profile, memberships, teaching] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "display_name, is_admin_geral, deactivated_at, onboarding_done_at",
      )
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("staff_memberships")
      .select("role, units (id, code, name)")
      .eq("user_id", userId),
    supabase
      .from("class_teachers")
      .select("class_id, classes!inner (status)", {
        count: "exact",
        head: true,
      })
      .eq("user_id", userId)
      .eq("classes.status", "open"),
  ]);
  if (profile.error) throw profile.error;
  if (memberships.error) throw memberships.error;
  if (!profile.data || profile.data.deactivated_at) redirect("/sem-acesso");

  const viewer: Viewer = {
    id: userId,
    name: profile.data.display_name,
    email: claims.email ?? "",
    isAdminGeral: profile.data.is_admin_geral,
    memberships: memberships.data
      .flatMap((row): Membership[] =>
        row.units ? [{ unit: row.units, role: row.role }] : [],
      )
      .sort((a, b) => a.unit.code.localeCompare(b.unit.code)),
    onboarded: profile.data.onboarding_done_at !== null,
    teaches: (teaching.count ?? 0) > 0,
  };
  if (!hasAccess(viewer)) redirect("/sem-acesso");
  return viewer;
});

export async function requireTeamManager() {
  const viewer = await getViewer();
  if (!can.manageTeam(viewer)) forbidden();
  return viewer;
}

export async function requireAdminOf(unitId: string) {
  const viewer = await getViewer();
  if (!isAdminOf(viewer, unitId)) forbidden();
  return viewer;
}

export async function requireAdminGeral() {
  const viewer = await getViewer();
  if (!can.manageUnits(viewer)) forbidden();
  return viewer;
}
