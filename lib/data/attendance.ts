import "server-only";

import { cache } from "react";
import { requireUser } from "@/lib/supabase/server";

const time = (value: string) => value.slice(0, 5);

export const getTodaySessions = cache(async () => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("today_sessions");
  if (error) throw error;
  return data.map((row) => ({
    ...row,
    starts_at: time(row.starts_at),
    ends_at: time(row.ends_at),
  }));
});

export const getPendingSessions = cache(async () => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("pending_sessions", {
    p_days: 14,
  });
  if (error) throw error;
  return data.map((row) => ({
    ...row,
    starts_at: time(row.starts_at),
    ends_at: time(row.ends_at),
  }));
});

export type PendingSession = Awaited<
  ReturnType<typeof getPendingSessions>
>[number];

export const getAbsenceAlerts = cache(async () => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("absence_alerts");
  if (error) throw error;
  return data;
});

export type AbsenceAlert = Awaited<ReturnType<typeof getAbsenceAlerts>>[number];

export async function getSession(sessionId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("class_sessions")
    .select(
      "id, class_id, held_on, starts_at, ends_at, topic, cancelled_at, cancel_reason, attendance_taken_at",
    )
    .eq("id", sessionId)
    .maybeSingle();
  if (error) throw error;
  return data
    ? { ...data, starts_at: time(data.starts_at), ends_at: time(data.ends_at) }
    : null;
}

export async function getSessionRoster(sessionId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("session_roster", {
    p_session_id: sessionId,
  });
  if (error) throw error;
  return data;
}

export type SessionRosterRow = Awaited<
  ReturnType<typeof getSessionRoster>
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
