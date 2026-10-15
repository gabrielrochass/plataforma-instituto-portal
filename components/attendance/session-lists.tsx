import {
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
import type { AbsenceAlert } from "@/lib/data/attendance";
import { m } from "@/lib/i18n";
import { telHref, whatsappHref } from "@/lib/people";

export type ClassDay = {
  classId: string;
  name: string;
  unitCode: string;
  takenToday: boolean;
  pending: number;
};

export function ClassDayList({ items }: { items: readonly ClassDay[] }) {
  return (
    <ul className="divide-y overflow-hidden rounded-2xl bg-card">
      {items.map((item) => {
        const Icon = item.takenToday ? CircleCheckIcon : ClipboardCheckIcon;
        return (
          <li key={item.classId}>
            <Link
              href={`/turmas/${item.classId}/chamada` as Route}
              className="flex min-h-15 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60 focus-visible:-outline-offset-2!"
            >
              <Icon aria-hidden="true" className="size-5 shrink-0" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-body font-medium">{item.name}</span>
                <span className="text-footnote text-muted-foreground">
                  {[
                    item.unitCode,
                    item.takenToday ? m.attendance.saved : null,
                    item.pending > 0
                      ? m.attendance.pendingDays(item.pending)
                      : null,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </span>
              <span className="hidden text-subhead font-medium text-link sm:inline">
                {item.takenToday ? m.attendance.view : m.attendance.take}
              </span>
              <ChevronRightIcon
                aria-hidden="true"
                className="size-5 shrink-0 text-muted-foreground"
              />
            </Link>
          </li>
        );
      })}
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
