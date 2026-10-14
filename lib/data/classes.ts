import "server-only";

import { cache } from "react";
import { fromGradingColumns } from "@/lib/grading";
import { requireUser } from "@/lib/supabase/server";

async function classList(classId?: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc(
    "class_list",
    classId ? { p_class_id: classId } : {},
  );
  if (error) throw error;
  return data.map((row) => ({
    ...row,
    rules: fromGradingColumns(row),
  }));
}

export const getClasses = cache(() => classList());

export type ClassSummary = Awaited<ReturnType<typeof getClasses>>[number];

export const getClass = cache(async (id: string) => {
  const [found] = await classList(id);
  return found ?? null;
});

export const getClassSessions = cache(async (classId: string) => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("class_session_list", {
    p_class_id: classId,
  });
  if (error) throw error;
  return data;
});

export type ClassSession = Awaited<ReturnType<typeof getClassSessions>>[number];

export async function getRoster(classId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("enrollments")
    .select(
      "id, status, enrolled_on, ended_on, exit_reason, student_id, students (full_name, social_name, birth_date, photo_path, student_care (accessibility))",
    )
    .eq("class_id", classId)
    .order("enrolled_on");
  if (error) throw error;
  return data.flatMap((row) =>
    row.students
      ? [
          {
            id: row.id,
            status: row.status,
            enrolledOn: row.enrolled_on,
            endedOn: row.ended_on,
            exitReason: row.exit_reason,
            studentId: row.student_id,
            fullName: row.students.full_name,
            socialName: row.students.social_name,
            birthDate: row.students.birth_date,
            photoPath: row.students.photo_path,
            accessibility: row.students.student_care?.accessibility ?? [],
          },
        ]
      : [],
  );
}

export type RosterEntry = Awaited<ReturnType<typeof getRoster>>[number];

export async function getUnitStaff(unitId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("staff_memberships")
    .select("user_id, role, profiles (display_name, deactivated_at)")
    .eq("unit_id", unitId);
  if (error) throw error;
  return data
    .filter((row) => row.profiles && !row.profiles.deactivated_at)
    .map((row) => ({
      id: row.user_id,
      name: row.profiles?.display_name ?? "",
      role: row.role,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export type StaffOption = Awaited<ReturnType<typeof getUnitStaff>>[number];
