import "server-only";

import { cache } from "react";
import { requireUser } from "@/lib/supabase/server";

export const getAttendanceDays = cache(async (from: string) => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("attendance_days", {
    p_from: from,
  });
  if (error) throw error;
  const taken = new Map<string, Set<string>>();
  for (const row of data) {
    taken.set(
      row.class_id,
      (taken.get(row.class_id) ?? new Set()).add(row.held_on),
    );
  }
  return taken;
});

export const getAbsenceAlerts = cache(async () => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("absence_alerts");
  if (error) throw error;
  return data;
});

export type AbsenceAlert = Awaited<ReturnType<typeof getAbsenceAlerts>>[number];

export async function getAttendanceRoster(classId: string, day: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("attendance_roster", {
    p_class_id: classId,
    p_held_on: day,
  });
  if (error) throw error;
  return data;
}

export type AttendanceRosterRow = Awaited<
  ReturnType<typeof getAttendanceRoster>
>[number];

export const getClassAttendance = cache(async (classId: string) => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("class_attendance", {
    p_class_id: classId,
  });
  if (error) throw error;
  return new Map(data.map((row) => [row.enrollment_id, row]));
});

export async function getCaseNotes(studentId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("case_notes")
    .select(
      "id, kind, happened_on, body, author_id, created_at, profiles (display_name)",
    )
    .eq("student_id", studentId)
    .order("happened_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data;
}

export type CaseNote = Awaited<ReturnType<typeof getCaseNotes>>[number];

export async function getHomeCounts() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("home_counts").single();
  if (error) throw error;
  return data;
}
