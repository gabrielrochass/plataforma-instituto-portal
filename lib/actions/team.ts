"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import {
  type ActionResult,
  failure,
  failureFor,
  fieldErrors,
  type LinkResult,
} from "@/lib/action-result";
import { getViewer } from "@/lib/data/viewer";
import { m } from "@/lib/i18n";
import { newToken } from "@/lib/invite-token";
import { can, invitableRoles } from "@/lib/roles";
import {
  type InviteInput,
  inviteInput,
  type MembershipInput,
  membershipInput,
  type UnitInput,
  unitInput,
} from "@/lib/schemas/team";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const forbidden = { ok: false, message: m.errors.forbidden } as const;
const lastAdmin = { ok: false, message: m.team.lastAdmin } as const;
const uuid = z.uuid();

export async function createInvite(input: InviteInput): Promise<LinkResult> {
  const parsed = inviteInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { id, name, kind, unitId } = parsed.data;
  const viewer = await getViewer();
  const role = kind === "teacher" ? "teacher" : "admin";
  const allowed =
    kind === "adminGeral"
      ? viewer.isAdminGeral
      : invitableRoles(viewer, unitId).includes(role);
  if (!allowed) return forbidden;

  const { token, hash } = newToken();
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_invite", {
    p_id: id,
    p_token_hash: hash,
    p_display_name: name,
    p_unit_id: (kind === "adminGeral" ? null : unitId) as string,
    p_role: role,
    p_admin_geral: kind === "adminGeral",
  });
  if (error) return failureFor(error);
  refresh();
  return { ok: true, token };
}

export async function revokeInvite(id: string): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return failure;
  const viewer = await getViewer();
  if (!can.manageTeam(viewer)) return forbidden;
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_invite", { p_id: id });
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function setMembership(
  input: MembershipInput,
): Promise<ActionResult> {
  const parsed = membershipInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const viewer = await getViewer();
  if (!can.manageTeam(viewer)) return forbidden;
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_membership", {
    p_user_id: parsed.data.userId,
    p_unit_id: parsed.data.unitId,
    p_role: parsed.data.role,
  });
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function removeMembership(
  userId: string,
  unitId: string,
): Promise<ActionResult> {
  if (!uuid.safeParse(userId).success || !uuid.safeParse(unitId).success) {
    return failure;
  }
  const viewer = await getViewer();
  if (!can.manageTeam(viewer)) return forbidden;
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_membership", {
    p_user_id: userId,
    p_unit_id: unitId,
  });
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function setStaffActive(
  userId: string,
  active: boolean,
): Promise<ActionResult> {
  if (!uuid.safeParse(userId).success) return failure;
  const viewer = await getViewer();
  if (!can.manageTeam(viewer)) return forbidden;
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_staff_active", {
    p_user_id: userId,
    p_active: active,
  });
  if (error) return error.code === "23514" ? lastAdmin : failureFor(error);
  const { error: banError } =
    await createAdminClient().auth.admin.updateUserById(userId, {
      ban_duration: active ? "none" : "876000h",
    });
  if (banError) return failure;
  refresh();
  return { ok: true };
}

export async function setAdminGeral(
  userId: string,
  value: boolean,
): Promise<ActionResult> {
  if (!uuid.safeParse(userId).success) return failure;
  const viewer = await getViewer();
  if (!can.manageUnits(viewer)) return forbidden;
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_admin_geral", {
    p_user_id: userId,
    p_value: value,
  });
  if (error) return error.code === "23514" ? lastAdmin : failureFor(error);
  refresh();
  return { ok: true };
}

export async function createPasswordReset(userId: string): Promise<LinkResult> {
  if (!uuid.safeParse(userId).success) return failure;
  const viewer = await getViewer();
  if (!can.manageTeam(viewer)) return forbidden;
  const { token, hash } = newToken();
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_password_reset", {
    p_user_id: userId,
    p_token_hash: hash,
  });
  if (error) return failureFor(error);
  return { ok: true, token };
}

export async function saveUnit(
  input: UnitInput,
  isNew: boolean,
): Promise<ActionResult> {
  const parsed = unitInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const viewer = await getViewer();
  if (!can.manageUnits(viewer)) return forbidden;
  const { id, code, name } = parsed.data;
  const supabase = await createClient();
  const { error } = isNew
    ? await supabase
        .from("units")
        .upsert(
          { id, code, name },
          { onConflict: "id", ignoreDuplicates: true },
        )
    : await supabase.from("units").update({ name }).eq("id", id);
  if (error?.code === "23505") {
    return { ok: false, errors: { code: [m.units.taken] } };
  }
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}
