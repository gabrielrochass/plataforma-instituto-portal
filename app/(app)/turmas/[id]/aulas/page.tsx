import { CalendarXIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ClassHeader } from "@/components/classes/class-header";
import { MonthStepper } from "@/components/forms/month-stepper";
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
            {inMonth.map((session) => (
              <li
                key={session.id}
                className="flex min-h-15 flex-col justify-center gap-0.5 px-4 py-2"
              >
                <span className="text-body font-medium first-letter:uppercase">
                  {formatDayHeading(session.held_on, today)}
                </span>
                <span className="text-footnote text-muted-foreground tabular-nums">
                  {m.classes.timeRange(
                    formatTime(session.starts_at),
                    formatTime(session.ends_at),
                  )}
                </span>
                {session.cancel_reason && (
                  <span className="flex items-center gap-1.5 text-footnote text-warning">
                    <CalendarXIcon aria-hidden="true" className="size-4" />
                    {m.classes.cancelledSession(session.cancel_reason)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
