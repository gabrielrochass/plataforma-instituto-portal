import type { TrendBar } from "@/components/impact/bar-trend";
import { Breakdown, type BreakdownRow } from "@/components/impact/breakdown";
import { GroupTable } from "@/components/impact/group-table";
import {
  type Comparison,
  compareCount,
  compareRate,
  StatTile,
} from "@/components/impact/stat-tile";
import { formatMonth, formatShortMonth } from "@/lib/dates";
import { m } from "@/lib/i18n";
import {
  type Counts,
  hoursOf,
  type ImpactReport,
  orderedCounts,
  percent,
} from "@/lib/impact";

const i = m.impact;

function rows(counts: Counts, labels: Record<string, string>): BreakdownRow[] {
  const order = [...new Set([...Object.keys(labels), "unknown"])];
  return orderedCounts(counts, order).map(({ key, value }) => ({
    key,
    label: labels[key] ?? i.unknown,
    value,
  }));
}

function rateText(value: number | null) {
  return value === null ? i.noBase : i.percent(value);
}

export function ImpactStats({
  report,
  previous,
  reference,
}: {
  report: ImpactReport;
  previous?: ImpactReport;
  reference: string;
}) {
  const finished = report.completed + report.failed + report.dropped_out;
  const completion = percent(report.completed, finished);
  const attendance = percent(report.attended, report.recorded);
  const dropoutRate = percent(report.dropped_out, finished);
  const compare = (
    count: (r: ImpactReport) => number,
  ): Comparison | undefined =>
    previous && compareCount(count(report), count(previous), reference);
  const previousFinished = previous
    ? previous.completed + previous.failed + previous.dropped_out
    : 0;

  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3">
      <StatTile
        label={i.stats.served}
        value={report.served.toLocaleString("pt-BR")}
        detail={i.servedDetail}
        comparison={compare((r) => r.served)}
      />
      <StatTile
        label={i.stats.enrollments}
        value={report.enrollments.toLocaleString("pt-BR")}
        detail={i.enrollmentsDetail(report.transfers)}
        comparison={compare((r) => r.enrollments)}
      />
      <StatTile
        label={i.stats.completion}
        value={rateText(completion)}
        detail={i.completionDetail(report.completed, finished)}
        comparison={
          previous &&
          compareRate(
            completion,
            percent(previous.completed, previousFinished),
            reference,
          )
        }
      />
      <StatTile
        label={i.stats.attendance}
        value={rateText(attendance)}
        detail={i.attendanceDetail(report.recorded)}
        comparison={
          previous &&
          compareRate(
            attendance,
            percent(previous.attended, previous.recorded),
            reference,
          )
        }
      />
      <StatTile
        label={i.stats.hours}
        value={hoursOf(report.minutes).toLocaleString("pt-BR")}
        detail={i.hoursDetail}
        comparison={compare((r) => hoursOf(r.minutes))}
      />
      <StatTile
        label={i.stats.dropouts}
        value={report.dropped_out.toLocaleString("pt-BR")}
        detail={i.dropoutsDetail(rateText(dropoutRate))}
        comparison={compare((r) => r.dropped_out)}
      />
    </dl>
  );
}

export function monthlyBars(report: ImpactReport, today: string) {
  const current = today.slice(0, 7);
  const base = report.monthly.map((month) => ({
    key: month.month,
    label: formatShortMonth(month.month),
    fullLabel: formatMonth(month.month.slice(0, 7)),
    partial: month.month.slice(0, 7) === current,
    future: month.month.slice(0, 7) > current,
  }));
  const active: TrendBar[] = report.monthly.map((month, index) => ({
    ...base[index],
    value: base[index].future ? null : month.active,
    display: base[index].future
      ? i.noClasses
      : month.active.toLocaleString("pt-BR"),
  }));
  const attendance: TrendBar[] = report.monthly.map((month, index) => {
    const value = percent(month.attended, month.recorded);
    return {
      ...base[index],
      value,
      display: value === null ? i.noClasses : i.percent(value),
    };
  });
  const hasPartial = base.some((month) => month.partial);
  return { active, attendance, hasPartial };
}

export function FunnelBreakdown({ report }: { report: ImpactReport }) {
  return (
    <Breakdown
      title={i.funnel}
      hint={i.funnelHint}
      total={report.requests}
      rows={[
        {
          key: "requests",
          label: i.funnelSteps.requests,
          value: report.requests,
        },
        {
          key: "converted",
          label: i.funnelSteps.converted,
          value: report.requests_converted,
        },
        {
          key: "completed",
          label: i.funnelSteps.completed,
          value: report.requests_completed,
        },
      ]}
    />
  );
}

export function ProfileBreakdowns({ report }: { report: ImpactReport }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 print:grid-cols-2">
      <Breakdown
        title={i.dimensions.age}
        rows={rows(report.age, i.ages)}
        total={report.served}
      />
      <Breakdown
        title={i.dimensions.gender}
        rows={rows(report.gender, m.social.genders)}
        total={report.profiled}
      />
      <Breakdown
        title={i.dimensions.race_color}
        rows={rows(report.race_color, m.social.races)}
        total={report.profiled}
      />
      <Breakdown
        title={i.dimensions.income}
        rows={rows(report.income, i.incomes)}
        total={report.profiled}
      />
      <Breakdown
        title={i.dimensions.benefits}
        rows={rows(report.benefits, { yes: i.yes, no: i.no })}
        total={report.profiled}
      />
    </div>
  );
}

export function OutcomeBreakdowns({ report }: { report: ImpactReport }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 print:grid-cols-2">
      <Breakdown
        title={i.alumni}
        hint={i.alumniHint(report.alumni)}
        rows={rows(report.outcomes, i.outcomes)}
        total={report.alumni}
      />
      <Breakdown
        title={i.exits}
        hint={i.exitsHint(report.dropped_out)}
        rows={rows(report.exit_reasons, m.enrollment.reasons)}
        total={report.dropped_out}
      />
    </div>
  );
}

export function GroupTables({
  report,
  showUnits,
}: {
  report: ImpactReport;
  showUnits: boolean;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 print:grid-cols-1">
      <GroupTable
        title={i.byCourse}
        nameHeader={i.columns.course}
        groups={report.by_course}
      />
      {showUnits && (
        <GroupTable
          title={i.byUnit}
          nameHeader={i.columns.unit}
          groups={report.by_unit}
        />
      )}
    </div>
  );
}

export function Methodology() {
  return (
    <section
      aria-labelledby="como-calculamos"
      className="flex flex-col gap-3 rounded-2xl bg-card p-4 break-inside-avoid"
    >
      <h2 id="como-calculamos" className="text-title3 font-semibold">
        {i.methodology}
      </h2>
      <ul className="flex list-disc flex-col gap-2 pl-5 text-subhead">
        {i.methods.map((method) => (
          <li key={method}>{method}</li>
        ))}
        <li>{i.hiddenNote}</li>
      </ul>
    </section>
  );
}
