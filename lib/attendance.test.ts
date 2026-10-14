import { describe, expect, it } from "vitest";
import { attendanceRate } from "./attendance";

describe("attendanceRate", () => {
  it("rounds and needs at least one mark", () => {
    expect(attendanceRate({ attended: 3, missed: 1 })).toBe(75);
    expect(attendanceRate({ attended: 2, missed: 1 })).toBe(67);
    expect(attendanceRate({ attended: 0, missed: 0 })).toBeNull();
  });
});
