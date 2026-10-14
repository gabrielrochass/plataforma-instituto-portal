import type { Metadata } from "next";
import { StudentForm } from "@/components/students/student-form";
import { getClasses } from "@/lib/data/classes";
import { getUnits } from "@/lib/data/team";
import { getViewer } from "@/lib/data/viewer";
import { todayInRecife } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { adminUnits, can } from "@/lib/roles";

export const metadata: Metadata = { title: m.students.new };

export default async function NewStudentPage({
  searchParams,
}: PageProps<"/alunos/novo">) {
  const [viewer, classes, units, params] = await Promise.all([
    getViewer(),
    getClasses(),
    getUnits(),
    searchParams,
  ]);
  const today = todayInRecife();
  const open = classes.filter(
    (row) => row.operable && row.status === "open" && row.ends_on >= today,
  );
  const preset =
    typeof params.turma === "string" &&
    open.some((row) => row.id === params.turma)
      ? params.turma
      : null;

  return (
    <StudentForm
      classes={open.map((row) => ({
        id: row.id,
        label: `${row.name} (${row.unit_code})`,
        startsOn: row.starts_on,
      }))}
      units={adminUnits(viewer, units)}
      presetClassId={preset}
      canSkipClass={can.manageTeam(viewer)}
    />
  );
}
