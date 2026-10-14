import "server-only";

import { cache } from "react";
import { createClient, requireUser } from "@/lib/supabase/server";

export const getCertificates = cache(async (classId: string) => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("certificates")
    .select(
      "id, code, student_id, student_name, course_name, unit_name, workload_hours, starts_on, ends_on, issued_on, revoked_at, revoke_reason",
    )
    .eq("class_id", classId)
    .order("student_name")
    .order("issued_on", { ascending: false });
  if (error) throw error;
  return data;
});

export type Certificate = Awaited<ReturnType<typeof getCertificates>>[number];

export async function verifyCertificate(code: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("verify_certificate", {
    p_code: code,
  });
  if (error) throw error;
  return data[0] ?? null;
}
