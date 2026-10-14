import { describe, expect, it } from "vitest";
import { orderedCounts, percent, periodKeys, resolvePeriod } from "./impact";

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
