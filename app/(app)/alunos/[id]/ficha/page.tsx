import { CircleDotIcon, ClipboardListIcon, PlusIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { EmptyState } from "@/components/app-shell/empty-state";
import { OutcomeForm, OutcomeList } from "@/components/social/alumni-outcomes";
import {
  fieldLabels,
  fieldValue,
  identityLines,
} from "@/components/social/format";
import { StudentHeader } from "@/components/students/student-header";
import { buttonVariants } from "@/components/ui/button";
import { getAlumniOutcomes, getSocialProfiles } from "@/lib/data/social";
import { getStudent, getStudentCpf } from "@/lib/data/students";
import { formatFullDate, todayInRecife } from "@/lib/dates";
import { changedFields, comparedFields, perCapitaCents } from "@/lib/ficha";
import { m } from "@/lib/i18n";
import { formatBRL } from "@/lib/money";

export const metadata: Metadata = { title: m.social.title };

export default async function SocialProfilePage({
  params,
}: PageProps<"/alunos/[id]/ficha">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [student, access] = await Promise.all([
    getStudent(id),
    getStudentCpf(id),
  ]);
  if (!student || !access) notFound();
  const [profiles, outcomes] = await Promise.all([
    getSocialProfiles(id),
    getAlumniOutcomes(id),
  ]);
  const [latest, previous] = profiles;
  const changed = latest && previous ? changedFields(previous, latest) : [];
  const perCapita = latest ? perCapitaCents(latest) : null;
  const action = (
    <Link
      href={`/alunos/${id}/ficha/nova` as Route}
      className={buttonVariants({ size: "lg" })}
    >
      <PlusIcon aria-hidden="true" />
      {latest ? m.social.reassess : m.social.fill}
    </Link>
  );

  return (
    <>
      <StudentHeader student={student} today={todayInRecife()} showSocial />
      <div className="flex flex-col gap-8">
        <p className="text-footnote text-muted-foreground">{m.social.intro}</p>
        {!latest ? (
          <EmptyState
            icon={ClipboardListIcon}
            title={m.social.empty}
            description={m.social.intro}
            action={action}
          />
        ) : (
          <>
            <section aria-labelledby="atual" className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <h2 id="atual" className="text-title3 font-semibold">
                  {m.social.current(formatFullDate(latest.assessed_on))}
                </h2>
                {action}
              </div>
              <dl className="divide-y overflow-hidden rounded-2xl bg-card">
                <div className="flex flex-col gap-0.5 px-4 py-3">
                  <dt className="text-footnote font-medium text-muted-foreground">
                    {m.social.moment}
                  </dt>
                  <dd className="text-body">
                    {m.social.moments[latest.moment]}
                  </dd>
                </div>
                {comparedFields.map((field) => (
                  <div key={field} className="flex flex-col gap-0.5 px-4 py-3">
                    <dt className="text-footnote font-medium text-muted-foreground">
                      {fieldLabels[field]}
                    </dt>
                    <dd className="text-body tabular-nums">
                      {fieldValue(latest, field)}
                      {field === "household_income_cents" && perCapita !== null
                        ? `, ${m.social.perCapita(formatBRL(perCapita))}`
                        : ""}
                    </dd>
                  </div>
                ))}
                {identityLines(latest).map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-0.5 px-4 py-3">
                    <dt className="text-footnote font-medium text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="text-body whitespace-pre-line">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {previous && (
              <section
                aria-labelledby="comparacao"
                className="flex flex-col gap-3"
              >
                <h2 id="comparacao" className="px-1 text-title3 font-semibold">
                  {m.social.compare(
                    formatFullDate(previous.assessed_on),
                    formatFullDate(latest.assessed_on),
                  )}
                </h2>
                <ul className="divide-y overflow-hidden rounded-2xl bg-card">
                  {comparedFields.map((field) => {
                    const didChange = changed.includes(field);
                    return (
                      <li key={field} className="flex flex-col gap-1 px-4 py-3">
                        <span className="flex flex-wrap items-center gap-2 text-footnote font-medium text-muted-foreground">
                          {fieldLabels[field]}
                          {didChange && (
                            <span className="inline-flex items-center gap-1 text-link">
                              <CircleDotIcon
                                aria-hidden="true"
                                className="size-3.5"
                              />
                              {m.social.changed}
                            </span>
                          )}
                        </span>
                        <span className="grid grid-cols-2 gap-3 text-subhead tabular-nums">
                          <span>
                            <span className="sr-only">{`${m.social.before}: `}</span>
                            {fieldValue(previous, field)}
                          </span>
                          <span
                            className={didChange ? "font-semibold" : undefined}
                          >
                            <span className="sr-only">{`${m.social.after}: `}</span>
                            {fieldValue(latest, field)}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {profiles.length > 1 && (
              <section
                aria-labelledby="versoes"
                className="flex flex-col gap-3"
              >
                <h2 id="versoes" className="px-1 text-title3 font-semibold">
                  {m.social.versions}
                </h2>
                <ul className="divide-y overflow-hidden rounded-2xl bg-card">
                  {profiles.slice(1).map((profile) => (
                    <li key={profile.id} className="px-4 py-3 text-body">
                      {`${formatFullDate(profile.assessed_on)}, ${m.social.moments[profile.moment]}`}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        <section aria-labelledby="egressos" className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5 px-1">
            <h2 id="egressos" className="text-title3 font-semibold">
              {m.alumni.title}
            </h2>
            <p className="text-footnote text-muted-foreground">
              {m.alumni.intro}
            </p>
          </div>
          <OutcomeList
            items={outcomes.map((outcome) => ({
              id: outcome.id,
              kind: outcome.kind,
              date: formatFullDate(outcome.observed_on),
              detail: [
                formatFullDate(outcome.observed_on),
                outcome.organization,
                outcome.formal_job ? m.alumni.formalJob : null,
                outcome.related_to_course ? m.alumni.relatedToCourse : null,
              ]
                .filter(Boolean)
                .join(", "),
            }))}
          />
          <OutcomeForm studentId={id} />
        </section>
      </div>
    </>
  );
}
