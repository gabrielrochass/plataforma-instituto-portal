import { addDays } from "@/lib/dates";
import { m } from "@/lib/i18n";

export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Slot = { weekday: Weekday; startsAt: string; endsAt: string };

export type Session = { heldOn: string; startsAt: string; endsAt: string };

export type Closure = { startsOn: string; endsOn: string; reason: string };

export const weekdays: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 7];

export const maxSessions = 400;

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export function weekdayOf(isoDate: string): Weekday {
  const [year, month, day] = isoDate.split("-").map(Number);
  const sundayFirst = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return (sundayFirst === 0 ? 7 : sundayFirst) as Weekday;
}

export function minutesOf(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function isValidSlot(slot: Slot) {
  return (
    timePattern.test(slot.startsAt) &&
    timePattern.test(slot.endsAt) &&
    minutesOf(slot.endsAt) > minutesOf(slot.startsAt)
  );
}

export function generateSessions({
  startsOn,
  endsOn,
  slots,
  closures,
  holidays,
}: {
  startsOn: string;
  endsOn: string;
  slots: readonly Slot[];
  closures: readonly Closure[];
  holidays: ReadonlyMap<string, string>;
}) {
  const included: Session[] = [];
  const excluded: { heldOn: string; reason: string }[] = [];
  const ordered = [...slots].sort(
    (a, b) =>
      a.weekday - b.weekday || minutesOf(a.startsAt) - minutesOf(b.startsAt),
  );

  for (let day = startsOn; day <= endsOn; day = addDays(day, 1)) {
    const daySlots = ordered.filter((slot) => slot.weekday === weekdayOf(day));
    if (daySlots.length === 0) continue;
    const closure = closures.find(
      (candidate) => candidate.startsOn <= day && day <= candidate.endsOn,
    );
    const reason = holidays.get(day) ?? closure?.reason;
    if (reason) {
      excluded.push({ heldOn: day, reason });
      continue;
    }
    for (const slot of daySlots) {
      included.push({
        heldOn: day,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
      });
    }
  }
  return { included, excluded };
}

export function workloadMinutes(sessions: readonly Session[]) {
  return sessions.reduce(
    (total, session) =>
      total + minutesOf(session.endsAt) - minutesOf(session.startsAt),
    0,
  );
}

export function formatTime(time: string) {
  const [hours, minutes] = time.split(":");
  return minutes === "00" ? `${Number(hours)}h` : `${Number(hours)}h${minutes}`;
}

export function scheduleSummary(slots: readonly Slot[]) {
  const groups = new Map<string, Weekday[]>();
  for (const slot of [...slots].sort((a, b) => a.weekday - b.weekday)) {
    const key = `${slot.startsAt}-${slot.endsAt}`;
    groups.set(key, [...(groups.get(key) ?? []), slot.weekday]);
  }
  return [...groups.entries()]
    .map(([key, days]) => {
      const [startsAt, endsAt] = key.split("-");
      return m.schedule.slot(
        days.map((day) => m.schedule.weekdaysShort[day - 1]),
        formatTime(startsAt),
        formatTime(endsAt),
      );
    })
    .join("; ");
}

export function planReschedule(
  existing: readonly (Session & { id: string; locked: boolean })[],
  generated: readonly Session[],
  from: string,
) {
  const key = (session: Session) =>
    `${session.heldOn} ${session.startsAt} ${session.endsAt}`;
  const current = new Set(existing.map(key));
  const wanted = new Set(
    generated.filter((session) => session.heldOn >= from).map(key),
  );
  return {
    removed: existing.filter(
      (session) =>
        session.heldOn >= from && !session.locked && !wanted.has(key(session)),
    ),
    added: generated.filter(
      (session) => session.heldOn >= from && !current.has(key(session)),
    ),
  };
}
