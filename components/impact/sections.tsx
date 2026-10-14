import { BarList, type BarRow } from "@/components/impact/bar-list";
import type { MonthPoint } from "@/components/impact/monthly-charts";
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
  type ImpactReport,
  orderedCounts,
  percent,
} from "@/lib/impact";

const i = m.impact;

function rows(counts: Counts, labels: Record<string, string>): BarRow[] {
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

export function SectionTitle({
  id,
  title,
  hint,
}: {
  id: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <h2 id={id} className="text-title3 font-semibold">
        {title}
      </h2>
      {hint && <p className="text-subhead text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ImpactStats({
  report,
  previous,
}: {
  report: ImpactReport;
  previous?: ImpactReport;
}) {
  const finished = report.completed + report.failed + report.dropped_out;
  const completion = percent(report.completed, finished);
  const attendance = percent(report.attended, report.recorded);
  const dropoutRate = percent(report.dropped_out, finished);
  const compare = (
    count: (r: ImpactReport) => number,
  ): Comparison | undefined =>
    previous && compareCount(count(report), count(previous));
  const previousFinished = previous
    ? previous.completed + previous.failed + previous.dropped_out
    : 0;

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-3 print:grid-cols-3">
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
          compareRate(completion, percent(previous.completed, previousFinished))
        }
      />
      <StatTile
        label={i.stats.attendance}
        value={rateText(attendance)}
        detail={i.attendanceDetail}
        comparison={
          previous &&
          compareRate(attendance, percent(previous.attended, previous.recorded))
        }
      />
      <StatTile
        label={i.stats.hours}
        value={report.hours.toLocaleString("pt-BR")}
        detail={i.hoursDetail}
        comparison={compare((r) => r.hours)}
      />
      <StatTile
        label={i.stats.dropouts}
        value={report.dropped_out.toLocaleString("pt-BR")}
        detail={i.dropoutsDetail(rateText(dropoutRate))}
        comparison={compare((r) => r.dropped_out)}
        upIsGood={false}
      />
    </dl>
  );
}

export function monthPoints(report: ImpactReport, today: string): MonthPoint[] {
  const current = today.slice(0, 7);
  return report.monthly.map((month) => {
    const key = month.month.slice(0, 7);
    const future = key > current;
    return {
      key,
      short: formatShortMonth(month.month),
      full: formatMonth(key),
      active: future ? null : month.active,
      presence: percent(month.attended, month.recorded),
      partial: key === current,
    };
  });
}

export function ProfileCharts({ report }: { report: ImpactReport }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 print:grid-cols-2">
      <BarList
        title={i.dimensions.age}
        rows={rows(report.age, i.ages)}
        total={report.served}
      />
      <BarList
        title={i.dimensions.gender}
        rows={rows(report.gender, m.social.genders)}
        total={report.profiled}
      />
      <BarList
        title={i.dimensions.race_color}
        rows={rows(report.race_color, m.social.races)}
        total={report.profiled}
      />
      <BarList
        title={i.dimensions.income}
        rows={rows(report.income, i.incomes)}
        total={report.profiled}
      />
      <BarList
        title={i.dimensions.benefits}
        rows={rows(report.benefits, { yes: i.yes, no: i.no })}
        total={report.profiled}
      />
    </div>
  );
}

const positiveOutcomes = [
  "employed_formal",
  "employed",
  "internship",
  "studying",
  "self_employed",
];

export function AfterCourse({ report }: { report: ImpactReport }) {
  const outcomes = rows(report.outcomes, i.outcomes);
  const positive = outcomes.filter((row) => positiveOutcomes.includes(row.key));
  const positiveTotal = positive.every((row) => row.value !== null)
    ? positive.reduce((total, row) => total + (row.value ?? 0), 0)
    : null;
  const share =
    positiveTotal === null ? null : percent(positiveTotal, report.alumni);

  return (
    <div className="grid gap-3 md:grid-cols-2 print:grid-cols-2">
      <BarList
        title={i.alumni}
        hint={i.alumniHint(report.alumni)}
        headline={share === null ? undefined : i.alumniHeadline(share)}
        rows={outcomes}
        total={report.alumni}
      />
      <BarList
        title={i.exits}
        hint={i.exitsHint(report.dropped_out)}
        rows={rows(report.exit_reasons, m.enrollment.reasons)}
        total={report.dropped_out}
      />
    </div>
  );
}

export function Methodology({ open = false }: { open?: boolean }) {
  return (
    <details
      open={open}
      className="rounded-2xl bg-card px-4 break-inside-avoid"
    >
      <summary className="flex min-h-13 cursor-pointer items-center text-headline font-semibold">
        {i.methodology}
      </summary>
      <ul className="flex list-disc flex-col gap-2 pb-4 pl-5 text-subhead">
        {i.methods.map((method) => (
          <li key={method}>{method}</li>
        ))}
        <li>{i.hiddenNote}</li>
      </ul>
    </details>
  );
}
