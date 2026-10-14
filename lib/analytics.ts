import type { Route } from "next";
import { addMonths, daysInMonth } from "@/lib/dates";

export type MonthBar = { month: string; cents: number; tracked: boolean };

export function analysisHref(month: string) {
  return `/analises?mes=${month}` as const;
}

export function categoryHref(id: string, month: string) {
  return `/analises/categorias/${id}?mes=${month}` as Route;
}

export function sameDayLastMonth(today: string) {
  const previous = addMonths(today.slice(0, 7), -1);
  const day = Math.min(Number(today.slice(8, 10)), daysInMonth(previous));
  return `${previous}-${String(day).padStart(2, "0")}`;
}

export function sumThrough(byDay: Map<string, number>, lastDay: string) {
  let total = 0;
  for (const [day, cents] of byDay) if (day <= lastDay) total += cents;
  return total;
}

export function firstCompleteMonth(firstDay: string) {
  const month = firstDay.slice(0, 7);
  return firstDay.endsWith("-01") ? month : addMonths(month, 1);
}

export function canCompare(firstDay: string | null, month: string) {
  return (
    firstDay !== null && firstCompleteMonth(firstDay) <= addMonths(month, -1)
  );
}

export function monthBars(
  totals: Map<string, number>,
  lastMonth: string,
  firstDay: string | null,
): MonthBar[] {
  return Array.from({ length: 12 }, (_, index) => {
    const month = addMonths(lastMonth, index - 11);
    return {
      month,
      cents: totals.get(month) ?? 0,
      tracked: firstDay !== null && month >= firstDay.slice(0, 7),
    };
  });
}

export function monthlyAverage(
  bars: MonthBar[],
  firstDay: string | null,
  currentMonth: string,
) {
  if (firstDay === null) return null;
  const from = firstCompleteMonth(firstDay);
  const complete = bars.filter(
    (bar) => bar.month >= from && bar.month < currentMonth,
  );
  if (complete.length === 0) return null;
  return Math.round(
    complete.reduce((sum, bar) => sum + bar.cents, 0) / complete.length,
  );
}

export function percentOf(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}
