import { addMonths } from "@/lib/dates";

export type Counts = Record<string, number | null>;

export type ImpactGroup = {
  id: string;
  name: string;
  code?: string;
  served: number;
  completed: number;
  finished: number;
  attended: number;
  recorded: number;
};

export type ImpactMonth = {
  month: string;
  active: number;
  attended: number;
  recorded: number;
};

export type ImpactReport = {
  served: number;
  enrollments: number;
  transfers: number;
  completed: number;
  failed: number;
  dropped_out: number;
  attended: number;
  recorded: number;
  minutes: number;
  requests: number;
  requests_converted: number;
  requests_completed: number;
  exit_reasons: Counts;
  monthly: ImpactMonth[];
  by_course: ImpactGroup[];
  by_unit: ImpactGroup[];
  profiled: number;
  age: Counts;
  gender: Counts;
  race_color: Counts;
  income: Counts;
  benefits: Counts;
  alumni: number;
  outcomes: Counts;
};

export type Period = {
  key: string;
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
};

export const lastTwelveMonths = "12m";

export function periodKeys(today: string) {
  const year = Number(today.slice(0, 4));
  return [lastTwelveMonths, String(year), String(year - 1), String(year - 2)];
}

export function resolvePeriod(value: unknown, today: string): Period {
  const key =
    typeof value === "string" && periodKeys(today).includes(value)
      ? value
      : lastTwelveMonths;
  if (key === lastTwelveMonths) {
    const month = today.slice(0, 7);
    const from = `${addMonths(month, -11)}-01`;
    return {
      key,
      from,
      to: `${addMonths(month, 1)}-01`,
      previousFrom: `${addMonths(month, -23)}-01`,
      previousTo: from,
    };
  }
  const year = Number(key);
  return {
    key,
    from: `${year}-01-01`,
    to: `${year + 1}-01-01`,
    previousFrom: `${year - 1}-01-01`,
    previousTo: `${year}-01-01`,
  };
}

export function percent(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 100) : null;
}

export function hoursOf(minutes: number) {
  return Math.round(minutes / 60);
}

export function orderedCounts(counts: Counts, order: readonly string[]) {
  return order
    .filter((key) => key in counts)
    .map((key) => ({ key, value: counts[key] }));
}

export function hiddenCount(counts: Counts) {
  return Object.values(counts).filter((value) => value === null).length;
}
