import { z } from "zod";
import { ptBR } from "zod/locales";
import { m } from "@/lib/i18n";
import { Constants } from "@/lib/supabase/database.types";
import { isoDate, note } from "./classes";

z.config({ ...ptBR(), jitless: true });

export const attendanceInput = z.object({
  classId: z.uuid(),
  day: isoDate,
  presentIds: z.array(z.uuid()).max(500),
  note: note(1000),
});

export type AttendanceInput = z.input<typeof attendanceInput>;

export const caseNoteInput = z.object({
  id: z.uuid(),
  studentId: z.uuid(),
  kind: z.enum(Constants.public.Enums.case_note_kind),
  happenedOn: isoDate,
  body: note(4000).refine((value) => value !== null, m.notes.bodyRequired),
});

export type CaseNoteInput = z.input<typeof caseNoteInput>;
