import { describe, expect, it } from "vitest";
import {
  niceMax,
  orderedCounts,
  percent,
  periodKeys,
  presenceStatus,
  resolvePeriod,
} from "./impact";

describe("resolvePeriod", () => {
  it("defaults to the last twelve months including the current one", () => {
    expect(resolvePeriod(undefined, "2026-10-14")).toEqual({
      key: "12m",
      from: "2025-11-01",
      to: "2026-11-01",
      previousFrom: "2024-11-01",
      previousTo: "2025-11-01",
    });
  });

  it("takes a recent year and compares it with the year before", () => {
    expect(resolvePeriod("2025", "2026-10-14")).toEqual({
      key: "2025",
      from: "2025-01-01",
      to: "2026-01-01",
      previousFrom: "2024-01-01",
      previousTo: "2025-01-01",
    });
  });

  it("ignores years outside the list", () => {
    expect(periodKeys("2026-10-14")).toEqual(["12m", "2026", "2025", "2024"]);
    expect(resolvePeriod("1999", "2026-10-14").key).toBe("12m");
  });
});

describe("percent", () => {
  it("rounds and has no value without a base", () => {
    expect(percent(2, 3)).toBe(67);
    expect(percent(0, 0)).toBeNull();
  });
});

describe("orderedCounts", () => {
  it("follows the given order and keeps hidden cells", () => {
    expect(
      orderedCounts({ man: null, woman: 12 }, ["woman", "man", "other"]),
    ).toEqual([
      { key: "woman", value: 12 },
      { key: "man", value: null },
    ]);
  });
});

describe("presenceStatus", () => {
  it("uses the goal and a lower attention band", () => {
    expect(presenceStatus(75)).toBe("good");
    expect(presenceStatus(60)).toBe("attention");
    expect(presenceStatus(59)).toBe("low");
  });
});

describe("niceMax", () => {
  it("rounds the top of the scale up to a clean number", () => {
    expect(niceMax(3)).toBe(5);
    expect(niceMax(21)).toBe(25);
    expect(niceMax(130)).toBe(200);
  });
});
