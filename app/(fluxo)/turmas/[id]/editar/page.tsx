import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ClassEditForm } from "@/components/classes/class-edit-form";
import {
  getClass,
  getClassSessions,
  getClosures,
  getUnitStaff,
} from "@/lib/data/classes";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.classes.edit };

export default async function EditClassPage({
  params,
}: PageProps<"/turmas/[id]/editar">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const row = await getClass(id);
  if (!row || !row.operable || row.status !== "open") notFound();
  const [sessions, staff, closures] = await Promise.all([
    getClassSessions(id),
    getUnitStaff(row.unit_id),
    getClosures(),
  ]);

  return (
    <ClassEditForm
      classId={row.id}
      initial={{
        name: row.name,
        capacity: row.capacity,
        startsOn: row.starts_on,
        endsOn: row.ends_on,
        slots: row.slots,
        rules: row.rules,
        teacherIds: row.teacher_ids,
      }}
      sessions={sessions
        .filter((session) => !session.is_extra)
        .map((session) => ({
          id: session.id,
          heldOn: session.held_on,
          startsAt: session.starts_at,
          endsAt: session.ends_at,
          locked:
            session.cancelled_at !== null ||
            session.attendance_taken_at !== null,
        }))}
      staff={staff.map((person) => ({ id: person.id, name: person.name }))}
      closures={closures
        .filter(
          (closure) =>
            closure.unit_id === null || closure.unit_id === row.unit_id,
        )
        .map((closure) => ({
          startsOn: closure.starts_on,
          endsOn: closure.ends_on,
          reason: closure.reason,
        }))}
    />
  );
}
