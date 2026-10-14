import { z } from "zod";
import { ptBR } from "zod/locales";
import { todayInRecife } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { isMinor, isValidPhone, normalizePhone } from "@/lib/people";
import { text } from "./classes";

z.config({ ...ptBR(), jitless: true });

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .regex(/^[^\p{Cc}]*$/u)
    .transform((value) => value || null);

export const requestInput = z
  .object({
    offerId: z.uuid(),
    fullName: text(120, m.requests.errors.fullName),
    socialName: optional(120),
    birthDate: z
      .string()
      .regex(
        /^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
        m.requests.errors.birthDate,
      )
      .refine((value) => value <= todayInRecife(), m.requests.errors.birthDate),
    phone: z
      .string()
      .trim()
      .refine(isValidPhone, m.requests.errors.phone)
      .transform(normalizePhone),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .refine(
        (value) => value === "" || z.email().safeParse(value).success,
        m.studentForm.errors.email,
      )
      .transform((value) => value || null),
    neighborhood: optional(80),
    guardianName: optional(120),
    guardianPhone: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || isValidPhone(value),
        m.requests.errors.phone,
      )
      .transform((value) => (value ? normalizePhone(value) : null)),
    consent: z.literal(true, m.requests.errors.consent),
  })
  .superRefine((value, context) => {
    if (
      isMinor(value.birthDate, todayInRecife()) &&
      (!value.guardianName || !value.guardianPhone)
    ) {
      context.addIssue({
        code: "custom",
        message: m.requests.errors.guardian,
        path: ["guardianName"],
      });
    }
  });

export type RequestInput = z.input<typeof requestInput>;
