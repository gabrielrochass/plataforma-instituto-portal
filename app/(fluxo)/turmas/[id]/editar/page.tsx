import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ClassForm } from "@/components/classes/class-form";
import { getClass, getUnitStaff } from "@/lib/data/classes";
import { getViewer } from "@/lib/data/viewer";
import { m } from "@/lib/i18n";
import type { Weekday } from "@/lib/schedule";

export const metadata: Metadata = { title: m.classForm.editTitle };

export default async function EditClassPage({
  params,
}: PageProps<"/turmas/[id]/editar">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [row, viewer] = await Promise.all([getClass(id), getViewer()]);
  if (!row || !row.operable || row.status !== "open") notFound();
  const staff = await getUnitStaff(row.unit_id);

  return (
    <ClassForm
      classId={row.id}
      initial={{
        unitId: row.unit_id,
        name: row.name,
        startsOn: row.starts_on,
        endsOn: row.ends_on,
        weekdays: row.weekdays as Weekday[],
        workloadHours: String(row.workload_hours),
        capacity: row.capacity === null ? "" : String(row.capacity),
        teacherIds: row.teacher_ids,
        rules: row.rules,
      }}
      units={[{ id: row.unit_id, code: row.unit_code, name: row.unit_name }]}
      staffByUnit={{
        [row.unit_id]: staff.map((person) => ({
          id: person.id,
          name: person.name,
        })),
      }}
      viewerId={viewer.id}
      teacherUnitIds={[]}
    />
  );
}
