import { ChevronLeftIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { PrintButton } from "@/components/app-shell/print-button";
import { PortalLogo } from "@/components/brand/portal-logo";
import { ClassRanking } from "@/components/impact/class-ranking";
import { MonthlyCharts } from "@/components/impact/monthly-charts";
import {
  ImpactStats,
  Methodology,
  monthPoints,
  ProfileCharts,
  SectionTitle,
} from "@/components/impact/sections";
import { loadImpact } from "@/lib/data/impact";
import { addDays, formatFullDate } from "@/lib/dates";
import { legal, m } from "@/lib/i18n";
import { lastTwelveMonths } from "@/lib/impact";

const i = m.impact;

export const metadata: Metadata = { title: i.reportTitle };

export default async function ImpactReportPage({
  searchParams,
}: PageProps<"/impacto/relatorio">) {
  const impact = await loadImpact(await searchParams);
  const { report, period } = impact;
  const query = new URLSearchParams({ periodo: period.key });
  if (impact.unitId) query.set("unidade", impact.unitId);
  if (impact.classId) query.set("turma", impact.classId);
  const scope = [
    period.key === lastTwelveMonths ? i.lastTwelveMonths : period.key,
    impact.unit?.name ?? i.allUnits,
    impact.selectedClass?.name ?? i.allClasses,
  ].join(", ");

  return (
    <article className="mx-auto flex max-w-[210mm] flex-col gap-8 print:max-w-none">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/impacto?${query}` as Route}
          className="-ml-1 flex min-h-11 items-center gap-0.5 text-body text-link"
        >
          <ChevronLeftIcon aria-hidden="true" className="size-5" />
          {i.backToPanel}
        </Link>
        <PrintButton />
      </div>
      <header className="flex items-start gap-4 border-b pb-4">
        <PortalLogo className="h-14 w-auto shrink-0 text-foreground" />
        <div className="flex flex-col gap-1">
          <h1 className="text-title1 font-bold tracking-tight">
            {i.reportTitle}
          </h1>
          <p className="text-subhead">
            {legal.controller.name}, CNPJ {legal.controller.cnpj}
          </p>
          <p className="text-subhead text-muted-foreground">
            {i.range(
              formatFullDate(period.from),
              formatFullDate(addDays(period.to, -1)),
            )}
          </p>
          <p className="text-subhead text-muted-foreground">
            {i.scope}: {scope}
          </p>
        </div>
      </header>
      <section aria-labelledby="resumo" className="flex flex-col gap-3">
        <SectionTitle
          id="resumo"
          title={i.summary}
          hint={i.compared(impact.reference)}
        />
        <ImpactStats
          report={report}
          previous={impact.previous}
          reference={impact.reference}
        />
      </section>
      <section aria-labelledby="mes-a-mes" className="flex flex-col gap-3">
        <SectionTitle id="mes-a-mes" title={i.monthly} />
        <MonthlyCharts months={monthPoints(report, impact.today)} />
      </section>
      {!impact.classId && (
        <section
          aria-labelledby="turmas"
          className="flex flex-col gap-3 print:break-before-page"
        >
          <SectionTitle id="turmas" title={i.classes} />
          <ClassRanking groups={report.by_class} linkable={false} />
        </section>
      )}
      <section
        aria-labelledby="perfil"
        className="flex flex-col gap-3 print:break-before-page"
      >
        <SectionTitle
          id="perfil"
          title={i.profile}
          hint={i.profileHint(report.profiled, report.served)}
        />
        <ProfileCharts report={report} />
      </section>
      <Methodology open />
      <p className="text-footnote text-muted-foreground">
        {i.generatedOn(formatFullDate(impact.today))}
      </p>
    </article>
  );
}
