import {
  AccessibilityIcon,
  ChevronLeftIcon,
  ClipboardListIcon,
  MessageCircleIcon,
  PencilIcon,
  PhoneIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { PersonAvatar } from "@/components/app-shell/person-avatar";
import { SegmentedNav } from "@/components/app-shell/segmented-nav";
import { buttonVariants } from "@/components/ui/button";
import type { Student } from "@/lib/data/students";
import { m } from "@/lib/i18n";
import {
  ageOn,
  displayName,
  isMinor,
  telHref,
  whatsappHref,
} from "@/lib/people";
import { cn } from "@/lib/utils";

export function StudentHeader({
  student,
  today,
  showSocial,
}: {
  student: Student;
  today: string;
  showSocial: boolean;
}) {
  const name = displayName(student);
  const base = `/alunos/${student.id}`;
  const contact = student.phone
    ? { name, phone: student.phone, whatsapp: true }
    : student.guardians[0]
      ? {
          name: student.guardians[0].full_name,
          phone: student.guardians[0].phone,
          whatsapp: student.guardians[0].is_whatsapp,
        }
      : null;
  const accessibility = (student.student_care?.accessibility ?? []).length > 0;

  return (
    <>
      <Link
        href="/alunos"
        className="-ml-1 flex w-fit min-h-11 items-center gap-0.5 text-body text-link"
      >
        <ChevronLeftIcon aria-hidden="true" className="size-5" />
        {m.students.title}
      </Link>
      <header className="flex flex-col gap-4 pb-6">
        <div className="flex items-start gap-4">
          <PersonAvatar
            name={name}
            photo={student.photo}
            className="size-16 text-title3"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h1 className="text-title1 font-bold tracking-tight text-balance">
              {name}
            </h1>
            {student.social_name && showSocial && (
              <p className="text-footnote text-muted-foreground">
                {student.full_name}
              </p>
            )}
            <p className="text-subhead text-muted-foreground tabular-nums">
              {`${m.students.age(ageOn(student.birth_date, today))}, ${student.units?.name ?? ""}`}
            </p>
            <p className="flex flex-wrap gap-x-3 gap-y-1 text-footnote font-medium">
              {isMinor(student.birth_date, today) && (
                <span className="text-muted-foreground">
                  {m.students.minor}
                </span>
              )}
              {accessibility && (
                <span className="inline-flex items-center gap-1 text-link">
                  <AccessibilityIcon aria-hidden="true" className="size-4" />
                  {m.students.accessibility}
                </span>
              )}
              {showSocial && !student.last_assessed_on && (
                <span className="inline-flex items-center gap-1 text-warning">
                  <ClipboardListIcon aria-hidden="true" className="size-4" />
                  {m.students.pendingSocial}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {contact && (
            <a
              href={telHref(contact.phone)}
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              <PhoneIcon aria-hidden="true" />
              {m.students.call(contact.name.split(" ")[0])}
            </a>
          )}
          {contact?.whatsapp && (
            <a
              href={whatsappHref(contact.phone)}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              <MessageCircleIcon aria-hidden="true" />
              {m.students.whatsapp(contact.name.split(" ")[0])}
            </a>
          )}
          <Link
            href={`${base}/editar` as Route}
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "text-link",
            )}
          >
            <PencilIcon aria-hidden="true" />
            {m.students.edit}
          </Link>
        </div>
      </header>
      <SegmentedNav
        label={m.students.tabs}
        items={[
          { href: base as Route, label: m.students.summary },
          { href: `${base}/turmas` as Route, label: m.students.classes },
          { href: `${base}/acompanhamento` as Route, label: m.notes.title },
          ...(showSocial
            ? [
                { href: `${base}/ficha` as Route, label: m.social.tab },
                { href: `${base}/dados` as Route, label: m.social.dataTab },
              ]
            : []),
        ]}
      />
    </>
  );
}
