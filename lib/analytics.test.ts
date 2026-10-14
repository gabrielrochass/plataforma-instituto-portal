import { describe, expect, it } from "vitest";
import {
  canCompare,
  firstCompleteMonth,
  monthBars,
  monthlyAverage,
  percentOf,
  sameDayLastMonth,
  sumThrough,
} from "@/lib/analytics";

describe("sameDayLastMonth", () => {
  it("keeps the day of the month", () => {
    expect(sameDayLastMonth("2026-10-05")).toBe("2026-09-05");
  });

  it("clamps to the end of a shorter month", () => {
    expect(sameDayLastMonth("2026-03-31")).toBe("2026-02-28");
    expect(sameDayLastMonth("2028-03-30")).toBe("2028-02-29");
  });

  it("crosses the year", () => {
    expect(sameDayLastMonth("2027-01-15")).toBe("2026-12-15");
  });
});

describe("sumThrough", () => {
  it("adds the days up to and including the last day", () => {
    const byDay = new Map([
      ["2026-09-01", 1000],
      ["2026-09-05", 500],
      ["2026-09-06", 9999],
    ]);
    expect(sumThrough(byDay, "2026-09-05")).toBe(1500);
  });
});

describe("firstCompleteMonth", () => {
  it("counts a month that starts on day 1", () => {
    expect(firstCompleteMonth("2026-09-01")).toBe("2026-09");
  });

  it("skips a month that started late", () => {
    expect(firstCompleteMonth("2026-09-20")).toBe("2026-10");
    expect(firstCompleteMonth("2026-12-02")).toBe("2027-01");
  });
});

describe("canCompare", () => {
  it("needs the previous month to be fully tracked", () => {
    expect(canCompare("2026-09-20", "2026-10")).toBe(false);
    expect(canCompare("2026-09-20", "2026-11")).toBe(true);
    expect(canCompare("2026-09-01", "2026-10")).toBe(true);
    expect(canCompare(null, "2026-10")).toBe(false);
  });
});

describe("monthBars and monthlyAverage", () => {
  const totals = new Map([
    ["2026-08", 30000],
    ["2026-09", 50000],
    ["2026-10", 12000],
  ]);
  const bars = monthBars(totals, "2026-10", "2026-07-15");

  it("lists the last 12 months, oldest first, with zeros for empty months", () => {
    expect(bars).toHaveLength(12);
    expect(bars[0]).toEqual({ month: "2025-11", cents: 0, tracked: false });
    expect(bars.at(-1)).toEqual({
      month: "2026-10",
      cents: 12000,
      tracked: true,
    });
    expect(bars.find((bar) => bar.month === "2026-07")?.tracked).toBe(true);
  });

  it("averages only complete months before the current one", () => {
    expect(monthlyAverage(bars, "2026-07-15", "2026-10")).toBe(40000);
  });

  it("counts tracked months without spending as zero", () => {
    expect(monthlyAverage(bars, "2026-07-01", "2026-10")).toBe(26667);
  });

  it("has no average before the first complete month ends", () => {
    expect(monthlyAverage(bars, "2026-09-15", "2026-10")).toBeNull();
    expect(monthlyAverage(bars, null, "2026-10")).toBeNull();
  });
});

describe("percentOf", () => {
  it("rounds to whole percents and survives a zero total", () => {
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(5, 0)).toBe(0);
  });
});
