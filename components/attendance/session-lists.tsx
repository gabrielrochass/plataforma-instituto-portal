import {
  CalendarXIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  ClipboardCheckIcon,
  MessageCircleIcon,
  PhoneIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import type { AbsenceAlert, PendingSession } from "@/lib/data/attendance";
import { formatDate } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { telHref, whatsappHref } from "@/lib/people";
import { formatTime } from "@/lib/schedule";
import { cn } from "@/lib/utils";

export type TodaySession = {
  session_id: string;
  class_id: string;
  class_name: string;
  unit_code: string;
  starts_at: string;
  ends_at: string;
  taken: boolean;
  cancelled: boolean;
  present: number;
  absent: number;
};

function chamadaHref(classId: string, sessionId: string) {
  return `/turmas/${classId}/chamada/${sessionId}` as Route;
}

export function TodaySessions({
  sessions,
}: {
  sessions: readonly TodaySession[];
}) {
  return (
    <ul className="flex flex-col gap-3">
      {sessions.map((session) => (
        <li
          key={session.session_id}
          className="flex flex-col gap-3 rounded-2xl bg-card p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <span className="text-footnote text-muted-foreground tabular-nums">
                {m.classes.timeRange(
                  formatTime(session.starts_at),
                  formatTime(session.ends_at),
                )}
              </span>
              <span className="text-headline font-semibold">
                {session.class_name}
              </span>
            </div>
            <span className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-caption font-semibold">
              {session.unit_code}
            </span>
          </div>
          {session.cancelled ? (
            <p className="inline-flex items-center gap-1.5 text-footnote text-muted-foreground">
              <CalendarXIcon aria-hidden="true" className="size-4" />
              {m.attendance.cancelledSession}
            </p>
          ) : session.taken ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="inline-flex items-center gap-1.5 text-footnote font-medium text-success">
                <CircleCheckIcon aria-hidden="true" className="size-4" />
                {m.attendance.done(session.present, session.absent)}
              </p>
              <Link
                href={chamadaHref(session.class_id, session.session_id)}
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                {m.attendance.view}
              </Link>
            </div>
          ) : (
            <Link
              href={chamadaHref(session.class_id, session.session_id)}
              className={cn(buttonVariants({ size: "lg" }), "h-12 text-body")}
            >
              <ClipboardCheckIcon aria-hidden="true" />
              {m.attendance.take}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

export function PendingSessions({
  sessions,
  today,
}: {
  sessions: readonly PendingSession[];
  today: string;
}) {
  return (
    <ul className="divide-y overflow-hidden rounded-2xl bg-card">
      {sessions.map((session) => (
        <li key={session.session_id}>
          <Link
            href={chamadaHref(session.class_id, session.session_id)}
            className="flex min-h-15 items-center gap-3 px-4 py-2 hover:bg-muted/60 focus-visible:-outline-offset-2!"
          >
            <CircleAlertIcon
              aria-hidden="true"
              className="size-5 shrink-0 text-warning"
            />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-body font-medium">
                {session.class_name}
              </span>
              <span className="text-footnote text-muted-foreground tabular-nums">
                {`${m.classes.sessionLine(
                  formatDate(session.held_on, today),
                  formatTime(session.starts_at),
                  formatTime(session.ends_at),
                )}. ${m.attendance.pending}`}
              </span>
            </span>
            <ChevronRightIcon
              aria-hidden="true"
              className="size-5 shrink-0 text-muted-foreground"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function AlertList({ alerts }: { alerts: readonly AbsenceAlert[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {alerts.map((alert) => (
        <li
          key={alert.enrollment_id}
          className="flex flex-col gap-3 rounded-2xl bg-card p-4"
        >
          <div className="flex flex-col gap-0.5">
            <Link
              href={`/alunos/${alert.student_id}` as Route}
              className="w-fit text-headline font-semibold underline-offset-4 hover:underline"
            >
              {alert.student_name}
            </Link>
            <span className="text-footnote text-muted-foreground">
              {`${alert.class_name}, ${alert.unit_code}`}
            </span>
            <span className="inline-flex items-center gap-1.5 text-footnote font-medium text-warning">
              <CircleAlertIcon aria-hidden="true" className="size-4" />
              {m.attendance.streak(alert.streak)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {alert.contact_phone && alert.contact_name && (
              <a
                href={telHref(alert.contact_phone)}
                aria-label={m.attendance.callPerson(alert.contact_name)}
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                <PhoneIcon aria-hidden="true" />
                {m.attendance.call}
              </a>
            )}
            {alert.contact_phone &&
              alert.contact_whatsapp &&
              alert.contact_name && (
                <a
                  href={whatsappHref(alert.contact_phone)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={m.attendance.whatsappPerson(alert.contact_name)}
                  className={buttonVariants({
                    variant: "secondary",
                    size: "lg",
                  })}
                >
                  <MessageCircleIcon aria-hidden="true" />
                  {m.attendance.whatsapp}
                </a>
              )}
            <Link
              href={
                `/alunos/${alert.student_id}/acompanhamento?tipo=family_contact` as Route
              }
              aria-label={m.attendance.registerContactFor(alert.student_name)}
              className={buttonVariants({
                variant: "ghost",
                size: "lg",
                className: "text-link",
              })}
            >
              {m.attendance.registerContact}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
