"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import {
  type ActionResult,
  failure,
  failureFor,
  fieldErrors,
} from "@/lib/action-result";
import { getViewer } from "@/lib/data/viewer";
import { toGradingColumns } from "@/lib/grading";
import { m } from "@/lib/i18n";
import { can, isAdminOf } from "@/lib/roles";
import type { Session, Slot } from "@/lib/schedule";
import {
  type ClassInput,
  type ClassUpdateInput,
  type ClosureInput,
  type CourseInput,
  classInput,
  classUpdateInput,
  closureInput,
  courseInput,
} from "@/lib/schemas/classes";
import { createClient } from "@/lib/supabase/server";

const forbidden = { ok: false, message: m.errors.forbidden } as const;
const uuid = z.uuid();

function scheduleJson(slots: readonly Slot[]) {
  return slots.map((slot) => ({
    weekday: slot.weekday,
    starts_at: slot.startsAt,
    ends_at: slot.endsAt,
  }));
}

function sessionsJson(sessions: readonly Session[]) {
  return sessions.map((session) => ({
    held_on: session.heldOn,
    starts_at: session.startsAt,
    ends_at: session.endsAt,
  }));
}

function gradingArgs(rules: ClassInput["rules"]) {
  const columns = toGradingColumns(rules);
  return {
    p_grading_scheme: columns.grading_scheme,
    p_passing_score: columns.passing_score ?? undefined,
    p_concept_labels: columns.concept_labels ?? undefined,
    p_concept_passing: columns.concept_passing ?? undefined,
    p_min_attendance: columns.min_attendance,
  };
}

export async function saveCourse(
  input: CourseInput,
  isNew: boolean,
): Promise<ActionResult> {
  const parsed = courseInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const viewer = await getViewer();
  if (!viewer.isAdminGeral && !can.manageTeam(viewer)) return forbidden;
  const { id, name, description, workloadHours, rules } = parsed.data;
  const row = {
    name,
    description,
    workload_hours: workloadHours,
    ...toGradingColumns(rules),
  };
  const supabase = await createClient();
  const { error } = isNew
    ? await supabase
        .from("courses")
        .upsert({ id, ...row }, { onConflict: "id", ignoreDuplicates: true })
    : await supabase.from("courses").update(row).eq("id", id);
  if (error?.code === "23505") {
    return { ok: false, errors: { name: [m.courses.taken] } };
  }
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function addClosure(input: ClosureInput): Promise<ActionResult> {
  const parsed = closureInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { id, unitId, startsOn, endsOn, reason } = parsed.data;
  const viewer = await getViewer();
  if (unitId ? !isAdminOf(viewer, unitId) : !viewer.isAdminGeral) {
    return forbidden;
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("calendar_closures")
    .upsert(
      { id, unit_id: unitId, starts_on: startsOn, ends_on: endsOn, reason },
      { onConflict: "id", ignoreDuplicates: true },
    );
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function removeClosure(id: string): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return failure;
  const viewer = await getViewer();
  if (!can.manageTeam(viewer)) return forbidden;
  const supabase = await createClient();
  const { error } = await supabase
    .from("calendar_closures")
    .delete()
    .eq("id", id);
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function createClass(input: ClassInput): Promise<ActionResult> {
  const parsed = classInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const value = parsed.data;
  const viewer = await getViewer();
  if (
    !viewer.isAdminGeral &&
    !viewer.memberships.some((row) => row.unit.id === value.unitId)
  ) {
    return forbidden;
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_class", {
    p_id: value.id,
    p_course_id: value.courseId,
    p_unit_id: value.unitId,
    p_name: value.name,
    p_starts_on: value.startsOn,
    p_ends_on: value.endsOn,
    p_schedule: scheduleJson(value.slots),
    p_capacity: value.capacity ?? undefined,
    p_teacher_ids: value.teacherIds,
    p_sessions: sessionsJson(value.sessions),
    ...gradingArgs(value.rules),
  });
  if (error?.code === "23505") {
    return { ok: false, errors: { name: [m.wizard.errors.nameTaken] } };
  }
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function updateClass(
  input: ClassUpdateInput,
): Promise<ActionResult> {
  const parsed = classUpdateInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const value = parsed.data;
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_class", {
    p_id: value.id,
    p_name: value.name,
    p_ends_on: value.endsOn,
    p_schedule: scheduleJson(value.slots),
    p_capacity: value.capacity ?? undefined,
    p_teacher_ids: value.teacherIds,
    p_remove_session_ids: value.removeSessionIds,
    p_add_sessions: sessionsJson(value.addSessions),
    ...gradingArgs(value.rules),
  });
  if (error?.code === "23505") {
    return { ok: false, errors: { name: [m.wizard.errors.nameTaken] } };
  }
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function cancelClass(id: string): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return failure;
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_class", { p_class_id: id });
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}
