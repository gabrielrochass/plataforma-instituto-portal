import { UsersRoundIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { EmptyState } from "@/components/app-shell/empty-state";
import { ClassHeader } from "@/components/classes/class-header";
import { EnrollSheet } from "@/components/enrollment/enroll-sheet";
import { RosterList } from "@/components/enrollment/roster-list";
import { attendanceRate } from "@/lib/attendance";
import { getClassAttendance } from "@/lib/data/attendance";
import { getClass, getClasses, getRoster } from "@/lib/data/classes";
import { photoUrls } from "@/lib/data/photos";
import { formatFullDate, todayInRecife } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { ageOn, displayName } from "@/lib/people";

export const metadata: Metadata = { title: m.classes.roster };

export default async function ClassRosterPage({
  params,
}: PageProps<"/turmas/[id]/alunos">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [row, roster, classes, attendance] = await Promise.all([
    getClass(id),
    getRoster(id),
    getClasses(),
    getClassAttendance(id),
  ]);
  const photos = await photoUrls(roster.map((entry) => entry.photoPath));
  if (!row) notFound();
  const today = todayInRecife();
  const editable = row.operable && row.status === "open";
  const active = roster.filter((entry) => entry.status === "active");
  const past = roster.filter((entry) => entry.status !== "active");
  const targets = classes
    .filter(
      (candidate) =>
        candidate.id !== row.id &&
        candidate.operable &&
        candidate.status === "open" &&
        candidate.ends_on >= today,
    )
    .map((candidate) => ({
      id: candidate.id,
      label: `${candidate.name} (${candidate.unit_code})`,
    }));

  return (
    <>
      <ClassHeader row={row} />
      <div className="flex flex-col gap-8">
        {!row.operable ? (
          <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
            {m.classes.students(row.active_count, row.capacity)}
          </p>
        ) : (
          <>
            {editable && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-subhead text-muted-foreground tabular-nums">
                  {m.classes.students(row.active_count, row.capacity)}
                </p>
                <EnrollSheet
                  classId={row.id}
                  enrolledIds={active.map((entry) => entry.studentId)}
                />
              </div>
            )}
            {active.length === 0 ? (
              <EmptyState
                icon={UsersRoundIcon}
                title={m.classes.rosterEmpty}
                description={m.classes.rosterEmptyHint}
              />
            ) : (
              <RosterList
                editable={editable}
                targets={targets}
                rows={active.map((entry) => {
                  const counts = attendance.get(entry.id);
                  const rate = counts
                    ? attendanceRate({
                        attended: counts.present,
                        missed: counts.absent,
                      })
                    : null;
                  return {
                    enrollmentId: entry.id,
                    studentId: entry.studentId,
                    name: displayName({
                      full_name: entry.fullName,
                      social_name: entry.socialName,
                    }),
                    photo: entry.photoPath
                      ? (photos.get(entry.photoPath) ?? null)
                      : null,
                    detail: `${m.students.age(ageOn(entry.birthDate, today))}, ${
                      rate === null
                        ? m.attendance.noRate
                        : m.attendance.rate(rate)
                    }`,
                    accessibility: entry.accessibility.length > 0,
                    warning:
                      counts && counts.streak >= 3
                        ? m.attendance.streak(counts.streak)
                        : rate !== null && rate < row.rules.minAttendance
                          ? m.attendance.belowMinimum(row.rules.minAttendance)
                          : undefined,
                  };
                })}
              />
            )}
            {past.length > 0 && (
              <section aria-labelledby="sairam" className="flex flex-col gap-3">
                <h2 id="sairam" className="px-1 text-title3 font-semibold">
                  {m.classes.pastEnrollments}
                </h2>
                <RosterList
                  editable={false}
                  targets={[]}
                  rows={past.map((entry) => ({
                    enrollmentId: entry.id,
                    studentId: entry.studentId,
                    name: displayName({
                      full_name: entry.fullName,
                      social_name: entry.socialName,
                    }),
                    photo: entry.photoPath
                      ? (photos.get(entry.photoPath) ?? null)
                      : null,
                    detail: `${m.students.enrollmentStatus[entry.status]}, ${formatFullDate(
                      entry.endedOn ?? entry.enrolledOn,
                    )}${entry.exitReason ? `, ${m.enrollment.reasons[entry.exitReason]}` : ""}`,
                    accessibility: false,
                  }))}
                />
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
