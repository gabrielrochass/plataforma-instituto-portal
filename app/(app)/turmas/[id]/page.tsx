import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { CancelClassButton } from "@/components/classes/cancel-class-button";
import { ClassHeader } from "@/components/classes/class-header";
import { ClassStatus } from "@/components/classes/class-status";
import { classPhase } from "@/lib/class-phase";
import { getClass, getClassSessions } from "@/lib/data/classes";
import { formatDate, formatFullDate, todayInRecife } from "@/lib/dates";
import { ruleSentence } from "@/lib/grading";
import { m } from "@/lib/i18n";
import { formatTime, scheduleSummary, workloadMinutes } from "@/lib/schedule";

export async function generateMetadata({
  params,
}: PageProps<"/turmas/[id]">): Promise<Metadata> {
  const { id } = await params;
  const row = z.uuid().safeParse(id).success ? await getClass(id) : null;
  return { title: row?.name ?? m.classes.title };
}

export default async function ClassPage({ params }: PageProps<"/turmas/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [row, sessions] = await Promise.all([
    getClass(id),
    getClassSessions(id),
  ]);
  if (!row) notFound();
  const today = todayInRecife();
  const held = sessions.filter((session) => !session.cancelled_at);
  const upcoming = held
    .filter((session) => session.held_on >= today)
    .slice(0, 5);
  const details = [
    [
      m.classes.period,
      m.classes.periodRange(
        formatFullDate(row.starts_on),
        formatFullDate(row.ends_on),
      ),
    ],
    [m.classes.schedule, scheduleSummary(row.slots)],
    [
      m.classes.sessions,
      `${m.classes.sessionsCount(held.length)}, ${m.classes.hours(
        workloadMinutes(
          held.map((session) => ({
            heldOn: session.held_on,
            startsAt: session.starts_at,
            endsAt: session.ends_at,
          })),
        ),
      )}`,
    ],
    [
      m.classes.teachers,
      row.teacher_names.filter(Boolean).join(", ") || m.classes.noTeachers,
    ],
    [m.classes.roster, m.classes.students(row.active_count, row.capacity)],
    [m.classes.rule, ruleSentence(row.rules)],
  ];

  return (
    <>
      <ClassHeader row={row} />
      <div className="flex flex-col gap-8">
        <ClassStatus phase={classPhase(row, today)} startsOn={row.starts_on} />
        <dl className="divide-y overflow-hidden rounded-2xl bg-card">
          {details.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5 px-4 py-3">
              <dt className="text-footnote font-medium text-muted-foreground">
                {label}
              </dt>
              <dd className="text-body tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        {row.status === "open" && (
          <section aria-labelledby="proximas" className="flex flex-col gap-3">
            <h2 id="proximas" className="px-1 text-title3 font-semibold">
              {m.classes.nextSessions}
            </h2>
            {upcoming.length === 0 ? (
              <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
                {m.classes.noNextSessions}
              </p>
            ) : (
              <ul className="divide-y overflow-hidden rounded-2xl bg-card">
                {upcoming.map((session) => (
                  <li
                    key={session.id}
                    className="flex min-h-13 items-center px-4 py-2 text-body tabular-nums"
                  >
                    {m.classes.sessionLine(
                      formatDate(session.held_on, today),
                      formatTime(session.starts_at),
                      formatTime(session.ends_at),
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        {row.manageable && row.status === "open" && (
          <CancelClassButton classId={row.id} name={row.name} />
        )}
      </div>
    </>
  );
}
