import { MessageCircleIcon, PhoneIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { StudentHeader } from "@/components/students/student-header";
import { buttonVariants } from "@/components/ui/button";
import { attendanceRate } from "@/lib/attendance";
import {
  getStudent,
  getStudentCpf,
  getStudentTimeline,
} from "@/lib/data/students";
import { getViewer } from "@/lib/data/viewer";
import { todayInRecife } from "@/lib/dates";
import { m } from "@/lib/i18n";
import {
  displayName,
  formatCpf,
  formatPhone,
  telHref,
  whatsappHref,
} from "@/lib/people";
import { can } from "@/lib/roles";

function rateLabel(entry: { attended: number; missed: number }) {
  const rate = attendanceRate(entry);
  return rate === null ? m.attendance.noRate : m.attendance.rate(rate);
}

export async function generateMetadata({
  params,
}: PageProps<"/alunos/[id]">): Promise<Metadata> {
  const { id } = await params;
  const student = z.uuid().safeParse(id).success ? await getStudent(id) : null;
  return { title: student ? displayName(student) : m.students.title };
}

export default async function StudentPage({
  params,
}: PageProps<"/alunos/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [viewer, student, timeline] = await Promise.all([
    getViewer(),
    getStudent(id),
    getStudentTimeline(id),
  ]);
  if (!student) notFound();
  const admin = can.manageTeam(viewer);
  const privateData = admin ? await getStudentCpf(id) : null;
  const today = todayInRecife();
  const active = timeline.filter((entry) => entry.status === "active");
  const care = student.student_care;

  return (
    <>
      <StudentHeader
        student={student}
        today={today}
        showSocial={privateData !== null}
      />
      <div className="flex flex-col gap-8">
        <section
          aria-labelledby="turmas-ativas"
          className="flex flex-col gap-3"
        >
          <h2 id="turmas-ativas" className="px-1 text-title3 font-semibold">
            {m.students.activeClasses(active.length)}
          </h2>
          {active.length > 0 && (
            <ul className="divide-y overflow-hidden rounded-2xl bg-card">
              {active.map((entry) => (
                <li key={entry.enrollment_id}>
                  {entry.operable ? (
                    <Link
                      href={`/turmas/${entry.class_id}` as Route}
                      className="flex min-h-15 flex-col justify-center px-4 py-2 hover:bg-muted/60"
                    >
                      <span className="text-body font-medium">
                        {entry.class_name}
                      </span>
                      <span className="text-footnote text-muted-foreground">
                        {`${entry.course_name}, ${entry.unit_code}. ${rateLabel(entry)}`}
                      </span>
                    </Link>
                  ) : (
                    <div className="flex min-h-15 flex-col justify-center px-4 py-2">
                      <span className="text-body font-medium">
                        {entry.class_name}
                      </span>
                      <span className="text-footnote text-muted-foreground">
                        {`${entry.course_name}, ${entry.unit_code}`}
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="contato" className="flex flex-col gap-3">
          <h2 id="contato" className="px-1 text-title3 font-semibold">
            {m.students.contact}
          </h2>
          <dl className="divide-y overflow-hidden rounded-2xl bg-card">
            <div className="flex flex-col gap-0.5 px-4 py-3">
              <dt className="text-footnote font-medium text-muted-foreground">
                {m.students.phone}
              </dt>
              <dd className="text-body tabular-nums">
                {student.phone
                  ? formatPhone(student.phone)
                  : m.students.noContact}
              </dd>
            </div>
            {student.email && (
              <div className="flex flex-col gap-0.5 px-4 py-3">
                <dt className="text-footnote font-medium text-muted-foreground">
                  {m.students.email}
                </dt>
                <dd className="text-body wrap-anywhere">{student.email}</dd>
              </div>
            )}
            {privateData && (
              <div className="flex flex-col gap-0.5 px-4 py-3">
                <dt className="text-footnote font-medium text-muted-foreground">
                  {m.studentForm.cpf}
                </dt>
                <dd className="text-body tabular-nums">
                  {privateData.cpf
                    ? formatCpf(privateData.cpf)
                    : m.students.notInformed}
                </dd>
              </div>
            )}
          </dl>
        </section>

        {student.guardians.length > 0 && (
          <section
            aria-labelledby="responsaveis"
            className="flex flex-col gap-3"
          >
            <h2 id="responsaveis" className="px-1 text-title3 font-semibold">
              {m.students.guardians}
            </h2>
            <ul className="divide-y overflow-hidden rounded-2xl bg-card">
              {student.guardians.map((guardian) => (
                <li
                  key={guardian.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-body font-medium">
                      {guardian.full_name}
                    </span>
                    <span className="text-footnote text-muted-foreground tabular-nums">
                      {`${m.studentForm.relationships[guardian.relationship]}. ${formatPhone(guardian.phone)}`}
                    </span>
                  </span>
                  <span className="flex gap-1">
                    <a
                      href={telHref(guardian.phone)}
                      aria-label={m.students.call(guardian.full_name)}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "icon-lg",
                      })}
                    >
                      <PhoneIcon aria-hidden="true" className="size-5" />
                    </a>
                    {guardian.is_whatsapp && (
                      <a
                        href={whatsappHref(guardian.phone)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={m.students.whatsapp(guardian.full_name)}
                        className={buttonVariants({
                          variant: "ghost",
                          size: "icon-lg",
                        })}
                      >
                        <MessageCircleIcon
                          aria-hidden="true"
                          className="size-5"
                        />
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="sala" className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5 px-1">
            <h2 id="sala" className="text-title3 font-semibold">
              {m.students.classroom}
            </h2>
            <p className="text-footnote text-muted-foreground">
              {m.students.classroomHint}
            </p>
          </div>
          {care ? (
            <dl className="divide-y overflow-hidden rounded-2xl bg-card">
              <div className="flex flex-col gap-0.5 px-4 py-3">
                <dt className="text-footnote font-medium text-muted-foreground">
                  {m.studentForm.accessibilityLegend}
                </dt>
                <dd className="text-body">
                  {care.accessibility.length > 0
                    ? care.accessibility
                        .map(
                          (kind) =>
                            m.studentForm.accessibilityKinds[
                              kind as keyof typeof m.studentForm.accessibilityKinds
                            ],
                        )
                        .join(", ")
                    : m.students.noClassroomNotes}
                </dd>
              </div>
              {care.accessibility_notes && (
                <div className="flex flex-col gap-0.5 px-4 py-3">
                  <dt className="text-footnote font-medium text-muted-foreground">
                    {m.studentForm.accessibilityNotes}
                  </dt>
                  <dd className="text-body whitespace-pre-line">
                    {care.accessibility_notes}
                  </dd>
                </div>
              )}
              {care.notes_for_teachers && (
                <div className="flex flex-col gap-0.5 px-4 py-3">
                  <dt className="text-footnote font-medium text-muted-foreground">
                    {m.studentForm.notesForTeachers}
                  </dt>
                  <dd className="text-body whitespace-pre-line">
                    {care.notes_for_teachers}
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
              {m.students.noClassroomNotes}
            </p>
          )}
        </section>
      </div>
    </>
  );
}
