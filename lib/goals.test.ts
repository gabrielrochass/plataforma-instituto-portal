import { describe, expect, it } from "vitest";
import {
  expectedByNow,
  forecastJar,
  historyPace,
  neededToReach,
  reachMonth,
} from "@/lib/goals";

describe("historyPace", () => {
  it("averages the complete months since the jar started", () => {
    const nets = new Map([
      ["2026-07", 50000],
      ["2026-08", 40000],
      ["2026-09", 50000],
    ]);
    expect(historyPace(nets, "2026-07", "2026-10")).toEqual({
      cents: 46667,
      months: 3,
    });
  });

  it("counts months without deposits as zero", () => {
    const nets = new Map([["2026-07", 60000]]);
    expect(historyPace(nets, "2026-07", "2026-10")).toEqual({
      cents: 20000,
      months: 3,
    });
  });

  it("looks back at most six months", () => {
    const nets = new Map([
      ["2026-01", 999999],
      ["2026-04", 60000],
    ]);
    expect(historyPace(nets, "2026-01", "2026-10")).toEqual({
      cents: 10000,
      months: 6,
    });
  });

  it("goes negative when withdrawals win", () => {
    const nets = new Map([["2026-09", -30000]]);
    expect(historyPace(nets, "2026-09", "2026-10")).toEqual({
      cents: -30000,
      months: 1,
    });
  });

  it("needs one complete month", () => {
    expect(historyPace(new Map(), "2026-10", "2026-10")).toBeNull();
    expect(historyPace(new Map(), null, "2026-10")).toBeNull();
  });
});

describe("reachMonth", () => {
  it("counts the current month as the first month of saving", () => {
    expect(reachMonth(100000, 30000, "2026-10")).toBe("2027-01");
    expect(reachMonth(30000, 30000, "2026-10")).toBe("2026-10");
  });

  it("is the current month when the goal is already met", () => {
    expect(reachMonth(0, 30000, "2026-10")).toBe("2026-10");
  });

  it("never arrives without savings or after 50 years", () => {
    expect(reachMonth(100000, 0, "2026-10")).toBeNull();
    expect(reachMonth(100000, -500, "2026-10")).toBeNull();
    expect(reachMonth(100_000_000, 100, "2026-10")).toBeNull();
  });
});

describe("neededToReach", () => {
  it("splits what is left across the months until the deadline", () => {
    expect(neededToReach(600000, "2027-03-31", "2026-10-05")).toBe(100000);
  });

  it("rounds up to whole reais so the plan is enough", () => {
    expect(neededToReach(755000, "2027-04-30", "2026-10-05")).toBe(107900);
  });

  it("asks for everything this month when the deadline is this month", () => {
    expect(neededToReach(50000, "2026-10-31", "2026-10-05")).toBe(50000);
  });

  it("has nothing to plan when the goal is met or the deadline passed", () => {
    expect(neededToReach(0, "2027-03-31", "2026-10-05")).toBeNull();
    expect(neededToReach(1000, "2026-09-30", "2026-10-05")).toBeNull();
  });
});

describe("expectedByNow", () => {
  it("draws a straight line from the start to the goal", () => {
    expect(
      expectedByNow(
        { on: "2026-01-01", cents: 0 },
        { on: "2026-12-31", cents: 364000 },
        "2026-07-02",
      ),
    ).toBe(182000);
  });

  it("starts from the opening balance", () => {
    expect(
      expectedByNow(
        { on: "2026-01-01", cents: 100000 },
        { on: "2026-01-31", cents: 400000 },
        "2026-01-16",
      ),
    ).toBe(250000);
  });

  it("stays between the start and the goal", () => {
    const start = { on: "2026-01-01", cents: 1000 };
    const target = { on: "2026-02-01", cents: 5000 };
    expect(expectedByNow(start, target, "2025-12-01")).toBe(1000);
    expect(expectedByNow(start, target, "2026-03-01")).toBe(5000);
  });
});

