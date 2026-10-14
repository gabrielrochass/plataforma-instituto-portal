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
  cancelSessionInput,
  caseNoteInput,
} from "@/lib/schemas/attendance";
import { createClient } from "@/lib/supabase/server";

export async function takeAttendance(
  input: AttendanceInput,
): Promise<ActionResult> {
  const parsed = attendanceInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { sessionId, topic, marks } = parsed.data;
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("take_attendance", {
    p_session_id: sessionId,
    p_topic: topic ?? undefined,
    p_marks: marks.map((mark) => ({
      enrollment_id: mark.enrollmentId,
      status: mark.status,
      note: mark.note,
    })),
  });
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function cancelSession(
  sessionId: string,
  reason: string,
): Promise<ActionResult> {
  const parsed = cancelSessionInput.safeParse({ sessionId, reason });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_session", {
    p_session_id: parsed.data.sessionId,
    p_reason: parsed.data.reason,
  });
  if (error?.code === "55000") {
    return { ok: false, message: m.attendance.cannotCancel };
  }
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function restoreSession(sessionId: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(sessionId).success) return failure;
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("restore_session", {
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
