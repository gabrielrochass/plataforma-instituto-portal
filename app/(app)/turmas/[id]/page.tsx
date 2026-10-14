import { ClipboardCheckIcon, IdCardIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { CancelClassButton } from "@/components/classes/cancel-class-button";
import { ClassHeader } from "@/components/classes/class-header";
import { ClassStatus } from "@/components/classes/class-status";
import { buttonVariants } from "@/components/ui/button";
import { classPhase } from "@/lib/class-phase";
import { getClass } from "@/lib/data/classes";
import { formatFullDate, todayInRecife } from "@/lib/dates";
import { ruleSentence } from "@/lib/grading";
import { m } from "@/lib/i18n";
import { weekdaysSummary } from "@/lib/schedule";

export async function generateMetadata({
  params,
}: PageProps<"/turmas/[id]">): Promise<Metadata> {
  const { id } = await params;
  const row = z.uuid().safeParse(id).success ? await getClass(id) : null;
  return { title: row?.name ?? m.classes.title };
}

export default async function ClassPage({ params }: PageProps<"/turmas/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const row = await getClass(id);
  if (!row) notFound();
  const today = todayInRecife();
  const details = [
    [
      m.classes.period,
      m.classes.periodRange(
        formatFullDate(row.starts_on),
        formatFullDate(row.ends_on),
      ),
    ],
    [m.classes.days, weekdaysSummary(row.weekdays)],
    [m.classes.workload, m.classes.hours(row.workload_hours)],
    [
      m.classes.teachers,
      row.teacher_names.filter(Boolean).join(", ") || m.classes.noTeachers,
    ],
    [m.classes.roster, m.classes.students(row.active_count, row.capacity)],
    [m.classes.rule, ruleSentence(row.rules)],
  ];
  const canTake =
    row.operable && row.status === "open" && row.starts_on <= today;

  return (
    <>
      <ClassHeader row={row} />
      <div className="flex flex-col gap-6">
        <ClassStatus phase={classPhase(row, today)} startsOn={row.starts_on} />
        {(canTake || row.operable) && (
          <div className="flex flex-wrap gap-3">
            {canTake && (
              <Link
                href={`/turmas/${id}/chamada` as Route}
                className={buttonVariants({ size: "lg" })}
              >
                <ClipboardCheckIcon aria-hidden="true" />
                {m.attendance.take}
              </Link>
            )}
            {row.operable && row.active_count > 0 && (
              <Link
                href={`/turmas/${id}/crachas` as Route}
                className={buttonVariants({ size: "lg", variant: "secondary" })}
              >
                <IdCardIcon aria-hidden="true" />
                {m.classes.badges}
              </Link>
            )}
          </div>
        )}
        <dl className="divide-y overflow-hidden rounded-2xl bg-card">
          {details.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5 px-4 py-3">
              <dt className="text-footnote font-medium text-muted-foreground">
                {label}
              </dt>
              <dd className="text-body tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        {row.manageable && row.status === "open" && (
          <CancelClassButton classId={row.id} name={row.name} />
        )}
      </div>
    </>
  );
}
