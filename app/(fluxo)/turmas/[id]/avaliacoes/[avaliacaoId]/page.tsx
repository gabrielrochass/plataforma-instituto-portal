import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { GradeEntryForm } from "@/components/grades/grade-entry-form";
import { getClass, getRoster } from "@/lib/data/classes";
import { getAssessment } from "@/lib/data/grades";
import { formatScore } from "@/lib/grading";
import { m } from "@/lib/i18n";
import { displayName } from "@/lib/people";

export const metadata: Metadata = { title: m.grades.enter };

export default async function GradeEntryPage({
  params,
}: PageProps<"/turmas/[id]/avaliacoes/[avaliacaoId]">) {
  const { id, avaliacaoId } = await params;
  if (
    !z.uuid().safeParse(id).success ||
    !z.uuid().safeParse(avaliacaoId).success
  ) {
    notFound();
  }
  const [row, assessment, roster] = await Promise.all([
    getClass(id),
    getAssessment(avaliacaoId),
    getRoster(id),
  ]);
  if (
    !row ||
    !assessment ||
    assessment.class_id !== id ||
    !row.operable ||
    row.status !== "open" ||
    row.rules.scheme === "attendance_only"
  ) {
    notFound();
  }
  const grades = new Map(
    assessment.grades.map((grade) => [grade.enrollment_id, grade]),
  );

  return (
    <GradeEntryForm
      classId={id}
      assessmentId={assessment.id}
      title={assessment.title}
      subtitle={`${row.name}, ${m.grades.weightLabel(formatScore(assessment.weight))}`}
      scheme={row.rules.scheme}
      concepts={row.rules.conceptLabels ?? []}
      rows={roster
        .filter(
          (entry) =>
            entry.status === "active" &&
            (!assessment.held_on || entry.enrolledOn <= assessment.held_on),
        )
        .map((entry) => {
          const grade = grades.get(entry.id);
          return {
            enrollmentId: entry.id,
            name: displayName({
              full_name: entry.fullName,
              social_name: entry.socialName,
            }),
            score: grade?.score ?? null,
            concept: grade?.concept ?? null,
            missed: grade?.missed ?? false,
          };
        })}
    />
  );
}
