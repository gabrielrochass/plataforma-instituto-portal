import { m } from "@/lib/i18n";

const TIME_ZONE = "America/Sao_Paulo";

const isoDateInSaoPaulo = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
});

const monthName = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const monthOnly = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  timeZone: "UTC",
});

const shortMonthName = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  timeZone: "UTC",
});

const dayHeading = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const dayHeadingWithYear = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const dayMonth = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const dayMonthYear = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const fullDate = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const shortDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});

const pad = (value: number) => String(value).padStart(2, "0");

function toUtc(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function fromUtc(time: number) {
  const date = new Date(time);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function todayInSaoPaulo(now = new Date()) {
  return isoDateInSaoPaulo.format(now);
}

export function localToday(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDays(isoDate: string, delta: number) {
  return fromUtc(toUtc(isoDate) + delta * 86_400_000);
}

export function daysBetween(from: string, to: string) {
  return Math.round((toUtc(to) - toUtc(from)) / 86_400_000);
}

export function monthsBetween(from: string, to: string) {
  const [fromYear, fromMonth] = from.split("-").map(Number);
  const [toYear, toMonth] = to.split("-").map(Number);
  return (toYear - fromYear) * 12 + (toMonth - fromMonth);
}

export function addMonths(month: string, delta: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const index = year * 12 + (monthNumber - 1) + delta;
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`;
}

export function parseMonth(value: unknown) {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
    ? value
    : null;
}

export function daysInMonth(month: string) {
  return Number(addDays(`${addMonths(month, 1)}-01`, -1).slice(8));
}

export function monthRange(month: string) {
  return { from: `${month}-01`, to: `${addMonths(month, 1)}-01` };
}

export function formatMonth(month: string) {
  return monthName.format(toUtc(`${month}-01`));
}

export function formatMonthName(month: string) {
  return monthOnly.format(toUtc(`${month}-01`));
}

export function formatShortMonth(isoDate: string) {
  return shortMonthName.format(toUtc(isoDate)).replace(".", "");
}

export function formatDate(isoDate: string, today: string) {
  const format =
    isoDate.slice(0, 4) === today.slice(0, 4) ? dayMonth : dayMonthYear;
  return format.format(toUtc(isoDate));
}

export function formatFullDate(isoDate: string) {
  return fullDate.format(toUtc(isoDate));
}

export function formatShortDate(isoDate: string) {
  return shortDate.format(toUtc(isoDate));
}

export function formatDayHeading(isoDate: string, today: string) {
  if (isoDate === today) return m.transactions.today;
  if (isoDate === addDays(today, -1)) return m.transactions.yesterday;
  const format =
    isoDate.slice(0, 4) === today.slice(0, 4) ? dayHeading : dayHeadingWithYear;
  return format.format(toUtc(isoDate));
}
