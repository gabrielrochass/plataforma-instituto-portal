import {
  ArrowRightLeftIcon,
  CircleCheckIcon,
  CircleDotIcon,
  CircleSlashIcon,
  CircleXIcon,
  LogOutIcon,
} from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { StudentHeader } from "@/components/students/student-header";
import { attendanceRate } from "@/lib/attendance";
import { getStudent, getStudentTimeline } from "@/lib/data/students";
import { getViewer } from "@/lib/data/viewer";
import { formatFullDate, todayInRecife } from "@/lib/dates";
import { formatScore } from "@/lib/grading";
import { m } from "@/lib/i18n";
import { can } from "@/lib/roles";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: m.students.classes };

const icons = {
  active: CircleDotIcon,
  completed: CircleCheckIcon,
  failed: CircleXIcon,
  transferred: ArrowRightLeftIcon,
  dropped_out: LogOutIcon,
  cancelled: CircleSlashIcon,
};

export default async function StudentClassesPage({
  params,
}: PageProps<"/alunos/[id]/turmas">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [viewer, student, timeline] = await Promise.all([
    getViewer(),
    getStudent(id),
    getStudentTimeline(id),
  ]);
  if (!student) notFound();
  const today = todayInRecife();

  return (
    <>
      <StudentHeader
        student={student}
        today={today}
        showSocial={can.manageTeam(viewer)}
      />
      {timeline.length === 0 ? (
        <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
          {m.students.timelineEmpty}
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {timeline.map((entry) => {
            const Icon = icons[entry.status];
            const content = (
              <>
                <span className="text-footnote text-muted-foreground">
                  {`${entry.course_name}, ${entry.unit_code}`}
                </span>
                <span className="text-headline font-semibold">
                  {entry.class_name}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-footnote font-medium",
                    entry.status === "active"
                      ? "text-success"
                      : "text-muted-foreground",
                  )}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {entry.status === "transferred" && entry.transferred_to_class
                    ? m.students.transferredTo(entry.transferred_to_class)
                    : m.students.enrollmentStatus[entry.status]}
                  {entry.exit_reason && entry.status !== "transferred"
                    ? `. ${m.enrollment.reasons[entry.exit_reason]}`
                    : ""}
                  {entry.final_score !== null
                    ? `. ${m.closing.finalScore(formatScore(entry.final_score))}`
                    : entry.final_concept
                      ? `. ${m.closing.finalConcept(entry.final_concept)}`
                      : ""}
                </span>
                <span className="text-footnote text-muted-foreground tabular-nums">
                  {entry.ended_on
                    ? m.students.between(
                        formatFullDate(entry.enrolled_on),
                        formatFullDate(entry.ended_on),
                      )
                    : m.students.since(formatFullDate(entry.enrolled_on))}
                  {(() => {
                    const rate = attendanceRate(entry);
                    return rate === null ? "" : `. ${m.attendance.rate(rate)}`;
                  })()}
                </span>
              </>
            );
            return (
              <li key={entry.enrollment_id}>
                {entry.operable ? (
                  <Link
                    href={`/turmas/${entry.class_id}` as Route}
                    className="flex flex-col gap-1 rounded-2xl bg-card p-4 transition-colors hover:bg-card/70"
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="flex flex-col gap-1 rounded-2xl bg-card p-4">
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
