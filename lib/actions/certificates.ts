"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import {
  type ActionResult,
  type Failure,
  failure,
  failureFor,
  fieldErrors,
} from "@/lib/action-result";
import { getViewer } from "@/lib/data/viewer";
import { m } from "@/lib/i18n";
import { text } from "@/lib/schemas/classes";
import { createClient } from "@/lib/supabase/server";

export async function issueCertificates(
  classId: string,
): Promise<{ ok: true; count: number } | Failure> {
  if (!z.uuid().safeParse(classId).success) return failure;
  await getViewer();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("issue_certificates", {
    p_class_id: classId,
  });
  if (error) return failureFor(error);
  refresh();
  return { ok: true, count: data };
}

const revokeInput = z.object({
  id: z.uuid(),
  reason: text(200, m.certificates.reasonRequired),
});

export async function revokeCertificate(
  input: z.input<typeof revokeInput>,
): Promise<ActionResult> {
  const parsed = revokeInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_certificate", {
    p_id: parsed.data.id,
    p_reason: parsed.data.reason,
  });
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}
