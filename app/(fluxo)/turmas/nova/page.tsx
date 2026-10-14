import type { Metadata } from "next";
import { ClassForm } from "@/components/classes/class-form";
import { getUnitStaff } from "@/lib/data/classes";
import { getUnits } from "@/lib/data/team";
import { getViewer } from "@/lib/data/viewer";
import { m } from "@/lib/i18n";
import { isAdminOf } from "@/lib/roles";

export const metadata: Metadata = { title: m.classForm.newTitle };

export default async function NewClassPage() {
  const viewer = await getViewer();
  const allUnits = await getUnits();
  const units = viewer.isAdminGeral
    ? allUnits
    : allUnits.filter((unit) =>
        viewer.memberships.some((row) => row.unit.id === unit.id),
      );
  const staff = await Promise.all(units.map((unit) => getUnitStaff(unit.id)));

  return (
    <ClassForm
      units={units}
      staffByUnit={Object.fromEntries(
        units.map((unit, index) => [
          unit.id,
          staff[index].map((person) => ({ id: person.id, name: person.name })),
        ]),
      )}
      viewerId={viewer.id}
      teacherUnitIds={units
        .filter((unit) => !isAdminOf(viewer, unit.id))
        .map((unit) => unit.id)}
    />
  );
}
