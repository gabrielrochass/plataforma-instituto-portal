import { z } from "zod";
import { ptBR } from "zod/locales";
import { todayInRecife } from "@/lib/dates";
import { m } from "@/lib/i18n";
import {
  isMinor,
  isValidCpf,
  isValidPhone,
  normalizeCpf,
  normalizePhone,
} from "@/lib/people";
import { Constants } from "@/lib/supabase/database.types";
import { isoDate, note, text } from "./classes";

z.config({ ...ptBR(), jitless: true });

const phone = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || isValidPhone(value),
    m.studentForm.errors.phone,
  )
  .transform((value) => (value ? normalizePhone(value) : null));

const birthDate = z
  .string()
  .regex(
    /^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
    m.studentForm.errors.birthDate,
  )
  .refine((value) => value <= todayInRecife(), m.studentForm.errors.birthDate);

export const accessibilityKinds = [
  "visual",
  "hearing",
  "physical",
  "intellectual",
  "autism",
  "adhd",
  "other",
] as const;

export const guardianInput = z.object({
  id: z.uuid().nullable(),
  fullName: text(120, m.studentForm.errors.guardianName),
  relationship: z.enum(Constants.public.Enums.guardian_relationship),
  phone: z
    .string()
    .trim()
    .refine(isValidPhone, m.studentForm.errors.phone)
    .transform(normalizePhone),
  isWhatsapp: z.boolean(),
});

export type GuardianInput = z.input<typeof guardianInput>;

const basics = {
  fullName: text(120, m.studentForm.errors.fullName),
  socialName: z
    .string()
    .trim()
    .max(120)
    .regex(/^[^\p{Cc}]*$/u)
    .transform((value) => value || null),
  birthDate,
  phone,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      m.studentForm.errors.email,
    )
    .transform((value) => value || null),
  guardians: z.array(guardianInput).max(4),
  accessibility: z.array(z.enum(accessibilityKinds)).max(7),
  accessibilityNotes: note(500),
  notesForTeachers: note(1000),
};

function checkContacts(
  value: {
    birthDate: string;
    phone: string | null;
    guardians: unknown[];
  },
  context: z.RefinementCtx,
) {
  if (isMinor(value.birthDate, todayInRecife())) {
    if (value.guardians.length === 0) {
      context.addIssue({
        code: "custom",
        message: m.studentForm.errors.guardian,
        path: ["guardians"],
      });
    }
  } else if (!value.phone && value.guardians.length === 0) {
    context.addIssue({
      code: "custom",
      message: m.studentForm.errors.contact,
      path: ["phone"],
    });
  }
}

export const studentInput = z
  .object({
    id: z.uuid(),
    ...basics,
    cpf: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || isValidCpf(value),
        m.studentForm.errors.cpf,
      )
      .transform((value) => (value ? normalizeCpf(value) : null)),
    unitId: z.uuid(m.studentForm.errors.unit).nullable(),
    classId: z.uuid().nullable(),
    enrollmentId: z.uuid(),
    enrolledOn: isoDate
      .refine(
        (value) => value <= todayInRecife(),
        m.studentForm.errors.enrolledOn,
      )
      .nullable(),
    consentData: z.literal(true, m.studentForm.errors.consent),
    consentImage: z.boolean(),
  })
  .superRefine(checkContacts)
  .refine((value) => value.classId !== null || value.unitId !== null, {
    message: m.studentForm.errors.unit,
    path: ["unitId"],
  });

export type StudentInput = z.input<typeof studentInput>;

export const studentUpdateInput = z
  .object({
    id: z.uuid(),
    ...basics,
    removedGuardianIds: z.array(z.uuid()).max(10),
  })
  .superRefine(checkContacts);

export type StudentUpdateInput = z.input<typeof studentUpdateInput>;

export const transferInput = z.object({
  enrollmentId: z.uuid(),
  newEnrollmentId: z.uuid(),
  toClassId: z.uuid(m.wizard.errors.course),
  on: isoDate,
  reason: z.enum(Constants.public.Enums.exit_reason),
});

export type TransferInput = z.input<typeof transferInput>;

export const endInput = z.object({
  enrollmentId: z.uuid(),
  status: z.enum(["dropped_out", "cancelled"]),
  reason: z.enum(Constants.public.Enums.exit_reason),
  note: note(500),
  on: isoDate,
});

export type EndInput = z.input<typeof endInput>;
