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
import { m } from "@/lib/i18n";
import { isoDate, text } from "@/lib/schemas/classes";
import { createClient } from "@/lib/supabase/server";

const assessmentInput = z.object({
  id: z.uuid(),
  classId: z.uuid(),
  title: text(80, m.grades.titleRequired),
  heldOn: z.union([z.literal(""), isoDate]),
  weight: z
    .number(m.grades.weightInvalid)
    .positive(m.grades.weightInvalid)
    .max(100, m.grades.weightInvalid),
});

export async function saveAssessment(
  input: z.input<typeof assessmentInput>,
  isNew: boolean,
): Promise<ActionResult> {
  const parsed = assessmentInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { id, classId, title, heldOn, weight } = parsed.data;
  await getViewer();
  const supabase = await createClient();
  const row = { title, held_on: heldOn || null, weight };
  const { error } = isNew
    ? await supabase
        .from("assessments")
        .upsert(
          { id, class_id: classId, ...row },
          { onConflict: "id", ignoreDuplicates: true },
        )
    : await supabase.from("assessments").update(row).eq("id", id);
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function deleteAssessment(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return failure;
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.from("assessments").delete().eq("id", id);
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

const gradesInput = z.object({
  assessmentId: z.uuid(),
  grades: z
    .array(
      z.object({
        enrollmentId: z.uuid(),
        score: z.number().min(0).max(100).nullable(),
        concept: z.string().trim().min(1).max(20).nullable(),
        missed: z.boolean(),
      }),
    )
    .max(300),
});

export async function saveGrades(
  input: z.input<typeof gradesInput>,
): Promise<ActionResult> {
  const parsed = gradesInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_grades", {
    p_assessment_id: parsed.data.assessmentId,
    p_grades: parsed.data.grades.map((grade) => ({
      enrollment_id: grade.enrollmentId,
      score: grade.score,
      concept: grade.concept,
      missed: grade.missed,
    })),
  });
  if (error?.code === "23514") {
    return { ok: false, message: m.grades.outOfRange };
  }
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

const closeInput = z.object({
  classId: z.uuid(),
  overrides: z
    .array(
      z.object({
        enrollmentId: z.uuid(),
        passed: z.boolean(),
        reason: text(500, m.closing.reasonRequired),
      }),
    )
    .max(300),
});

export async function closeClass(
  input: z.input<typeof closeInput>,
): Promise<ActionResult> {
  const parsed = closeInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("close_class", {
    p_class_id: parsed.data.classId,
    p_overrides: parsed.data.overrides.map((override) => ({
      enrollment_id: override.enrollmentId,
      passed: override.passed,
      reason: override.reason,
    })),
  });
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function reopenClass(classId: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(classId).success) return failure;
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("reopen_class", { p_class_id: classId });
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}
