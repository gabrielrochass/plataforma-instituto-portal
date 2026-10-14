"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import {
  type ActionResult,
  failure,
  failureFor,
  fieldErrors,
} from "@/lib/action-result";
import { getViewer } from "@/lib/data/viewer";
import { m } from "@/lib/i18n";
import { isoDate, note, text } from "@/lib/schemas/classes";
import { createClient } from "@/lib/supabase/server";

const errors = m.announcements.errors;

const announcementInput = z
  .object({
    title: text(120, errors.title),
    body: note(4000).pipe(z.string().min(1, errors.body)),
    audience: z.enum(["everyone", "unit", "class"]),
    unitId: z.union([z.literal(""), z.uuid()]),
    classId: z.union([z.literal(""), z.uuid()]),
    expiresOn: z.union([z.literal(""), isoDate]),
  })
  .superRefine((value, context) => {
    if (value.audience === "unit" && !value.unitId) {
      context.addIssue({
        code: "custom",
        path: ["unitId"],
        message: errors.target,
      });
    }
    if (value.audience === "class" && !value.classId) {
      context.addIssue({
        code: "custom",
        path: ["classId"],
        message: errors.target,
      });
    }
  });

export type AnnouncementInput = z.input<typeof announcementInput>;

export async function postAnnouncement(
  input: AnnouncementInput,
): Promise<ActionResult> {
  const parsed = announcementInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const value = parsed.data;
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("post_announcement", {
    p_title: value.title,
    p_body: value.body,
    p_audience: value.audience,
    p_unit_id: value.audience === "unit" ? value.unitId : undefined,
    p_class_id: value.audience === "class" ? value.classId : undefined,
    p_expires_on: value.expiresOn || undefined,
  });
  if (error?.code === "23514") {
    return { ok: false, errors: { expiresOn: [errors.expired] } };
  }
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function markAnnouncementRead(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return failure;
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_announcement_read", { p_id: id });
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}

export async function archiveAnnouncement(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return failure;
  await getViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("archive_announcement", { p_id: id });
  if (error) return failureFor(error);
  refresh();
  return { ok: true };
}
