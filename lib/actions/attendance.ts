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
import {
  type AttendanceInput,
  attendanceInput,
  type CaseNoteInput,
  caseNoteInput,
} from "@/lib/schemas/attendance";
import { createClient } from "@/lib/supabase/server";

export async function takeAttendance(
  input: AttendanceInput,
): Promise<ActionResult> {
  const parsed = attendanceInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { classId, day, presentIds, note } = parsed.data;
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("take_attendance", {
    p_class_id: classId,
    p_held_on: day,
    p_present: presentIds,
    p_note: note ?? undefined,
  });
  if (error?.code === "22023") {
    return { ok: false, errors: { day: [m.attendance.dayOutside] } };
  }
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function deleteAttendance(
  sessionId: string,
): Promise<ActionResult> {
  if (!z.uuid().safeParse(sessionId).success) return failure;
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_attendance", {
    p_session_id: sessionId,
  });
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function addCaseNote(input: CaseNoteInput): Promise<ActionResult> {
  const parsed = caseNoteInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { id, studentId, kind, happenedOn, body } = parsed.data;
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.from("case_notes").upsert(
    {
      id,
      student_id: studentId,
      kind,
      happened_on: happenedOn,
      body: body ?? "",
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}
