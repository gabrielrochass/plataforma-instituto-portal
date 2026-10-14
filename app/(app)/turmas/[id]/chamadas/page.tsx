import { ChevronRightIcon, ClipboardCheckIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ClassHeader } from "@/components/classes/class-header";
import { buttonVariants } from "@/components/ui/button";
import { getClass, getClassSessions } from "@/lib/data/classes";
import { formatDayHeading, todayInRecife } from "@/lib/dates";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.classes.sessions };

export default async function ClassSessionsPage({
  params,
}: PageProps<"/turmas/[id]/chamadas">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [row, sessions] = await Promise.all([
    getClass(id),
    getClassSessions(id),
  ]);
  if (!row || !row.operable) notFound();
  const today = todayInRecife();
  const open = row.status === "open" && row.starts_on <= today;

  return (
    <>
      <ClassHeader row={row} />
      <div className="flex flex-col gap-4">
        {open && (
          <Link
            href={`/turmas/${id}/chamada` as Route}
            className={buttonVariants({ size: "lg", className: "self-start" })}
          >
            <ClipboardCheckIcon aria-hidden="true" />
            {m.attendance.take}
          </Link>
        )}
        <section aria-labelledby="chamadas" className="flex flex-col gap-3">
          <h2 id="chamadas" className="px-1 text-title3 font-semibold">
            {m.attendance.history}
          </h2>
          {sessions.length === 0 ? (
            <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
              {m.attendance.noHistory}
            </p>
          ) : (
            <ul className="divide-y overflow-hidden rounded-2xl bg-card">
              {sessions.map((session) => {
                const body = (
                  <>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-body font-medium first-letter:uppercase">
                        {formatDayHeading(session.held_on, today)}
                      </span>
                      <span className="text-footnote text-muted-foreground tabular-nums">
                        {m.attendance.done(session.present, session.absent)}
                        {session.taken_by_name &&
                          `, ${m.attendance.takenByName(session.taken_by_name)}`}
                      </span>
                      {session.note && (
                        <span className="text-footnote text-muted-foreground">
                          {session.note}
                        </span>
                      )}
                    </span>
                    {open && (
                      <ChevronRightIcon
                        aria-hidden="true"
                        className="size-5 shrink-0 text-muted-foreground"
                      />
                    )}
                  </>
                );
                return (
                  <li key={session.session_id}>
                    {open ? (
                      <Link
                        href={
                          `/turmas/${id}/chamada?data=${session.held_on}` as Route
                        }
                        className="flex min-h-15 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60 focus-visible:-outline-offset-2!"
                      >
                        {body}
                      </Link>
                    ) : (
                      <div className="flex min-h-15 items-center gap-3 px-4 py-3">
                        {body}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
