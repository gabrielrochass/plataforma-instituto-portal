import { ClipboardPenIcon, FlagIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ClassHeader } from "@/components/classes/class-header";
import {
  DeleteAssessmentButton,
  NewAssessmentForm,
  ReopenClassButton,
} from "@/components/grades/assessment-controls";
import { ResultLabel } from "@/components/grades/result-label";
import { buttonVariants } from "@/components/ui/button";
import { getClass } from "@/lib/data/classes";
import { getAssessments, getClassResults } from "@/lib/data/grades";
import { formatFullDate } from "@/lib/dates";
import { formatScore, resultOf } from "@/lib/grading";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.grades.tab };

export default async function ClassGradesPage({
  params,
}: PageProps<"/turmas/[id]/notas">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const row = await getClass(id);
  if (!row || !row.operable) notFound();
  const [assessments, results] = await Promise.all([
    getAssessments(id),
    row.status === "open" ? getClassResults(id) : [],
  ]);
  const open = row.status === "open";
  const graded = row.rules.scheme !== "attendance_only";

  return (
    <>
      <ClassHeader row={row} />
      <div className="flex flex-col gap-8">
        {!graded && (
          <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
            {m.grades.attendanceOnly}
          </p>
        )}

        {graded && (
          <section aria-labelledby="avaliacoes" className="flex flex-col gap-3">
            <h2 id="avaliacoes" className="px-1 text-title3 font-semibold">
              {m.grades.assessments}
            </h2>
            {assessments.length === 0 ? (
              <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
                {m.grades.noAssessments}
              </p>
            ) : (
              <ul className="divide-y overflow-hidden rounded-2xl bg-card">
                {assessments.map((assessment) => (
                  <li
                    key={assessment.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="text-body font-medium">
                        {assessment.title}
                      </span>
                      <span className="text-footnote text-muted-foreground tabular-nums">
                        {[
                          assessment.held_on
                            ? formatFullDate(assessment.held_on)
                            : null,
                          m.grades.weightLabel(formatScore(assessment.weight)),
                          m.grades.progress(
                            assessment.graded,
                            row.active_count,
                          ),
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </span>
                    {open && (
                      <span className="flex items-center gap-1">
                        <Link
                          href={
                            `/turmas/${id}/avaliacoes/${assessment.id}` as Route
                          }
                          aria-label={m.grades.enterFor(assessment.title)}
                          className={buttonVariants({
                            variant: "secondary",
                            size: "lg",
                          })}
                        >
                          <ClipboardPenIcon aria-hidden="true" />
                          {m.grades.enter}
                        </Link>
                        <DeleteAssessmentButton
                          id={assessment.id}
                          title={assessment.title}
                        />
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {graded && open && (
          <section
            aria-labelledby="nova-avaliacao"
            className="flex flex-col gap-3"
          >
            <h2 id="nova-avaliacao" className="px-1 text-title3 font-semibold">
              {m.grades.newAssessment}
            </h2>
            <NewAssessmentForm classId={id} />
          </section>
        )}

        {open && (
          <section aria-labelledby="situacao" className="flex flex-col gap-3">
            <h2 id="situacao" className="px-1 text-title3 font-semibold">
              {m.grades.summary}
            </h2>
            {results.length === 0 ? (
              <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
                {m.grades.noStudents}
              </p>
            ) : (
              <ul className="divide-y overflow-hidden rounded-2xl bg-card">
                {results.map((result) => (
                  <li
                    key={result.enrollment_id}
                    className="flex flex-col gap-0.5 px-4 py-3"
                  >
                    <span className="text-body font-medium">
                      {result.student_name}
                    </span>
                    <span className="text-footnote text-muted-foreground tabular-nums">
                      {[
                        result.final_score !== null
                          ? `${m.grades.average} ${formatScore(result.final_score)}`
                          : null,
                        result.final_concept
                          ? `${m.grades.conceptColumn} ${result.final_concept}`
                          : null,
                        `${m.grades.attendance} ${
                          result.attendance_pct === null
                            ? m.attendance.noRate.toLowerCase()
                            : `${formatScore(result.attendance_pct)}%`
                        }`,
                        result.missing_grades > 0
                          ? m.grades.missingCount(result.missing_grades)
                          : null,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                    <ResultLabel result={resultOf(result)} />
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={`/turmas/${id}/encerrar` as Route}
              className={buttonVariants({
                variant: "secondary",
                size: "lg",
                className: "self-start",
              })}
            >
              <FlagIcon aria-hidden="true" />
              {m.closing.action}
            </Link>
          </section>
        )}

        {row.status === "finished" && row.manageable && (
          <ReopenClassButton classId={id} />
        )}
      </div>
    </>
  );
}
