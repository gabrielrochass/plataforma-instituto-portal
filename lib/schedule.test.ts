import { describe, expect, it } from "vitest";
import {
  formatTime,
  generateSessions,
  isValidSlot,
  planReschedule,
  scheduleSummary,
  weekdayOf,
  workloadMinutes,
} from "./schedule";

const evening = { startsAt: "19:00", endsAt: "21:00" };

describe("weekdayOf", () => {
  it("uses ISO weekdays with Monday as 1", () => {
    expect(weekdayOf("2026-10-12")).toBe(1);
    expect(weekdayOf("2026-10-18")).toBe(7);
  });
});

describe("generateSessions", () => {
  it("creates one session per chosen weekday and skips holidays and closures", () => {
    const { included, excluded } = generateSessions({
      startsOn: "2026-10-12",
      endsOn: "2026-10-25",
      slots: [
        { weekday: 1, ...evening },
        { weekday: 3, ...evening },
      ],
      closures: [
        { startsOn: "2026-10-19", endsOn: "2026-10-19", reason: "Recesso" },
      ],
      holidays: new Map([["2026-10-14", "Feriado de teste"]]),
    });
    expect(included.map((session) => session.heldOn)).toEqual([
      "2026-10-12",
      "2026-10-21",
    ]);
    expect(excluded).toEqual([
      { heldOn: "2026-10-14", reason: "Feriado de teste" },
      { heldOn: "2026-10-19", reason: "Recesso" },
    ]);
    expect(workloadMinutes(included)).toBe(240);
  });

  it("allows two slots on the same day in time order", () => {
    const { included } = generateSessions({
      startsOn: "2026-10-12",
      endsOn: "2026-10-12",
      slots: [
        { weekday: 1, startsAt: "14:00", endsAt: "15:00" },
        { weekday: 1, startsAt: "08:00", endsAt: "10:00" },
      ],
      closures: [],
      holidays: new Map(),
    });
    expect(included.map((session) => session.startsAt)).toEqual([
      "08:00",
      "14:00",
    ]);
  });
});

describe("slots", () => {
  it("rejects a session that ends before it starts", () => {
    expect(isValidSlot({ weekday: 2, ...evening })).toBe(true);
    expect(
      isValidSlot({ weekday: 2, startsAt: "21:00", endsAt: "19:00" }),
    ).toBe(false);
    expect(isValidSlot({ weekday: 2, startsAt: "7:00", endsAt: "09:00" })).toBe(
      false,
    );
  });

  it("summarizes days that share a time", () => {
    expect(formatTime("08:30")).toBe("8h30");
    expect(formatTime("19:00")).toBe("19h");
    expect(
      scheduleSummary([
        { weekday: 4, ...evening },
        { weekday: 2, ...evening },
        { weekday: 6, startsAt: "08:00", endsAt: "12:00" },
      ]),
    ).toBe("Ter e Qui, 19h às 21h; Sáb, 8h às 12h");
  });
});

describe("planReschedule", () => {
  it("keeps the past and sessions with attendance, changes only the future", () => {
    const plan = planReschedule(
      [
        { id: "a", heldOn: "2026-10-05", ...evening, locked: false },
        { id: "b", heldOn: "2026-10-19", ...evening, locked: true },
        { id: "c", heldOn: "2026-10-26", ...evening, locked: false },
      ],
      [
        { heldOn: "2026-10-20", ...evening },
        { heldOn: "2026-10-27", ...evening },
      ],
      "2026-10-14",
    );
    expect(plan.removed.map((session) => session.id)).toEqual(["c"]);
    expect(plan.added.map((session) => session.heldOn)).toEqual([
      "2026-10-20",
      "2026-10-27",
    ]);
  });
});
