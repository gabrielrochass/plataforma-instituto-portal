import { ClipboardCheckIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";
import {
  PendingSessions,
  TodaySessions,
} from "@/components/attendance/session-lists";
import { isCurrentSession } from "@/lib/attendance";
import { getPendingSessions, getTodaySessions } from "@/lib/data/attendance";
import { minutesInRecife, todayInRecife } from "@/lib/dates";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.attendance.take };

export default async function ChamadaResolverPage() {
  const [today, pending] = await Promise.all([
    getTodaySessions(),
    getPendingSessions(),
  ]);
  const now = minutesInRecife();
  const current = today.filter(
    (session) =>
      !session.taken &&
      !session.cancelled &&
      isCurrentSession(
        { startsAt: session.starts_at, endsAt: session.ends_at },
        now,
      ),
  );
  if (current.length === 1) {
    redirect(
      `/turmas/${current[0].class_id}/chamada/${current[0].session_id}` as Route,
    );
  }
  const late = pending.filter(
    (session) => session.teaches && session.held_on < todayInRecife(),
  );

  return (
    <>
      <PageHeader
        title={m.attendance.chooseSession}
        subtitle={m.attendance.chooseHint}
      />
      {today.length === 0 && late.length === 0 ? (
        <EmptyState
          icon={ClipboardCheckIcon}
          title={m.home.emptyTitle}
          description={m.attendance.nothingToday}
        />
      ) : (
        <div className="flex flex-col gap-8">
          {today.length > 0 && (
            <section aria-labelledby="hoje" className="flex flex-col gap-3">
              <h2 id="hoje" className="px-1 text-title3 font-semibold">
                {m.home.today}
              </h2>
              <TodaySessions sessions={today} />
            </section>
          )}
          {late.length > 0 && (
            <section
              aria-labelledby="atrasadas"
              className="flex flex-col gap-3"
            >
              <h2 id="atrasadas" className="px-1 text-title3 font-semibold">
                {m.home.late}
              </h2>
              <PendingSessions sessions={late} today={todayInRecife()} />
            </section>
          )}
        </div>
      )}
    </>
  );
}
