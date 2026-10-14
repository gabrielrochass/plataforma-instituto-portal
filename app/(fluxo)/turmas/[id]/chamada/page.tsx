import { CalendarClockIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { EmptyState } from "@/components/app-shell/empty-state";
import { AttendanceForm } from "@/components/attendance/attendance-form";
import { buttonVariants } from "@/components/ui/button";
import { getAttendanceRoster } from "@/lib/data/attendance";
import { getClass, getClassSessions } from "@/lib/data/classes";
import { photoUrls } from "@/lib/data/photos";
import { formatFullDate, todayInRecife } from "@/lib/dates";
import { holidaysBetween } from "@/lib/holidays";
import { m } from "@/lib/i18n";
import { displayName } from "@/lib/people";
import { suggestedDay, weekdayOf } from "@/lib/schedule";
import { isoDate } from "@/lib/schemas/classes";

export const metadata: Metadata = { title: m.attendance.title };

export default async function AttendancePage({
  params,
  searchParams,
}: PageProps<"/turmas/[id]/chamada">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const row = await getClass(id);
  if (!row || !row.operable || row.status !== "open") notFound();
  const today = todayInRecife();

  if (row.starts_on > today) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
        <EmptyState
          icon={CalendarClockIcon}
          title={m.classes.status.upcoming(formatFullDate(row.starts_on))}
          description={m.attendance.dayOutside}
          action={
            <Link
              href={`/turmas/${id}` as Route}
              className={buttonVariants({ size: "lg", variant: "secondary" })}
            >
              {m.common.back}
            </Link>
          }
        />
      </div>
    );
  }

  const maxDay = today < row.ends_on ? today : row.ends_on;
  const asked = (await searchParams).data;
  const day =
    typeof asked === "string" &&
    isoDate.safeParse(asked).success &&
    asked >= row.starts_on &&
    asked <= maxDay
      ? asked
      : suggestedDay(row, today);
  const [roster, sessions] = await Promise.all([
    getAttendanceRoster(id, day),
    getClassSessions(id),
  ]);
  const photos = await photoUrls(roster.map((entry) => entry.photo_path));
  const session = sessions.find((item) => item.held_on === day);
  const holiday = holidaysBetween(day, day).get(day);
  const dayInfo = holiday
    ? m.attendance.holiday(holiday)
    : row.weekdays.includes(weekdayOf(day))
      ? null
      : m.attendance.notClassDay;

  return (
    <AttendanceForm
      key={day}
      classId={id}
      className={row.name}
      day={day}
      minDay={row.starts_on}
      maxDay={maxDay}
      dayInfo={dayInfo}
      sessionId={session?.session_id ?? null}
      initialNote={session?.note ?? ""}
      rows={roster.map((entry) => ({
        enrollmentId: entry.enrollment_id,
        name: displayName(entry),
        photo: entry.photo_path ? (photos.get(entry.photo_path) ?? null) : null,
        token: entry.badge_token,
        accessibility: entry.needs_accessibility,
        present: entry.status === "present",
        streak: entry.streak,
      }))}
    />
  );
}
