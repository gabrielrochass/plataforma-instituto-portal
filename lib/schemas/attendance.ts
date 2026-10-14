import { z } from "zod";
import { ptBR } from "zod/locales";
import { m } from "@/lib/i18n";
import { Constants } from "@/lib/supabase/database.types";
import { isoDate, note, text } from "./classes";

z.config({ ...ptBR(), jitless: true });

export const attendanceInput = z.object({
  sessionId: z.uuid(),
  topic: note(500),
  marks: z
    .array(
      z.object({
        enrollmentId: z.uuid(),
        status: z.enum(Constants.public.Enums.attendance_status),
        note: z
          .string()
          .trim()
          .max(200)
          .regex(/^[^\p{Cc}]*$/u)
          .transform((value) => value || null),
      }),
    )
    .max(300),
});

export type AttendanceInput = z.input<typeof attendanceInput>;

export const cancelSessionInput = z.object({
  sessionId: z.uuid(),
  reason: text(120, m.attendance.reasonRequired),
});

export const caseNoteInput = z.object({
  id: z.uuid(),
  studentId: z.uuid(),
  kind: z.enum(Constants.public.Enums.case_note_kind),
  happenedOn: isoDate,
  body: note(4000).refine((value) => value !== null, m.notes.bodyRequired),
});

export type CaseNoteInput = z.input<typeof caseNoteInput>;
