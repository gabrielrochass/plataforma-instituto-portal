export type AttendanceStatus = "present" | "absent" | "excused" | "late";

export const alertStreak = 3;

export function attendanceRate(counts: { attended: number; missed: number }) {
  const total = counts.attended + counts.missed;
  return total === 0 ? null : Math.round((counts.attended / total) * 100);
}

export function streakAfter(previous: number, status: AttendanceStatus | null) {
  if (status === "absent") return previous + 1;
  if (status === "present" || status === "late") return 0;
  return previous;
}

export function countMarks(statuses: readonly (AttendanceStatus | null)[]) {
  return {
    present: statuses.filter(
      (status) => status === "present" || status === "late",
    ).length,
    absent: statuses.filter(
      (status) => status === "absent" || status === "excused",
    ).length,
    unmarked: statuses.filter((status) => status === null).length,
  };
}

export function isCurrentSession(
  session: { startsAt: string; endsAt: string },
  minutesNow: number,
) {
  const [startHours, startMinutes] = session.startsAt.split(":").map(Number);
  const [endHours, endMinutes] = session.endsAt.split(":").map(Number);
  return (
    minutesNow >= startHours * 60 + startMinutes - 30 &&
    minutesNow <= endHours * 60 + endMinutes + 180
  );
}
