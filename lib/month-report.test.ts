import { describe, expect, it } from "vitest";
import { movers, savingsRate, verdict } from "./month-report";

describe("savingsRate", () => {
  it("is the share of income left", () => {
    expect(savingsRate(300000, 264000)).toBe(12);
  });

  it("goes negative when spending passes income", () => {
    expect(savingsRate(300000, 330000)).toBe(-10);
  });

  it("needs income", () => {
    expect(savingsRate(0, 5000)).toBeNull();
  });
});

describe("verdict", () => {
  it("compares the month's balance with the previous one", () => {
    expect(verdict(-50000, -90000)).toBe("better");
    expect(verdict(10000, 20000)).toBe("worse");
    expect(verdict(0, 0)).toBe("same");
  });

  it("says nothing without a previous month", () => {
    expect(verdict(-50000, null)).toBeNull();
  });
});

describe("movers", () => {
  it("lists the categories that grew and shrank the most", () => {
    const result = movers(
      new Map([
        ["mercado", 90000],
        ["lazer", 20000],
        ["casa", 50000],
        ["novo", 7000],
      ]),
      new Map([
        ["mercado", 60000],
        ["lazer", 45000],
        ["casa", 50000],
        ["sumiu", 3000],
      ]),
    );
    expect(result.up.map((row) => row.categoryId)).toEqual(["mercado", "novo"]);
    expect(result.down.map((row) => row.categoryId)).toEqual([
      "lazer",
      "sumiu",
    ]);
    expect(result.down[1]).toEqual({
      categoryId: "sumiu",
      current: 0,
      previous: 3000,
      change: -3000,
    });
  });

  it("keeps at most three on each side and breaks ties by id", () => {
    const current = new Map(["d", "c", "b", "a"].map((id) => [id, 1000]));
    expect(movers(current, new Map()).up.map((row) => row.categoryId)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});
