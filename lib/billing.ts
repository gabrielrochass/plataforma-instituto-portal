import { addDays, addMonths, daysInMonth } from "@/lib/dates";

function clampedDay(month: string, day: number) {
  return addDays(`${month}-01`, Math.min(day, daysInMonth(month)) - 1);
}

export function billDates(
  bestDay: number,
  dueDay: number,
  purchasedOn: string,
  cycleOffset = 0,
) {
  const purchaseMonth = purchasedOn.slice(0, 7);
  const rollover = purchasedOn > clampedDay(purchaseMonth, bestDay - 1) ? 1 : 0;
  const closesOn = clampedDay(
    addMonths(purchaseMonth, cycleOffset + rollover),
    bestDay - 1,
  );

  const dueMonth = closesOn.slice(0, 7);
  let dueOn = clampedDay(dueMonth, dueDay);
  if (dueOn <= closesOn) dueOn = clampedDay(addMonths(dueMonth, 1), dueDay);

  return { closesOn, dueOn };
}
