import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { CloseClassForm } from "@/components/grades/close-class-form";
import { getClass, getClassSessions } from "@/lib/data/classes";
import { getClassResults } from "@/lib/data/grades";
import { todayInRecife } from "@/lib/dates";
import { formatScore, resultOf } from "@/lib/grading";
import { m } from "@/lib/i18n";
import { classDays } from "@/lib/schedule";

export const metadata: Metadata = { title: m.closing.title };

export default async function CloseClassPage({
  params,
}: PageProps<"/turmas/[id]/encerrar">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const row = await getClass(id);
  if (!row || !row.operable || row.status !== "open") notFound();
  const [results, sessions] = await Promise.all([
    getClassResults(id),
    getClassSessions(id),
  ]);
  const today = todayInRecife();
  const taken = new Set(sessions.map((session) => session.held_on));
  const pendingSessions = classDays(row, row.starts_on, today).filter(
    (day) => !taken.has(day),
  ).length;
  const missingGrades = results.reduce(
    (total, result) => total + result.missing_grades,
    0,
  );
  const warnings = [
    ...(pendingSessions > 0
      ? [m.closing.pendingSessions(pendingSessions)]
      : []),
    ...(missingGrades > 0 ? [m.closing.missingGrades(missingGrades)] : []),
  ];

  return (
    <CloseClassForm
      classId={id}
      className={row.name}
      warnings={warnings}
      rows={results.map((result) => ({
        enrollmentId: result.enrollment_id,
        name: result.student_name,
        detail: [
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
        ]
          .filter(Boolean)
          .join(", "),
        result: resultOf(result),
      }))}
    />
  );
}
