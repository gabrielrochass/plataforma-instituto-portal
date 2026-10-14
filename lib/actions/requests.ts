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
import { isAdminOf } from "@/lib/roles";
import { type RequestInput, requestInput } from "@/lib/schemas/requests";
import { createClient } from "@/lib/supabase/server";

const uuid = z.uuid();
const forbidden = { ok: false, message: m.errors.forbidden } as const;

export async function submitRequest(
  input: RequestInput,
  trap: { honeypot: string; startedAt: number },
): Promise<{ ok: true; protocol: string } | Failure> {
  if (trap.honeypot || Date.now() - trap.startedAt < 3000) {
    return { ok: false, message: m.requests.errors.tooFast };
  }
  const parsed = requestInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const value = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_enrollment_request", {
    p_offer_id: value.offerId,
    p_full_name: value.fullName,
    p_social_name: value.socialName ?? undefined,
    p_birth_date: value.birthDate,
    p_phone: value.phone,
    p_email: value.email ?? undefined,
    p_neighborhood: value.neighborhood ?? undefined,
    p_guardian_name: value.guardianName ?? undefined,
    p_guardian_phone: value.guardianPhone ?? undefined,
    p_consent: value.consent,
  });
  if (error?.code === "55000") {
    return { ok: false, message: m.requests.errors.closed };
  }
  if (error?.code === "54000") {
    return { ok: false, message: m.requests.errors.limit };
  }
  if (error?.code === "23514") {
    return {
      ok: false,
      errors: { guardianName: [m.requests.errors.guardian] },
    };
  }
  if (error || !data) return failure;
  return { ok: true, protocol: data };
}

export async function openOffer(input: {
  id: string;
  classId: string;
  description: string;
  closesOn: string;
}): Promise<ActionResult> {
  const parsed = z
    .object({
      id: z.uuid(),
      classId: z.uuid(m.requests.course),
      description: z.string().trim().max(1000),
      closesOn: z.union([
        z.literal(""),
        z.string().regex(/^(20\d{2}|2100)-\d{2}-\d{2}$/),
      ]),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const value = parsed.data;
  const viewer = await getViewer();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("classes")
    .select("unit_id")
    .eq("id", value.classId)
    .maybeSingle();
  if (!row || !isAdminOf(viewer, row.unit_id)) return forbidden;
  const { error } = await supabase.from("enrollment_offers").upsert(
    {
      id: value.id,
      class_id: value.classId,
      unit_id: row.unit_id,
      description: value.description || null,
      closes_on: value.closesOn || null,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (error?.code === "23505") {
    return { ok: false, errors: { classId: [m.requests.alreadyOpen] } };
  }
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function setOfferOpen(
  id: string,
  isOpen: boolean,
): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return failure;
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase
    .from("enrollment_offers")
    .update({ is_open: isOpen })
    .eq("id", id);
  if (error?.code === "23505") {
    return { ok: false, message: m.requests.alreadyOpen };
  }
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function decideRequest(
  id: string,
  status: "pending" | "waitlisted" | "declined" | "withdrawn",
): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return failure;
  const viewer = await getViewer();
  const supabase = await createClient();
  const { error } = await supabase
    .from("enrollment_requests")
    .update({
      status,
      decided_by: viewer.id,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function convertRequest(input: {
  requestId: string;
  classId: string;
  enrollmentId: string;
  studentId: string | null;
  newStudentId: string;
}): Promise<ActionResult> {
  const ids = [
    input.requestId,
    input.classId,
    input.enrollmentId,
    input.newStudentId,
  ];
  if (
    !ids.every((id) => uuid.safeParse(id).success) ||
    (input.studentId !== null && !uuid.safeParse(input.studentId).success)
  ) {
    return failure;
  }
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("convert_enrollment_request", {
    p_request_id: input.requestId,
    p_class_id: input.classId,
    p_enrollment_id: input.enrollmentId,
    p_student_id: input.studentId ?? undefined,
    p_new_student_id: input.studentId ? undefined : input.newStudentId,
  });
  if (error?.code === "54000") return { ok: false, message: m.enrollment.full };
  if (error?.code === "23505") {
    return { ok: false, message: m.enrollment.alreadyHere };
  }
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}
