import { describe, expect, it } from "vitest";
import {
  classDays,
  pendingDays,
  suggestedDay,
  weekdayOf,
  weekdaysSummary,
} from "./schedule";

const monWed = {
  starts_on: "2026-10-05",
  ends_on: "2026-12-18",
  weekdays: [1, 3],
};

describe("weekdayOf", () => {
  it("uses ISO weekdays with Monday as 1", () => {
    expect(weekdayOf("2026-10-12")).toBe(1);
    expect(weekdayOf("2026-10-18")).toBe(7);
  });
});

describe("weekdaysSummary", () => {
  it("lists the days in order", () => {
    expect(weekdaysSummary([5, 1, 3])).toBe("Seg, Qua e Sex");
    expect(weekdaysSummary([6])).toBe("Sáb");
  });
});

describe("classDays", () => {
  it("keeps the chosen weekdays inside the period and skips holidays", () => {
    expect(classDays(monWed, "2026-10-01", "2026-10-15")).toEqual([
      "2026-10-05",
      "2026-10-07",
      "2026-10-14",
    ]);
  });
});

describe("pendingDays", () => {
  it("lists recent class days without attendance", () => {
    expect(
      pendingDays(monWed, new Set(["2026-10-14"]), "2026-10-21", 9),
    ).toEqual(["2026-10-19", "2026-10-21"]);
  });
});

describe("suggestedDay", () => {
  it("picks today or the last class day", () => {
    expect(suggestedDay(monWed, "2026-10-14")).toBe("2026-10-14");
    expect(suggestedDay(monWed, "2026-10-16")).toBe("2026-10-14");
    expect(suggestedDay(monWed, "2026-09-01")).toBe("2026-10-05");
    expect(suggestedDay(monWed, "2027-01-10")).toBe("2026-12-16");
  });
});
