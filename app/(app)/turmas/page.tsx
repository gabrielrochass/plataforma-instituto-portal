import { PlusIcon, UsersRoundIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/app-shell/empty-state";
import { FilterLinks } from "@/components/app-shell/filter-links";
import { PageHeader } from "@/components/app-shell/page-header";
import { ClassStatus } from "@/components/classes/class-status";
import { buttonVariants } from "@/components/ui/button";
import {
  type ClassSituation,
  classPhase,
  matchesSituation,
  parseSituation,
} from "@/lib/class-phase";
import { getClasses } from "@/lib/data/classes";
import { getUnits } from "@/lib/data/team";
import { getViewer } from "@/lib/data/viewer";
import { todayInRecife } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { scheduleSummary } from "@/lib/schedule";

export const metadata: Metadata = { title: m.classes.title };

const situations: ClassSituation[] = ["current", "upcoming", "past", "all"];

function href(situation: ClassSituation, unit: string | null) {
  const params = new URLSearchParams();
  if (situation !== "current") params.set("situacao", situation);
  if (unit) params.set("unidade", unit);
  const query = params.toString();
  return (query ? `/turmas?${query}` : "/turmas") as Route;
}

export default async function ClassesPage({
  searchParams,
}: PageProps<"/turmas">) {
  const params = await searchParams;
  const situation = parseSituation(params.situacao);
  const [viewer, classes, units] = await Promise.all([
    getViewer(),
    getClasses(),
    getUnits(),
  ]);
  const visibleUnits = viewer.isAdminGeral
    ? units
    : units.filter((unit) =>
        viewer.memberships.some((row) => row.unit.id === unit.id),
      );
  const unitCode =
    typeof params.unidade === "string" &&
    visibleUnits.some((unit) => unit.code === params.unidade)
      ? params.unidade
      : null;
  const today = todayInRecife();
  const shown = classes.filter(
    (row) =>
      matchesSituation(classPhase(row, today), situation) &&
      (!unitCode || row.unit_code === unitCode),
  );
  const newClass = (
    <Link href="/turmas/nova" className={buttonVariants({ size: "lg" })}>
      <PlusIcon aria-hidden="true" />
      {m.classes.new}
    </Link>
  );

  return (
    <div data-wide className="flex flex-col">
      <PageHeader title={m.classes.title} action={newClass} />
      {classes.length === 0 ? (
        <EmptyState
          icon={UsersRoundIcon}
          title={m.classes.emptyTitle}
          description={m.classes.emptyDescription}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <FilterLinks
              label={m.classes.situation}
              items={situations.map((option) => ({
                href: href(option, unitCode),
                label: m.classes.situations[option],
                current: option === situation,
              }))}
            />
            {visibleUnits.length > 1 && (
              <FilterLinks
                label={m.classes.unit}
                items={[
                  {
                    href: href(situation, null),
                    label: m.classes.allUnits,
                    current: unitCode === null,
                  },
                  ...visibleUnits.map((unit) => ({
                    href: href(situation, unit.code),
                    label: unit.name,
                    current: unit.code === unitCode,
                  })),
                ]}
              />
            )}
          </div>
          {shown.length === 0 ? (
            <p className="rounded-2xl bg-card p-5 text-subhead text-muted-foreground">
              {m.classes.emptyFiltered}
            </p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {shown.map((row) => (
                <li key={row.id}>
                  <Link
                    href={`/turmas/${row.id}`}
                    className="flex h-full flex-col gap-2 rounded-2xl bg-card p-4 transition-colors hover:bg-card/70"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="flex min-w-0 flex-col">
                        <span className="text-footnote text-muted-foreground">
                          {row.course_name}
                        </span>
                        <span className="text-headline font-semibold">
                          {row.name}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-caption font-semibold">
                        {row.unit_code}
                      </span>
                    </span>
                    <span className="text-subhead">
                      {scheduleSummary(row.slots)}
                    </span>
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <ClassStatus
                        phase={classPhase(row, today)}
                        startsOn={row.starts_on}
                      />
                      <span className="text-footnote text-muted-foreground tabular-nums">
                        {m.classes.students(row.active_count, row.capacity)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
