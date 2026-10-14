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
import {
  type ClassInput,
  type ClassUpdateInput,
  classInput,
  classUpdateInput,
} from "@/lib/schemas/classes";
import { createClient } from "@/lib/supabase/server";

const forbidden = { ok: false, message: m.errors.forbidden } as const;

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

function classErrors(error: { code?: string; message?: string }): ActionResult {
  if (error.code === "23505") {
    return { ok: false, errors: { name: [m.classForm.errors.nameTaken] } };
  }
  if (error.code === "23514" && error.message?.includes("attendance")) {
    return {
      ok: false,
      errors: { startsOn: [m.classForm.errors.attendanceOutside] },
    };
  }
  return failureFor(error);
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
    p_unit_id: value.unitId,
    p_name: value.name,
    p_starts_on: value.startsOn,
    p_ends_on: value.endsOn,
    p_weekdays: value.weekdays,
    p_workload_hours: value.workloadHours,
    p_capacity: value.capacity ?? undefined,
    p_teacher_ids: value.teacherIds,
    ...gradingArgs(value.rules),
  });
  if (error) return classErrors(error);
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
    p_starts_on: value.startsOn,
    p_ends_on: value.endsOn,
    p_weekdays: value.weekdays,
    p_workload_hours: value.workloadHours,
    p_capacity: value.capacity ?? undefined,
    p_teacher_ids: value.teacherIds,
    ...gradingArgs(value.rules),
  });
  if (error) return classErrors(error);
  refresh();
  return { ok: true };
}

export async function cancelClass(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return failure;
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_class", { p_class_id: id });
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}
