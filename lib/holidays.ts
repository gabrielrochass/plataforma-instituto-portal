import { addDays } from "@/lib/dates";
import { m } from "@/lib/i18n";

const pad = (value: number) => String(value).padStart(2, "0");

export function easter(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const n = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * n + 114) / 31);
  const day = ((h + l - 7 * n + 114) % 31) + 1;
  return `${year}-${pad(month)}-${pad(day)}`;
}

const fixed = [
  ["01-01", m.holidays.newYear],
  ["03-06", m.holidays.pernambuco],
  ["04-21", m.holidays.tiradentes],
  ["05-01", m.holidays.labor],
  ["06-24", m.holidays.saoJoao],
  ["07-16", m.holidays.carmo],
  ["09-07", m.holidays.independence],
  ["10-12", m.holidays.aparecida],
  ["11-02", m.holidays.souls],
  ["11-15", m.holidays.republic],
  ["11-20", m.holidays.blackConsciousness],
  ["12-08", m.holidays.conceicao],
  ["12-25", m.holidays.christmas],
] as const;

export function holidaysOf(year: number) {
  const sunday = easter(year);
  const found = new Map<string, string>(
    fixed.map(([day, name]) => [`${year}-${day}`, name]),
  );
  found.set(addDays(sunday, -48), m.holidays.carnival);
  found.set(addDays(sunday, -47), m.holidays.carnival);
  found.set(addDays(sunday, -2), m.holidays.goodFriday);
  found.set(addDays(sunday, 60), m.holidays.corpusChristi);
  return found;
}

export function holidaysBetween(from: string, to: string) {
  const found = new Map<string, string>();
  for (
    let year = Number(from.slice(0, 4));
    year <= Number(to.slice(0, 4));
    year++
  ) {
    for (const [day, name] of holidaysOf(year)) {
      if (day >= from && day <= to) found.set(day, name);
    }
  }
  return found;
}
