import "server-only";

import { cache } from "react";
import { photoUrls } from "@/lib/data/photos";
import { requireUser } from "@/lib/supabase/server";

export type StudentSituation = "active" | "all" | "pending";

export async function getStudents(filters: {
  query: string;
  unitId: string | null;
  situation: StudentSituation;
}) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("student_list", {
    p_query: filters.query || undefined,
    p_unit_id: filters.unitId ?? undefined,
    p_situation: filters.situation,
  });
  if (error) throw error;
  const photos = await photoUrls(data.map((row) => row.photo_path));
  return data.map((row) => ({
    ...row,
    photo: row.photo_path ? (photos.get(row.photo_path) ?? null) : null,
  }));
}

export type StudentRow = Awaited<ReturnType<typeof getStudents>>[number];

export const getStudent = cache(async (id: string) => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("students")
    .select(
      "id, full_name, social_name, birth_date, phone, email, registered_unit_id, last_assessed_on, photo_path, anonymized_at, units (code, name), guardians (id, full_name, relationship, phone, is_whatsapp, created_at), student_care (accessibility, accessibility_notes, notes_for_teachers), consents (id, kind, signed_on, revoked_on, created_at)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const photos = await photoUrls([data.photo_path]);
  return {
    ...data,
    photo: data.photo_path ? (photos.get(data.photo_path) ?? null) : null,
    guardians: [...data.guardians].sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    ),
  };
});

export type Student = NonNullable<Awaited<ReturnType<typeof getStudent>>>;

export const getStudentTimeline = cache(async (id: string) => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("student_timeline", {
    p_student_id: id,
  });
  if (error) throw error;
  return data;
});

export type TimelineEntry = Awaited<
  ReturnType<typeof getStudentTimeline>
>[number];

export async function getStudentCpf(id: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .rpc("student_private", { p_student_id: id })
    .maybeSingle();
  if (error) throw error;
  return data ? { cpf: data.cpf, anonymized: data.anonymized } : null;
}
