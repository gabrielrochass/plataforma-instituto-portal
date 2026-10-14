import "server-only";

import { requireUser } from "@/lib/supabase/server";

export async function getAssessments(classId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("assessments")
    .select("id, title, held_on, weight, grades (enrollment_id)")
    .eq("class_id", classId)
    .order("held_on", { nullsFirst: false })
    .order("created_at");
  if (error) throw error;
  return data.map((row) => ({ ...row, graded: row.grades.length }));
}

export type Assessment = Awaited<ReturnType<typeof getAssessments>>[number];

export async function getAssessment(id: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("assessments")
    .select(
      "id, class_id, title, held_on, weight, grades (enrollment_id, score, concept, missed)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getClassResults(classId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("class_results", {
    p_class_id: classId,
  });
  if (error) throw error;
  return data;
}

export type ClassResult = Awaited<ReturnType<typeof getClassResults>>[number];
