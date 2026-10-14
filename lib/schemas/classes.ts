import { z } from "zod";
import { ptBR } from "zod/locales";
import { gradingRules } from "@/lib/grading";
import { m } from "@/lib/i18n";
import { isValidSlot, maxSessions } from "@/lib/schedule";

z.config({ ...ptBR(), jitless: true });

export const isoDate = z
  .string()
  .regex(/^(20\d{2}|2100)-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

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

const slot = z
  .object({
    weekday: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
      z.literal(6),
      z.literal(7),
    ]),
    startsAt: time,
    endsAt: time,
  })
  .refine(isValidSlot, { message: m.wizard.errors.time });

const session = z.object({ heldOn: isoDate, startsAt: time, endsAt: time });

const capacity = z
  .number(m.wizard.errors.capacity)
  .int(m.wizard.errors.capacity)
  .min(1, m.wizard.errors.capacity)
  .max(500, m.wizard.errors.capacity)
  .nullable();

export const courseInput = z.object({
  id: z.uuid(),
  name: text(80, m.settings.nameRequired),
  description: note(2000),
  workloadHours: z
    .number(m.courses.workloadInvalid)
    .int(m.courses.workloadInvalid)
    .min(1, m.courses.workloadInvalid)
    .max(2000, m.courses.workloadInvalid),
  rules: gradingRules,
});

export type CourseInput = z.input<typeof courseInput>;

export const closureInput = z
  .object({
    id: z.uuid(),
    unitId: z.uuid().nullable(),
    startsOn: isoDate,
    endsOn: isoDate,
    reason: text(80, m.calendar.errors.reason),
  })
  .refine((value) => value.endsOn >= value.startsOn, {
    message: m.calendar.errors.dates,
    path: ["endsOn"],
  });

export type ClosureInput = z.input<typeof closureInput>;

export const classInput = z
  .object({
    id: z.uuid(),
    courseId: z.uuid(m.wizard.errors.course),
    unitId: z.uuid(m.wizard.errors.unit),
    name: text(80, m.wizard.errors.name),
    startsOn: isoDate,
    endsOn: isoDate,
    slots: z.array(slot).min(1, m.wizard.errors.days).max(14),
    capacity,
    teacherIds: z.array(z.uuid()).max(20),
    rules: gradingRules,
    sessions: z.array(session).max(maxSessions, m.wizard.tooManySessions),
  })
  .refine((value) => value.endsOn >= value.startsOn, {
    message: m.wizard.errors.dates,
    path: ["endsOn"],
  });

export type ClassInput = z.input<typeof classInput>;

export const classUpdateInput = z
  .object({
    id: z.uuid(),
    name: text(80, m.wizard.errors.name),
    startsOn: isoDate,
    endsOn: isoDate,
    slots: z.array(slot).min(1, m.wizard.errors.days).max(14),
    capacity,
    teacherIds: z.array(z.uuid()).max(20),
    rules: gradingRules,
    removeSessionIds: z.array(z.uuid()).max(maxSessions),
    addSessions: z.array(session).max(maxSessions, m.wizard.tooManySessions),
  })
  .refine((value) => value.endsOn >= value.startsOn, {
    message: m.wizard.errors.dates,
    path: ["endsOn"],
  });

export type ClassUpdateInput = z.input<typeof classUpdateInput>;
