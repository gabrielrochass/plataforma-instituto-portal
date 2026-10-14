import { CalendarXIcon, CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { RestoreSessionButton } from "@/components/attendance/restore-session-button";
import { ClassHeader } from "@/components/classes/class-header";
import { MonthStepper } from "@/components/forms/month-stepper";
import { buttonVariants } from "@/components/ui/button";
import { getClass, getClassSessions } from "@/lib/data/classes";
import { formatDayHeading, parseMonth, todayInRecife } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { formatTime } from "@/lib/schedule";

export const metadata: Metadata = { title: m.classes.sessions };

export default async function ClassSessionsPage({
  params,
  searchParams,
}: PageProps<"/turmas/[id]/aulas">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [row, sessions, query] = await Promise.all([
    getClass(id),
    getClassSessions(id),
    searchParams,
  ]);
  if (!row) notFound();
  const today = todayInRecife();
  const fallback =
    today < row.starts_on
      ? row.starts_on.slice(0, 7)
      : today > row.ends_on
        ? row.ends_on.slice(0, 7)
        : today.slice(0, 7);
  const month = parseMonth(query.mes) ?? fallback;
  const inMonth = sessions.filter((session) =>
    session.held_on.startsWith(month),
  );
  const editable = row.operable && row.status === "open";

  return (
    <>
      <ClassHeader row={row} />
      <div className="flex flex-col gap-4">
        <MonthStepper
          month={month}
          hrefFor={(target) => `/turmas/${id}/aulas?mes=${target}` as Route}
        />
        {inMonth.length === 0 ? (
          <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
            {m.classes.noSessionsInMonth}
          </p>
        ) : (
          <ul className="divide-y overflow-hidden rounded-2xl bg-card">
            {inMonth.map((session) => {
              const day = formatDayHeading(session.held_on, today);
              const past = session.held_on <= today;
              return (
                <li
                  key={session.id}
                  className="flex min-h-15 flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-body font-medium first-letter:uppercase">
                      {day}
                    </span>
                    <span className="text-footnote text-muted-foreground tabular-nums">
                      {m.classes.timeRange(
                        formatTime(session.starts_at),
                        formatTime(session.ends_at),
                      )}
                    </span>
                    {session.cancel_reason ? (
                      <span className="flex items-center gap-1.5 text-footnote text-muted-foreground">
                        <CalendarXIcon aria-hidden="true" className="size-4" />
                        {m.classes.cancelledSession(session.cancel_reason)}
                      </span>
                    ) : session.attendance_taken_at ? (
                      <span className="flex items-center gap-1.5 text-footnote text-success">
                        <CircleCheckIcon
                          aria-hidden="true"
                          className="size-4"
                        />
                        {m.attendance.saved}
                      </span>
                    ) : (
                      past && (
                        <span className="flex items-center gap-1.5 text-footnote text-warning">
                          <CircleAlertIcon
                            aria-hidden="true"
                            className="size-4"
                          />
                          {m.attendance.pending}
                        </span>
                      )
                    )}
                    {session.topic && (
                      <span className="text-footnote">{session.topic}</span>
                    )}
                  </div>
                  {editable && session.cancel_reason && (
                    <RestoreSessionButton
                      sessionId={session.id}
                      label={`${m.attendance.restore}: ${day}`}
                    />
                  )}
                  {editable && !session.cancel_reason && past && (
                    <Link
                      href={`/turmas/${id}/chamada/${session.id}` as Route}
                      aria-label={`${session.attendance_taken_at ? m.attendance.view : m.attendance.take}: ${day}`}
                      className={buttonVariants({
                        variant: session.attendance_taken_at
                          ? "secondary"
                          : "default",
                        size: "lg",
                      })}
                    >
                      {session.attendance_taken_at
                        ? m.attendance.view
                        : m.attendance.take}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {!row.operable && (
          <p className="text-footnote text-muted-foreground">
            {m.attendance.teachNote}
          </p>
        )}
      </div>
    </>
  );
}
