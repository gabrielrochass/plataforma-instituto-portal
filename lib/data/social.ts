import "server-only";

import type { SocialProfile } from "@/lib/ficha";
import { requireUser } from "@/lib/supabase/server";

export async function getSocialProfiles(studentId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("student_social_profiles", {
    p_student_id: studentId,
  });
  if (error) throw error;
  return data as SocialProfile[];
}

export async function getAlumniOutcomes(studentId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("student_alumni_outcomes", {
    p_student_id: studentId,
  });
  if (error) throw error;
  return data;
}

export type AlumniOutcome = Awaited<
  ReturnType<typeof getAlumniOutcomes>
>[number];

export async function getAccessLog(studentId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("student_access_log", {
    p_student_id: studentId,
  });
  if (error) throw error;
  return data;
}
