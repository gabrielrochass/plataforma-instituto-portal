import { z } from "zod";
import { ptBR } from "zod/locales";
import { gradingRules } from "@/lib/grading";
import { m } from "@/lib/i18n";

z.config({ ...ptBR(), jitless: true });

export const isoDate = z
  .string()
  .regex(/^(20\d{2}|2100)-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);

export const text = (max: number, message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .max(max)
    .regex(/^[^\p{Cc}]*$/u);

export const note = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((value) =>
      [...value].every((character) => {
        const code = character.charCodeAt(0);
        return (
          code === 9 ||
          code === 10 ||
          code === 13 ||
          (code >= 32 && code !== 127)
        );
      }),
    )
    .transform((value) => value || null);

const weekday = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
]);

const capacity = z
  .number(m.classForm.errors.capacity)
  .int(m.classForm.errors.capacity)
  .min(1, m.classForm.errors.capacity)
  .max(500, m.classForm.errors.capacity)
  .nullable();

const classFields = {
  name: text(80, m.classForm.errors.name),
  startsOn: isoDate,
  endsOn: isoDate,
  weekdays: z.array(weekday).min(1, m.classForm.errors.days).max(7),
  workloadHours: z
    .number(m.classForm.errors.workload)
    .int(m.classForm.errors.workload)
    .min(1, m.classForm.errors.workload)
    .max(2000, m.classForm.errors.workload),
  capacity,
  teacherIds: z.array(z.uuid()).max(20),
  rules: gradingRules,
};

const datesInOrder = {
  message: m.classForm.errors.dates,
  path: ["endsOn"],
};

export const classInput = z
  .object({
    id: z.uuid(),
    unitId: z.uuid(m.classForm.errors.unit),
    ...classFields,
  })
  .refine((value) => value.endsOn >= value.startsOn, datesInOrder);

export type ClassInput = z.input<typeof classInput>;

export const classUpdateInput = z
  .object({ id: z.uuid(), ...classFields })
  .refine((value) => value.endsOn >= value.startsOn, datesInOrder);

export type ClassUpdateInput = z.input<typeof classUpdateInput>;
