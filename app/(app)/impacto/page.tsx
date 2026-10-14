import { PrinterIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell/page-header";
import { BarTrend } from "@/components/impact/bar-trend";
import { ImpactFilters } from "@/components/impact/impact-filters";
import {
  FunnelBreakdown,
  GroupTables,
  ImpactStats,
  Methodology,
  monthlyBars,
  OutcomeBreakdowns,
  ProfileBreakdowns,
} from "@/components/impact/sections";
import { buttonVariants } from "@/components/ui/button";
import { loadImpact } from "@/lib/data/impact";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.impact.title };

export default async function ImpactPage({
  searchParams,
}: PageProps<"/impacto">) {
  const impact = await loadImpact(await searchParams);
  const { report } = impact;
  const monthly = monthlyBars(report, impact.today);
  const query = new URLSearchParams({ periodo: impact.period.key });
  if (impact.unitId) query.set("unidade", impact.unitId);
  if (impact.courseId) query.set("curso", impact.courseId);

  return (
    <div data-wide className="flex flex-col">
      <PageHeader
        title={m.impact.title}
        action={
          <Link
            href={`/impacto/relatorio?${query}` as Route}
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            <PrinterIcon aria-hidden="true" />
            {m.impact.report}
          </Link>
        }
      />
      <div className="flex flex-col gap-8">
        <ImpactFilters
          periods={impact.periods}
          period={impact.period.key}
          units={impact.units}
          unitId={impact.unitId}
          courses={impact.courses}
          courseId={impact.courseId}
        />
        <ImpactStats
          report={report}
          previous={impact.previous}
          reference={impact.reference}
        />
        <section aria-labelledby="mes-a-mes" className="flex flex-col gap-3">
          <h2 id="mes-a-mes" className="text-title3 font-semibold">
            {m.impact.monthly}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <BarTrend
              title={m.impact.activeChart}
              bars={monthly.active}
              valueHeader={m.impact.people}
              note={monthly.hasPartial ? m.impact.partialMonth : undefined}
            />
            <BarTrend
              title={m.impact.attendanceChart}
              bars={monthly.attendance}
              max={100}
              valueHeader={m.impact.columns.attendance}
              note={monthly.hasPartial ? m.impact.partialMonth : undefined}
            />
          </div>
          <GroupTables report={report} showUnits={impact.units.length > 1} />
          <FunnelBreakdown report={report} />
        </section>
        <section aria-labelledby="perfil" className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 id="perfil" className="text-title3 font-semibold">
              {m.impact.profile}
            </h2>
            <p className="text-subhead text-muted-foreground">
              {m.impact.profileHint(report.profiled, report.served)}
            </p>
            <p className="text-footnote text-muted-foreground">
              {m.impact.hiddenNote}
            </p>
          </div>
          <ProfileBreakdowns report={report} />
          <OutcomeBreakdowns report={report} />
        </section>
        <Methodology />
      </div>
    </div>
  );
}
