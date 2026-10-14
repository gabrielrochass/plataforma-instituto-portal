export type AttendanceStatus = "present" | "absent";

export const alertStreak = 3;

export function attendanceRate(counts: { attended: number; missed: number }) {
  const total = counts.attended + counts.missed;
  return total === 0 ? null : Math.round((counts.attended / total) * 100);
}
