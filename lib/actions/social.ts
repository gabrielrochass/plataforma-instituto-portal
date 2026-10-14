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
import { isValidCpf, normalizeCpf } from "@/lib/people";
import { isoDate, note } from "@/lib/schemas/classes";
import { Constants } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

const enums = Constants.public.Enums;
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .regex(/^[^\p{Cc}]*$/u)
    .transform((value) => value || null);

const profileInput = z.object({
  studentId: z.uuid(),
  assessedOn: isoDate,
  moment: z.enum(enums.assessment_moment),
  neighborhood: optionalText(80),
  city: optionalText(80),
  householdSize: z.number().int().min(1).max(30).nullable(),
  householdIncomeCents: z.number().int().min(0).max(99_999_999_999).nullable(),
  housing: z.enum(enums.housing_kind).nullable(),
  benefits: z
    .array(
      z.enum([
        "bolsa_familia",
        "bpc",
        "cadunico",
        "auxilio_gas",
        "tarifa_social",
        "pe_de_meia",
        "other",
      ]),
    )
    .max(7),
  hasInternet: z.boolean().nullable(),
  hasComputer: z.boolean().nullable(),
  schooling: z.enum(enums.schooling_level).nullable(),
  studyingNow: z.boolean().nullable(),
  work: z.enum(enums.work_status).nullable(),
  gender: z.enum(enums.gender_identity).nullable(),
  raceColor: z.enum(enums.race_color).nullable(),
  disability: z
    .array(
      z.enum([
        "visual",
        "hearing",
        "physical",
        "intellectual",
        "autism",
        "psychosocial",
        "multiple",
        "other",
      ]),
    )
    .max(8),
  healthNotes: note(1000),
  notes: note(4000),
});

export type ProfileInput = z.input<typeof profileInput>;

export async function saveSocialProfile(
  input: ProfileInput,
): Promise<ActionResult> {
  const parsed = profileInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const value = parsed.data;
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_social_profile", {
    p_student_id: value.studentId,
    p_profile: {
      assessed_on: value.assessedOn,
      moment: value.moment,
      neighborhood: value.neighborhood,
      city: value.city,
      household_size: value.householdSize,
      household_income_cents: value.householdIncomeCents,
      housing: value.housing,
      benefits: value.benefits,
      has_internet: value.hasInternet,
      has_computer: value.hasComputer,
      schooling: value.schooling,
      studying_now: value.studyingNow,
      work: value.work,
      gender: value.gender,
      race_color: value.raceColor,
      disability: value.disability.length > 0 ? value.disability : null,
      health_notes: value.healthNotes,
      notes: value.notes,
    },
  });
  if (error?.code === "23514")
    return { ok: false, message: m.social.sensitiveError };
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

const outcomeInput = z.object({
  studentId: z.uuid(),
  kind: z.enum(enums.outcome_kind),
  observedOn: isoDate,
  formalJob: z.boolean().nullable(),
  relatedToCourse: z.boolean().nullable(),
  organization: optionalText(120),
});

export async function addOutcome(
  input: z.input<typeof outcomeInput>,
): Promise<ActionResult> {
  const parsed = outcomeInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const value = parsed.data;
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_alumni_outcome", {
    p_student_id: value.studentId,
    p_kind: value.kind,
    p_observed_on: value.observedOn,
    p_formal_job: value.formalJob ?? undefined,
    p_related_to_course: value.relatedToCourse ?? undefined,
    p_organization: value.organization ?? undefined,
  });
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function removeOutcome(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return failure;
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_alumni_outcome", { p_id: id });
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

const consentKind = z.enum(enums.consent_kind);

export async function recordConsent(
  studentId: string,
  kind: z.input<typeof consentKind>,
  signedOn: string,
): Promise<ActionResult> {
  if (
    !z.uuid().safeParse(studentId).success ||
    !consentKind.safeParse(kind).success ||
    !isoDate.safeParse(signedOn).success
  ) {
    return failure;
  }
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase
    .from("consents")
    .insert({ student_id: studentId, kind, signed_on: signedOn });
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function revokeConsent(
  consentId: string,
  revokedOn: string,
): Promise<ActionResult> {
  if (
    !z.uuid().safeParse(consentId).success ||
    !isoDate.safeParse(revokedOn).success
  ) {
    return failure;
  }
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase
    .from("consents")
    .update({ revoked_on: revokedOn })
    .eq("id", consentId);
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function saveCpf(
  studentId: string,
  cpf: string,
): Promise<ActionResult> {
  if (!z.uuid().safeParse(studentId).success) return failure;
  if (cpf.trim() !== "" && !isValidCpf(cpf)) {
    return { ok: false, errors: { cpf: [m.studentForm.errors.cpf] } };
  }
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({ cpf: cpf.trim() ? normalizeCpf(cpf) : null })
    .eq("id", studentId);
  if (error?.code === "23505") {
    return { ok: false, errors: { cpf: [m.studentForm.errors.cpfTaken] } };
  }
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function exportStudent(
  studentId: string,
): Promise<{ ok: true; json: string } | Failure> {
  if (!z.uuid().safeParse(studentId).success) return failure;
  await getViewer();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("export_student_data", {
    p_student_id: studentId,
  });
  if (error) return failureFor(error);
  refresh();
  return { ok: true, json: JSON.stringify(data, null, 2) };
}

export async function anonymizeStudent(
  studentId: string,
): Promise<ActionResult> {
  if (!z.uuid().safeParse(studentId).success) return failure;
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("anonymize_student", {
    p_student_id: studentId,
  });
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}
