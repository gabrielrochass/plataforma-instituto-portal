import { ChevronLeftIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { PrintButton } from "@/components/app-shell/print-button";
import { PortalLogo } from "@/components/brand/portal-logo";
import { BarTrend } from "@/components/impact/bar-trend";
import {
  FunnelBreakdown,
  GroupTables,
  ImpactStats,
  Methodology,
  monthlyBars,
  OutcomeBreakdowns,
  ProfileBreakdowns,
} from "@/components/impact/sections";
import { loadImpact } from "@/lib/data/impact";
import { addDays, formatFullDate } from "@/lib/dates";
import { legal, m } from "@/lib/i18n";
import { lastTwelveMonths } from "@/lib/impact";

export const metadata: Metadata = { title: m.impact.reportTitle };

export default async function ImpactReportPage({
  searchParams,
}: PageProps<"/impacto/relatorio">) {
  const impact = await loadImpact(await searchParams);
  const { report, period } = impact;
  const monthly = monthlyBars(report, impact.today);
  const query = new URLSearchParams({ periodo: period.key });
  if (impact.unitId) query.set("unidade", impact.unitId);
  if (impact.classId) query.set("turma", impact.classId);
  const scope = [
    period.key === lastTwelveMonths ? m.impact.lastTwelveMonths : period.key,
    impact.unit?.name ?? m.impact.allUnits,
    impact.selectedClass?.name ?? m.impact.allClasses,
  ].join(", ");

  return (
    <article className="mx-auto flex max-w-[210mm] flex-col gap-6 print:max-w-none">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/impacto?${query}` as Route}
          className="-ml-1 flex min-h-11 items-center gap-0.5 text-body text-link"
        >
          <ChevronLeftIcon aria-hidden="true" className="size-5" />
          {m.impact.backToPanel}
        </Link>
        <PrintButton />
      </div>
      <header className="flex items-start gap-4 border-b pb-4">
        <PortalLogo className="h-14 w-auto shrink-0 text-foreground" />
        <div className="flex flex-col gap-1">
          <h1 className="text-title1 font-bold tracking-tight">
            {m.impact.reportTitle}
          </h1>
          <p className="text-subhead">
            {legal.controller.name}, CNPJ {legal.controller.cnpj}
          </p>
          <p className="text-subhead text-muted-foreground">
            {m.impact.range(
              formatFullDate(period.from),
              formatFullDate(addDays(period.to, -1)),
            )}
          </p>
          <p className="text-subhead text-muted-foreground">
            {m.impact.scope}: {scope}
          </p>
        </div>
      </header>
      <ImpactStats
        report={report}
        previous={impact.previous}
        reference={impact.reference}
      />
      <section aria-labelledby="mes-a-mes" className="flex flex-col gap-3">
        <h2 id="mes-a-mes" className="text-title3 font-semibold">
          {m.impact.monthly}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 print:grid-cols-2">
          <BarTrend
            title={m.impact.activeChart}
            bars={monthly.active}
            valueHeader={m.impact.people}
          />
          <BarTrend
            title={m.impact.attendanceChart}
            bars={monthly.attendance}
            max={100}
            valueHeader={m.impact.columns.attendance}
          />
        </div>
        {monthly.hasPartial && (
          <p className="text-footnote text-muted-foreground">
            {m.impact.partialMonth}
          </p>
        )}
        <GroupTables report={report} showUnits={impact.units.length > 1} />
        <FunnelBreakdown report={report} />
      </section>
      <section
        aria-labelledby="perfil"
        className="flex flex-col gap-3 print:break-before-page"
      >
        <div className="flex flex-col gap-0.5">
          <h2 id="perfil" className="text-title3 font-semibold">
            {m.impact.profile}
          </h2>
          <p className="text-subhead text-muted-foreground">
            {m.impact.profileHint(report.profiled, report.served)}
          </p>
        </div>
        <ProfileBreakdowns report={report} />
        <OutcomeBreakdowns report={report} />
      </section>
      <Methodology />
      <p className="text-footnote text-muted-foreground">
        {m.impact.generatedOn(formatFullDate(impact.today))}
      </p>
    </article>
  );
}
