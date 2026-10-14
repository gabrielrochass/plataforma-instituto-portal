import { BookOpenIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/app-shell/empty-state";
import { ClassWizard } from "@/components/classes/class-wizard";
import { buttonVariants } from "@/components/ui/button";
import { getClosures, getCourses, getUnitStaff } from "@/lib/data/classes";
import { getUnits } from "@/lib/data/team";
import { getViewer } from "@/lib/data/viewer";
import { m } from "@/lib/i18n";
import { can, isAdminOf } from "@/lib/roles";

export const metadata: Metadata = { title: m.classes.new };

export default async function NewClassPage() {
  const viewer = await getViewer();
  const [courses, allUnits, closures] = await Promise.all([
    getCourses(),
    getUnits(),
    getClosures(),
  ]);
  const units = viewer.isAdminGeral
    ? allUnits
    : allUnits.filter((unit) =>
        viewer.memberships.some((row) => row.unit.id === unit.id),
      );
  const openCourses = courses.filter((course) => !course.archived_at);

  if (openCourses.length === 0) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
        <EmptyState
          icon={BookOpenIcon}
          title={m.courses.empty}
          description={
            can.manageTeam(viewer) ? m.courses.emptyHint : m.courses.askAdmin
          }
          action={
            can.manageTeam(viewer) ? (
              <Link
                href="/ajustes/cursos/novo"
                className={buttonVariants({ size: "lg" })}
              >
                {m.courses.new}
              </Link>
            ) : (
              <Link
                href="/turmas"
                className={buttonVariants({ size: "lg", variant: "secondary" })}
              >
                {m.common.back}
              </Link>
            )
          }
        />
      </div>
    );
  }

  const staff = await Promise.all(units.map((unit) => getUnitStaff(unit.id)));

  return (
    <ClassWizard
      courses={openCourses.map((course) => ({
        id: course.id,
        name: course.name,
        workloadHours: course.workload_hours,
        rules: course.rules,
      }))}
      units={units}
      staffByUnit={Object.fromEntries(
        units.map((unit, index) => [
          unit.id,
          staff[index].map((person) => ({ id: person.id, name: person.name })),
        ]),
      )}
      closures={closures.map((closure) => ({
        unitId: closure.unit_id,
        startsOn: closure.starts_on,
        endsOn: closure.ends_on,
        reason: closure.reason,
      }))}
      viewerId={viewer.id}
      teacherUnitIds={units
        .filter((unit) => !isAdminOf(viewer, unit.id))
        .map((unit) => unit.id)}
    />
  );
}
