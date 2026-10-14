import { addMonths, daysBetween, monthsBetween } from "@/lib/dates";

const maxMonths = 600;

export const paceMonths = 6;

export type Pace = { cents: number; months: number };

export function historyPace(
  nets: Map<string, number>,
  firstMonth: string | null,
  currentMonth: string,
): Pace | null {
  if (!firstMonth || firstMonth >= currentMonth) return null;
  const earliest = addMonths(currentMonth, -paceMonths);
  const from = firstMonth > earliest ? firstMonth : earliest;
  const months = monthsBetween(from, currentMonth);
  let total = 0;
  for (let index = 0; index < months; index += 1) {
    total += nets.get(addMonths(from, index)) ?? 0;
  }
  return { cents: Math.round(total / months), months };
}

export function reachMonth(
  remaining: number,
  pace: number,
  currentMonth: string,
) {
  if (remaining <= 0) return currentMonth;
  if (pace <= 0) return null;
  const months = Math.ceil(remaining / pace);
  return months > maxMonths ? null : addMonths(currentMonth, months - 1);
}

export function neededToReach(
  remaining: number,
  targetDate: string,
  today: string,
) {
  if (remaining <= 0 || targetDate < today) return null;
  const deposits = monthsBetween(today.slice(0, 7), targetDate.slice(0, 7)) + 1;
  return Math.ceil(remaining / deposits / 100) * 100;
}

export function expectedByNow(
  start: { on: string; cents: number },
  target: { on: string; cents: number },
  today: string,
) {
  const total = daysBetween(start.on, target.on);
  if (total <= 0) return target.cents;
  const elapsed = Math.min(Math.max(daysBetween(start.on, today), 0), total);
  return Math.round(
    start.cents + ((target.cents - start.cents) * elapsed) / total,
  );
}

export type JarStatus = "done" | "on-track" | "behind";

export function forecastJar({
  target,
  targetDate,
  planned,
  start,
  balance,
  nets,
  firstMonth,
  today,
}: {
  target: number | null;
  targetDate: string | null;
  planned: number | null;
  start: { on: string; cents: number };
  balance: number;
  nets: Map<string, number>;
  firstMonth: string | null;
  today: string;
}) {
  const currentMonth = today.slice(0, 7);
  const history = historyPace(nets, firstMonth, currentMonth);
  const pace = history ?? (planned ? { cents: planned, months: 0 } : null);
  if (target === null)
    return {
      pace,
      status: null,
      eta: null,
      needed: null,
      deadline: null,
      monthsLate: null,
    };

  const remaining = target - balance;
  const openDate =
    targetDate !== null && targetDate >= today ? targetDate : null;
  const deadline = openDate?.slice(0, 7) ?? null;
  const eta =
    remaining > 0 && pace
      ? reachMonth(remaining, pace.cents, currentMonth)
      : null;
  const monthsLate =
    deadline !== null && eta !== null ? monthsBetween(deadline, eta) : null;
  const status: JarStatus | null =
    remaining <= 0
      ? "done"
      : targetDate === null
        ? null
        : pace
          ? monthsLate !== null && monthsLate <= 0
            ? "on-track"
            : "behind"
          : balance >=
              expectedByNow(start, { on: targetDate, cents: target }, today)
            ? "on-track"
            : "behind";

  return {
    pace,
    status,
    eta,
    needed:
      openDate === null ? null : neededToReach(remaining, openDate, today),
    deadline,
    monthsLate,
  };
}