describe("forecastJar", () => {
  const base = {
    target: 1_000_000,
    targetDate: "2027-06-30",
    planned: null,
    start: { on: "2026-07-01", cents: 200_000 },
    balance: 340_000,
    nets: new Map([
      ["2026-07", 50_000],
      ["2026-08", 40_000],
      ["2026-09", 50_000],
    ]),
    firstMonth: "2026-07",
    today: "2026-10-05",
  };

  it("projects the month the goal is reached at the current pace", () => {
    const forecast = forecastJar(base);
    expect(forecast.pace).toEqual({ cents: 46_667, months: 3 });
    expect(forecast.eta).toBe("2027-12");
    expect(forecast.needed).toBe(73_400);
    expect(forecast.deadline).toBe("2027-06");
    expect(forecast.monthsLate).toBe(6);
    expect(forecast.status).toBe("behind");
  });

  it("is on track when it arrives by the deadline month", () => {
    const onTime = forecastJar({ ...base, targetDate: "2027-12-31" });
    expect(onTime.monthsLate).toBe(0);
    expect(onTime.status).toBe("on-track");
    const early = forecastJar({ ...base, targetDate: "2028-03-31" });
    expect(early.monthsLate).toBe(-3);
    expect(early.status).toBe("on-track");
  });

  it("is on track when the pace matches the monthly plan", () => {
    const forecast = forecastJar({
      ...base,
      target: 700_000,
      targetDate: "2027-03-31",
      balance: 100_000,
      nets: new Map([
        ["2026-07", 100_000],
        ["2026-08", 100_000],
        ["2026-09", 100_000],
      ]),
    });
    expect(forecast.needed).toBe(100_000);
    expect(forecast.eta).toBe("2027-03");
    expect(forecast.status).toBe("on-track");
  });

  it("can arrive this month when the deadline is this month", () => {
    const forecast = forecastJar({
      ...base,
      targetDate: "2026-10-31",
      balance: 990_000,
    });
    expect(forecast.eta).toBe("2026-10");
    expect(forecast.needed).toBe(10_000);
    expect(forecast.status).toBe("on-track");
  });

  it("is behind once the deadline has passed", () => {
    const forecast = forecastJar({ ...base, targetDate: "2026-10-01" });
    expect(forecast.deadline).toBeNull();
    expect(forecast.needed).toBeNull();
    expect(forecast.monthsLate).toBeNull();
    expect(forecast.status).toBe("behind");
  });

  it("never arrives when withdrawals win", () => {
    const forecast = forecastJar({
      ...base,
      nets: new Map([["2026-09", -30_000]]),
      firstMonth: "2026-09",
    });
    expect(forecast.eta).toBeNull();
    expect(forecast.monthsLate).toBeNull();
    expect(forecast.needed).toBe(73_400);
    expect(forecast.status).toBe("behind");
  });

  it("uses the straight line to the deadline before there is a pace", () => {
    const early = { ...base, nets: new Map(), firstMonth: "2026-10" };
    expect(forecastJar({ ...early, balance: 410_988 }).status).toBe("behind");
    expect(forecastJar({ ...early, balance: 410_989 }).status).toBe("on-track");
  });

  it("is done once the goal is met", () => {
    const forecast = forecastJar({ ...base, balance: 1_000_000 });
    expect(forecast.status).toBe("done");
    expect(forecast.eta).toBeNull();
    expect(forecast.needed).toBeNull();
  });

  it("falls back to the planned amount before a full month of history", () => {
    const forecast = forecastJar({
      ...base,
      planned: 80_000,
      nets: new Map(),
      firstMonth: "2026-10",
    });
    expect(forecast.pace).toEqual({ cents: 80_000, months: 0 });
  });

  it("prefers real history over the planned amount", () => {
    expect(forecastJar({ ...base, planned: 80_000 }).pace).toEqual({
      cents: 46_667,
      months: 3,
    });
  });

  it("has no status or plan without a goal", () => {
    const forecast = forecastJar({ ...base, target: null });
    expect(forecast.status).toBeNull();
    expect(forecast.eta).toBeNull();
    expect(forecast.pace).toEqual({ cents: 46_667, months: 3 });
  });
});
