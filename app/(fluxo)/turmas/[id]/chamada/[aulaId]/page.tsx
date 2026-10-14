import { CalendarClockIcon, CalendarXIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { EmptyState } from "@/components/app-shell/empty-state";
import { AttendanceForm } from "@/components/attendance/attendance-form";
import { buttonVariants } from "@/components/ui/button";
import { getSession, getSessionRoster } from "@/lib/data/attendance";
import { getClass } from "@/lib/data/classes";
import { formatDayHeading, formatFullDate, todayInRecife } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { displayName } from "@/lib/people";
import { formatTime } from "@/lib/schedule";

export const metadata: Metadata = { title: m.attendance.title };

export default async function ChamadaPage({
  params,
}: PageProps<"/turmas/[id]/chamada/[aulaId]">) {
  const { id, aulaId } = await params;
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(aulaId).success) {
    notFound();
  }
  const [row, session] = await Promise.all([getClass(id), getSession(aulaId)]);
  if (!row || !session || session.class_id !== id || !row.operable) notFound();
  const today = todayInRecife();
  const day = formatDayHeading(session.held_on, today);
  const subtitle = `${day.charAt(0).toUpperCase()}${day.slice(1)}, ${m.classes.timeRange(
    formatTime(session.starts_at),
    formatTime(session.ends_at),
  )}`;
  const back = (
    <Link
      href={`/turmas/${id}/aulas` as Route}
      className={buttonVariants({ variant: "secondary", size: "lg" })}
    >
      {m.classes.sessions}
    </Link>
  );

  if (
    session.cancelled_at ||
    session.held_on > today ||
    row.status !== "open"
  ) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-2 px-4">
        <EmptyState
          icon={session.cancelled_at ? CalendarXIcon : CalendarClockIcon}
          title={`${row.name}. ${subtitle}`}
          description={
            session.cancelled_at
              ? m.classes.cancelledSession(session.cancel_reason ?? "")
              : row.status !== "open"
                ? m.classes.closed
                : m.attendance.future
          }
          action={back}
        />
      </div>
    );
  }

  const roster = await getSessionRoster(aulaId);
  if (roster.length === 0) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-2 px-4">
        <EmptyState
          icon={CalendarClockIcon}
          title={`${row.name}. ${subtitle}`}
          description={m.attendance.noStudents}
          action={back}
        />
      </div>
    );
  }

  return (
    <AttendanceForm
      sessionId={session.id}
      classId={id}
      title={row.name}
      subtitle={subtitle}
      initialTopic={session.topic ?? ""}
      takenLabel={
        session.attendance_taken_at
          ? m.attendance.takenBy(
              formatFullDate(
                todayInRecife(new Date(session.attendance_taken_at)),
              ),
            )
          : null
      }
      rows={roster.map((entry) => ({
        enrollmentId: entry.enrollment_id,
        studentId: entry.student_id,
        name: displayName(entry),
        accessibility: entry.needs_accessibility,
        status: entry.status,
        note: entry.note ?? "",
        streak: entry.streak,
        contactName: entry.contact_name,
        contactPhone: entry.contact_phone,
        contactWhatsapp: entry.contact_whatsapp,
      }))}
    />
  );
}
