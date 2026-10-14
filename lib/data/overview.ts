import "server-only";

import { getAttendanceDays } from "@/lib/data/attendance";
import { getClasses } from "@/lib/data/classes";
import { addDays } from "@/lib/dates";
import { attendanceOverview } from "@/lib/schedule";

export async function getClassDays(today: string, viewerId: string | null) {
  const [classes, taken] = await Promise.all([
    getClasses(),
    getAttendanceDays(addDays(today, -15)),
  ]);
  return classes
    .filter(
      (row) =>
        row.operable &&
        row.status === "open" &&
        row.starts_on <= today &&
        (viewerId === null || row.teacher_ids.includes(viewerId)),
    )
    .map((row) => {
      const overview = attendanceOverview(
        row,
        taken.get(row.id) ?? new Set(),
        today,
      );
      return {
        classId: row.id,
        name: row.name,
        unitCode: row.unit_code,
        classToday: overview.classToday,
        takenToday: overview.takenToday,
        pending: overview.pending.length,
        endsOn: row.ends_on,
      };
    });
}
