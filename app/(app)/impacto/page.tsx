import { PrinterIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell/page-header";
import { ClassRanking } from "@/components/impact/class-ranking";
import { ImpactFilters } from "@/components/impact/impact-filters";
import { MonthlyCharts } from "@/components/impact/monthly-charts";
import {
  ImpactStats,
  Methodology,
  monthPoints,
  ProfileCharts,
  SectionTitle,
} from "@/components/impact/sections";
import { buttonVariants } from "@/components/ui/button";
import { loadImpact } from "@/lib/data/impact";
import { m } from "@/lib/i18n";

const i = m.impact;

export const metadata: Metadata = { title: i.title };

export default async function ImpactPage({
  searchParams,
}: PageProps<"/impacto">) {
  const impact = await loadImpact(await searchParams);
  const { report } = impact;
  const query = new URLSearchParams({ periodo: impact.period.key });
  if (impact.unitId) query.set("unidade", impact.unitId);
  if (impact.classId) query.set("turma", impact.classId);

  return (
    <div data-wide className="flex flex-col">
      <PageHeader
        title={i.title}
        subtitle={i.intro}
        action={
          <Link
            href={`/impacto/relatorio?${query}` as Route}
            aria-label={i.report}
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            <PrinterIcon aria-hidden="true" />
            <span className="hidden sm:inline">{i.report}</span>
          </Link>
        }
      />
      <div className="flex flex-col gap-10">
        <ImpactFilters
          periods={impact.periods}
          period={impact.period.key}
          units={impact.units}
          unitId={impact.unitId}
          classes={impact.classes}
          classId={impact.classId}
        />
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
          <SectionTitle id="mes-a-mes" title={i.monthly} hint={i.monthlyHint} />
          <MonthlyCharts months={monthPoints(report, impact.today)} />
        </section>
        {!impact.classId && (
          <section aria-labelledby="turmas" className="flex flex-col gap-3">
            <SectionTitle id="turmas" title={i.classes} hint={i.classesHint} />
            <ClassRanking groups={report.by_class} linkable />
          </section>
        )}
        {impact.units.length > 1 && !impact.unitId && (
          <section aria-labelledby="unidades" className="flex flex-col gap-3">
            <SectionTitle id="unidades" title={i.units} />
            <ClassRanking
              groups={report.by_unit}
              linkable={false}
              sortable={false}
            />
          </section>
        )}
        <section aria-labelledby="perfil" className="flex flex-col gap-3">
          <SectionTitle
            id="perfil"
            title={i.profile}
            hint={i.profileHint(report.profiled, report.served)}
          />
          <ProfileCharts report={report} />
          <p className="text-footnote text-muted-foreground">{i.hiddenNote}</p>
        </section>
        <Methodology />
      </div>
    </div>
  );
}
