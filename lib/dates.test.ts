import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  formatDate,
  formatDayHeading,
  formatFullDate,
  formatMonth,
  formatShortDate,
  formatShortMonth,
  localToday,
  monthRange,
  todayInSaoPaulo,
} from "./dates";

describe("todayInSaoPaulo", () => {
  it("uses Brasília time, not UTC, near midnight", () => {
    expect(todayInSaoPaulo(new Date("2026-10-01T02:30:00Z"))).toBe(
      "2026-09-30",
    );
    expect(todayInSaoPaulo(new Date("2026-10-01T03:00:00Z"))).toBe(
      "2026-10-01",
    );
  });
});

describe("localToday", () => {
  it("returns the device's calendar date", () => {
    expect(localToday(new Date(2026, 1, 28, 23, 59))).toBe("2026-02-28");
  });
});

describe("monthRange", () => {
  it("is half-open and crosses the year", () => {
    expect(monthRange("2026-10")).toEqual({
      from: "2026-10-01",
      to: "2026-11-01",
    });
    expect(monthRange("2026-12")).toEqual({
      from: "2026-12-01",
      to: "2027-01-01",
    });
  });
});

describe("addMonths", () => {
  it("moves across years in both directions", () => {
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addMonths("2026-11", 14)).toBe("2028-01");
    expect(addMonths("2026-05", 0)).toBe("2026-05");
  });
});

describe("formatMonth", () => {
  it("names the month in Portuguese", () => {
    expect(formatMonth("2026-10")).toBe("outubro de 2026");
  });
});

describe("addDays", () => {
  it("crosses months, years and leap days", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("formatFullDate", () => {
  it("writes the month in full", () => {
    expect(formatFullDate("2026-10-05")).toBe("5 de outubro de 2026");
  });
});

describe("formatDate", () => {
  it("leaves the year out only in the current year", () => {
    expect(formatDate("2026-10-03", "2026-10-05")).toBe("3 de out.");
    expect(formatDate("2025-12-31", "2026-10-05")).toBe("31 de dez. de 2025");
  });
});

describe("short formats", () => {
  it("formats day/month and abbreviated month names", () => {
    expect(formatShortDate("2026-11-10")).toBe("10/11");
    expect(formatShortMonth("2026-11-10")).toBe("nov");
  });
});

describe("formatDayHeading", () => {
  const today = "2026-10-05";

  it("uses relative names for today and yesterday", () => {
    expect(formatDayHeading("2026-10-05", today)).toBe("Hoje");
    expect(formatDayHeading("2026-10-04", today)).toBe("Ontem");
  });

  it("names older days and adds the year when it differs", () => {
    expect(formatDayHeading("2026-10-03", today)).toBe("sábado, 3 de outubro");
    expect(formatDayHeading("2025-12-31", today)).toBe(
      "quarta-feira, 31 de dezembro de 2025",
    );
  });
});
