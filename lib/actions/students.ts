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
import {
  type EndInput,
  endInput,
  type StudentInput,
  type StudentUpdateInput,
  studentInput,
  studentUpdateInput,
  type TransferInput,
  transferInput,
} from "@/lib/schemas/students";
import { createClient } from "@/lib/supabase/server";

const uuid = z.uuid();

function enrollmentFailure(error: { code?: string }): Failure {
  if (error.code === "54000") return { ok: false, message: m.enrollment.full };
  if (error.code === "23514") {
    return { ok: false, message: m.enrollment.minorWithoutGuardian };
  }
  if (error.code === "23505") {
    return { ok: false, message: m.enrollment.alreadyHere };
  }
  return failureFor(error);
}

export async function registerStudent(
  input: StudentInput,
): Promise<ActionResult> {
  const parsed = studentInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const value = parsed.data;
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("register_student", {
    p_id: value.id,
    p_full_name: value.fullName,
    p_social_name: value.socialName ?? undefined,
    p_birth_date: value.birthDate,
    p_cpf: value.cpf ?? undefined,
    p_phone: value.phone ?? undefined,
    p_email: value.email ?? undefined,
    p_unit_id: value.unitId ?? undefined,
    p_guardians: value.guardians.map((guardian) => ({
      full_name: guardian.fullName,
      relationship: guardian.relationship,
      phone: guardian.phone,
      is_whatsapp: guardian.isWhatsapp,
    })),
    p_accessibility: value.accessibility,
    p_accessibility_notes: value.accessibilityNotes ?? undefined,
    p_notes_for_teachers: value.notesForTeachers ?? undefined,
    p_consents: value.consentImage
      ? ["data_processing", "image_use"]
      : ["data_processing"],
    p_class_id: value.classId ?? undefined,
    p_enrollment_id: value.classId ? value.enrollmentId : undefined,
    p_enrolled_on: value.classId ? (value.enrolledOn ?? undefined) : undefined,
  });
  if (error?.code === "23505") {
    return { ok: false, errors: { cpf: [m.studentForm.errors.cpfTaken] } };
  }
  if (error) return enrollmentFailure(error);
  refresh();
  return { ok: true };
}

export async function updateStudent(
  input: StudentUpdateInput,
): Promise<ActionResult> {
  const parsed = studentUpdateInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const value = parsed.data;
  await getViewer();
  const supabase = await createClient();

  const { error } = await supabase
    .from("students")
    .update({
      full_name: value.fullName,
      social_name: value.socialName,
      birth_date: value.birthDate,
      phone: value.phone,
      email: value.email,
    })
    .eq("id", value.id);
  if (error) return failureFor(error);

  for (const guardian of value.guardians) {
    const row = {
      full_name: guardian.fullName,
      relationship: guardian.relationship,
      phone: guardian.phone,
      is_whatsapp: guardian.isWhatsapp,
    };
    const { error: guardianError } = guardian.id
      ? await supabase.from("guardians").update(row).eq("id", guardian.id)
      : await supabase
          .from("guardians")
          .insert({ ...row, student_id: value.id });
    if (guardianError) return failureFor(guardianError);
  }
  if (value.removedGuardianIds.length > 0) {
    const { error: removeError } = await supabase
      .from("guardians")
      .delete()
      .eq("student_id", value.id)
      .in("id", value.removedGuardianIds);
    if (removeError) return enrollmentFailure(removeError);
  }

  const { error: careError } = await supabase
    .from("student_care")
    .update({
      accessibility: value.accessibility,
      accessibility_notes: value.accessibilityNotes,
      notes_for_teachers: value.notesForTeachers,
    })
    .eq("student_id", value.id);
  if (careError) return failureFor(careError);
  refresh();
  return { ok: true };
}

export type StudentMatch = {
  id: string;
  name: string;
  birthYear: number;
  unitCode: string;
  visible: boolean;
};

export async function findStudents(query: string): Promise<StudentMatch[]> {
  const trimmed = query.trim().slice(0, 80);
  if (trimmed.replace(/\s/g, "").length < 3) return [];
  await getViewer();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("find_students", {
    p_query: trimmed,
  });
  if (error) return [];
  return data.map((row) => ({
    id: row.id,
    name: row.display_name,
    birthYear: row.birth_year,
    unitCode: row.unit_code,
    visible: row.visible,
  }));
}

export async function enrollStudent(
  enrollmentId: string,
  studentId: string,
  classId: string,
): Promise<ActionResult> {
  if (
    ![enrollmentId, studentId, classId].every(
      (id) => uuid.safeParse(id).success,
    )
  ) {
    return failure;
  }
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("enroll_student", {
    p_enrollment_id: enrollmentId,
    p_student_id: studentId,
    p_class_id: classId,
  });
  if (error) return enrollmentFailure(error);
  refresh();
  return { ok: true };
}

export async function transferEnrollment(
  input: TransferInput,
): Promise<ActionResult> {
  const parsed = transferInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const value = parsed.data;
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("transfer_enrollment", {
    p_enrollment_id: value.enrollmentId,
    p_new_enrollment_id: value.newEnrollmentId,
    p_to_class_id: value.toClassId,
    p_on: value.on,
    p_reason: value.reason,
  });
  if (error) return enrollmentFailure(error);
  refresh();
  return { ok: true };
}

export async function endEnrollment(input: EndInput): Promise<ActionResult> {
  const parsed = endInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const value = parsed.data;
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("end_enrollment", {
    p_enrollment_id: value.enrollmentId,
    p_status: value.status,
    p_reason: value.reason,
    p_note: value.note ?? undefined,
    p_on: value.on,
  });
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function reopenEnrollment(id: string): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return failure;
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("reopen_enrollment", {
    p_enrollment_id: id,
  });
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}
