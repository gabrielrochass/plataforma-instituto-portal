import {
  AccessibilityIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  GraduationCapIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import type { Metadata, Route } from "next";
import Form from "next/form";
import Link from "next/link";
import { EmptyState } from "@/components/app-shell/empty-state";
import { FilterLinks } from "@/components/app-shell/filter-links";
import { PageHeader } from "@/components/app-shell/page-header";
import { PersonAvatar } from "@/components/app-shell/person-avatar";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getStudents, type StudentSituation } from "@/lib/data/students";
import { getViewer } from "@/lib/data/viewer";
import { todayInRecife } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { ageOn, displayName } from "@/lib/people";
import { can } from "@/lib/roles";

export const metadata: Metadata = { title: m.students.title };

const situations: StudentSituation[] = ["active", "all", "pending"];

function parseSituation(value: unknown): StudentSituation {
  return value === "all" || value === "pending" ? value : "active";
}

function href(situation: StudentSituation, query: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (situation !== "active") params.set("situacao", situation);
  const search = params.toString();
  return (search ? `/alunos?${search}` : "/alunos") as Route;
}

export default async function StudentsPage({
  searchParams,
}: PageProps<"/alunos">) {
  const params = await searchParams;
  const viewer = await getViewer();
  const query =
    typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  const situation = parseSituation(params.situacao);
  const admin = can.manageTeam(viewer);
  const students = await getStudents({
    query,
    unitId: null,
    situation: !admin && situation === "pending" ? "active" : situation,
  });
  const today = todayInRecife();
  const newStudent = (
    <Link href="/alunos/novo" className={buttonVariants({ size: "lg" })}>
      <PlusIcon aria-hidden="true" />
      {m.students.new}
    </Link>
  );

  return (
    <>
      <PageHeader title={m.students.title} action={newStudent} />
      <div className="flex flex-col gap-5">
        <Form action="/alunos" role="search" className="relative">
          <label htmlFor="busca-aluno" className="sr-only">
            {m.students.search}
          </label>
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="busca-aluno"
            name="q"
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            defaultValue={query}
            placeholder={m.students.searchPlaceholder}
            className="h-12 bg-card pl-10 dark:bg-card"
          />
          {situation !== "active" && (
            <input type="hidden" name="situacao" value={situation} />
          )}
        </Form>
        <FilterLinks
          label={m.students.situation}
          items={situations
            .filter((option) => admin || option !== "pending")
            .map((option) => ({
              href: href(option, query),
              label: m.students.situations[option],
              current: option === situation,
            }))}
        />
        {students.length === 0 ? (
          query ? (
            <p className="rounded-2xl bg-card p-5 text-subhead text-muted-foreground">
              {m.students.noResults(query)}
            </p>
          ) : (
            <EmptyState
              icon={GraduationCapIcon}
              title={m.students.emptyTitle}
              description={m.students.emptyDescription}
            />
          )
        ) : (
          <ul className="divide-y overflow-hidden rounded-2xl bg-card">
            {students.map((student) => {
              const name = displayName(student);
              return (
                <li key={student.id}>
                  <Link
                    href={`/alunos/${student.id}` as Route}
                    className="flex min-h-15 items-center gap-3 px-4 py-2 transition-colors hover:bg-muted/60 focus-visible:-outline-offset-2!"
                  >
                    <PersonAvatar name={name} photo={student.photo} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-body font-medium">{name}</span>
                      <span className="flex flex-wrap items-center gap-x-2 text-footnote text-muted-foreground">
                        <span className="tabular-nums">
                          {`${m.students.age(ageOn(student.birth_date, today))}, ${student.unit_code}, ${m.students.activeClasses(student.active_count)}`}
                        </span>
                        {student.needs_accessibility && (
                          <span className="inline-flex items-center gap-1 text-link">
                            <AccessibilityIcon
                              aria-hidden="true"
                              className="size-4"
                            />
                            {m.students.accessibility}
                          </span>
                        )}
                        {admin && student.social_pending && (
                          <span className="inline-flex items-center gap-1 text-warning">
                            <ClipboardListIcon
                              aria-hidden="true"
                              className="size-4"
                            />
                            {m.students.pendingSocial}
                          </span>
                        )}
                      </span>
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
        )}
      </div>
    </>
  );
}
