import {
  CalendarCheckIcon,
  ClipboardListIcon,
  HourglassIcon,
} from "lucide-react";
import type { Route } from "next";
import { EmptyState } from "@/components/app-shell/empty-state";
import { LinkList, type ListLink } from "@/components/app-shell/link-list";
import { PageHeader } from "@/components/app-shell/page-header";
import {
  AlertList,
  PendingSessions,
  TodaySessions,
} from "@/components/attendance/session-lists";
import { classPhase } from "@/lib/class-phase";
import {
  getAbsenceAlerts,
  getHomeCounts,
  getPendingSessions,
  getTodaySessions,
} from "@/lib/data/attendance";
import { getClasses } from "@/lib/data/classes";
import { getViewer } from "@/lib/data/viewer";
import { formatFullDate, todayInRecife } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { can } from "@/lib/roles";

export default async function HomePage() {
  const viewer = await getViewer();
  const admin = can.manageTeam(viewer);
  const today = todayInRecife();
  const [sessions, pending, alerts, classes, counts] = await Promise.all([
    viewer.teaches ? getTodaySessions() : [],
    getPendingSessions(),
    getAbsenceAlerts(),
    admin ? getClasses() : [],
    admin ? getHomeCounts() : null,
  ]);
  const firstName = viewer.name?.split(" ")[0] ?? null;
  const late = pending.filter((session) => session.held_on < today);
  const myLate = late.filter((session) => session.teaches);
  const toClose = classes.filter(
    (row) => row.manageable && classPhase(row, today) === "toClose",
  );
  const current = classes.filter(
    (row) => row.manageable && classPhase(row, today) === "current",
  );
  const date = formatFullDate(today);

  const pendencies: ListLink[] = admin
    ? [
        ...(counts && counts.social_pending > 0
          ? [
              {
                href: "/alunos?situacao=pending" as Route,
                title: m.home.pendingSocial(counts.social_pending),
                icon: ClipboardListIcon,
                color: "chart-4",
              },
            ]
          : []),
        ...(toClose.length > 0
          ? [
              {
                href: "/turmas" as Route,
                title: m.home.toClose(toClose.length),
                icon: HourglassIcon,
                color: "chart-2",
              },
            ]
          : []),
      ]
    : [];

  return (
    <>
      <PageHeader title={m.home.greeting(firstName)} subtitle={date} />
      <div className="flex flex-col gap-8">
        {admin && counts && (
          <section aria-labelledby="numeros" className="flex flex-col gap-3">
            <h2 id="numeros" className="sr-only">
              {m.home.stats}
            </h2>
            <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                [m.home.activeStudents, counts.active_students],
                [m.home.currentClasses, current.length],
                [m.home.alerts, alerts.length],
                [m.home.lateSessions, late.length],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="flex flex-col-reverse gap-1 rounded-2xl bg-card p-4"
                >
                  <dt className="text-footnote text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="text-title1 font-bold tabular-nums">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {viewer.teaches && (
          <section aria-labelledby="hoje" className="flex flex-col gap-3">
            <h2 id="hoje" className="px-1 text-title3 font-semibold">
              {m.home.today}
            </h2>
            {sessions.length === 0 ? (
              <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
                {m.home.noClassesToday}
              </p>
            ) : (
              <TodaySessions sessions={sessions} />
            )}
          </section>
        )}

        {(admin ? late : myLate).length > 0 && (
          <section aria-labelledby="atrasadas" className="flex flex-col gap-3">
            <h2 id="atrasadas" className="px-1 text-title3 font-semibold">
              {m.home.late}
            </h2>
            <PendingSessions sessions={admin ? late : myLate} today={today} />
          </section>
        )}

        {(viewer.teaches || admin) && (
          <section aria-labelledby="atencao" className="flex flex-col gap-3">
            <h2 id="atencao" className="px-1 text-title3 font-semibold">
              {m.home.attention}
            </h2>
            {alerts.length === 0 ? (
              <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
                {m.home.noAttention}
              </p>
            ) : (
              <AlertList alerts={alerts} />
            )}
          </section>
        )}

        {admin && (
          <section aria-labelledby="pendencias" className="flex flex-col gap-3">
            <h2 id="pendencias" className="px-1 text-title3 font-semibold">
              {m.home.pendencies}
            </h2>
            {pendencies.length === 0 ? (
              <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
                {m.home.noPendencies}
              </p>
            ) : (
              <LinkList links={pendencies} />
            )}
          </section>
        )}

        {!admin && !viewer.teaches && (
          <EmptyState
            icon={CalendarCheckIcon}
            title={m.home.emptyTitle}
            description={m.home.emptyDescription}
          />
        )}
      </div>
    </>
  );
}
