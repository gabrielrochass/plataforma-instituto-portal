import { addDays } from "@/lib/dates";
import { holidaysBetween } from "@/lib/holidays";
import { m } from "@/lib/i18n";

export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const weekdays: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 7];

type ClassDates = {
  starts_on: string;
  ends_on: string;
  weekdays: readonly number[];
};

export function weekdayOf(isoDate: string): Weekday {
  const [year, month, day] = isoDate.split("-").map(Number);
  const sundayFirst = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return (sundayFirst === 0 ? 7 : sundayFirst) as Weekday;
}

export function listText(items: readonly string[]) {
  return items.length > 1
    ? `${items.slice(0, -1).join(", ")} e ${items.at(-1)}`
    : (items[0] ?? "");
}

export function weekdaysSummary(days: readonly number[]) {
  return listText(
    [...days]
      .sort((a, b) => a - b)
      .map((day) => m.schedule.weekdaysShort[day - 1]),
  );
}

export function classDays(
  row: ClassDates,
  from: string,
  to: string,
  holidays: ReadonlyMap<string, string> = holidaysBetween(from, to),
) {
  const days: string[] = [];
  const start = from > row.starts_on ? from : row.starts_on;
  const end = to < row.ends_on ? to : row.ends_on;
  for (let day = start; day <= end; day = addDays(day, 1)) {
    if (row.weekdays.includes(weekdayOf(day)) && !holidays.has(day)) {
      days.push(day);
    }
  }
  return days;
}

export function pendingDays(
  row: ClassDates,
  taken: ReadonlySet<string>,
  today: string,
  lookback = 14,
) {
  return classDays(row, addDays(today, -lookback), today).filter(
    (day) => !taken.has(day),
  );
}

export function suggestedDay(row: ClassDates, today: string) {
  if (today < row.starts_on) return row.starts_on;
  const until = today < row.ends_on ? today : row.ends_on;
  return classDays(row, addDays(until, -14), until).at(-1) ?? until;
}

export function attendanceOverview(
  row: ClassDates,
  taken: ReadonlySet<string>,
  today: string,
) {
  const classToday = classDays(row, today, today).length > 0;
  return {
    classToday,
    takenToday: taken.has(today),
    pending: pendingDays(row, taken, today).filter((day) => day < today),
  };
}
