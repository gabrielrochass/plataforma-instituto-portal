import {
  CalendarCheckIcon,
  ClipboardListIcon,
  HourglassIcon,
  InboxIcon,
  MegaphoneIcon,
} from "lucide-react";
import type { Route } from "next";
import { EmptyState } from "@/components/app-shell/empty-state";
import { LinkList, type ListLink } from "@/components/app-shell/link-list";
import { PageHeader } from "@/components/app-shell/page-header";
import { AlertList, ClassDayList } from "@/components/attendance/session-lists";
import { classPhase } from "@/lib/class-phase";
import { getAnnouncements } from "@/lib/data/announcements";
import { getAbsenceAlerts, getHomeCounts } from "@/lib/data/attendance";
import { getClasses } from "@/lib/data/classes";
import { getClassDays } from "@/lib/data/overview";
import { getRequests } from "@/lib/data/requests";
import { getViewer } from "@/lib/data/viewer";
import { formatFullDate, todayInRecife } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { can } from "@/lib/roles";

export default async function HomePage() {
  const viewer = await getViewer();
  const admin = can.manageTeam(viewer);
  const today = todayInRecife();
  const [mine, all, alerts, classes, counts, requests, announcements] =
    await Promise.all([
      viewer.teaches ? getClassDays(today, viewer.id) : [],
      admin ? getClassDays(today, null) : [],
      getAbsenceAlerts(),
      admin ? getClasses() : [],
      admin ? getHomeCounts() : null,
      admin ? getRequests() : [],
      getAnnouncements(),
    ]);
  const unread = announcements.filter((item) => !item.read_at).length;
  const newRequests = requests.filter((row) => row.status === "pending").length;
  const firstName = viewer.name?.split(" ")[0] ?? null;
  const todays = mine.filter((item) => item.classToday);
  const myLate = mine.filter((item) => !item.classToday && item.pending > 0);
  const lateCount = all.reduce((total, item) => total + item.pending, 0);
  const late = all.filter((item) => item.pending > 0);
  const toClose = classes.filter(
    (row) => row.manageable && classPhase(row, today) === "toClose",
  );
  const current = classes.filter(
    (row) => row.manageable && classPhase(row, today) === "current",
  );
  const date = formatFullDate(today);

  const pendencies: ListLink[] = admin
    ? [
        ...(newRequests > 0
          ? [
              {
                href: "/inscricoes" as Route,
                title: m.requests.newRequests(newRequests),
                icon: InboxIcon,
                color: "chart-5",
              },
            ]
          : []),
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
        {unread > 0 && (
          <LinkList
            links={[
              {
                href: "/avisos",
                title: m.announcements.homeUnread(unread),
                icon: MegaphoneIcon,
                color: "chart-1",
              },
            ]}
          />
        )}
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
                [m.home.lateSessions, lateCount],
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
            {todays.length === 0 ? (
              <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
                {m.home.noClassesToday}
              </p>
            ) : (
              <ClassDayList items={todays} />
            )}
          </section>
        )}

        {(admin ? late : myLate).length > 0 && (
          <section aria-labelledby="atrasadas" className="flex flex-col gap-3">
            <h2 id="atrasadas" className="px-1 text-title3 font-semibold">
              {m.home.late}
            </h2>
            <ClassDayList items={admin ? late : myLate} />
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
