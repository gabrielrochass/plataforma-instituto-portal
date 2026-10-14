import { describe, expect, it } from "vitest";
import {
  attendanceRate,
  countMarks,
  isCurrentSession,
  streakAfter,
} from "./attendance";

describe("attendanceRate", () => {
  it("counts excused absences as absences and needs at least one mark", () => {
    expect(attendanceRate({ attended: 3, missed: 1 })).toBe(75);
    expect(attendanceRate({ attended: 2, missed: 1 })).toBe(67);
    expect(attendanceRate({ attended: 0, missed: 0 })).toBeNull();
  });
});

describe("streakAfter", () => {
  it("grows with absences, resets with presence and ignores excused ones", () => {
    expect(streakAfter(2, "absent")).toBe(3);
    expect(streakAfter(2, "late")).toBe(0);
    expect(streakAfter(2, "excused")).toBe(2);
    expect(streakAfter(2, null)).toBe(2);
  });
});

describe("countMarks", () => {
  it("groups late with present and excused with absent", () => {
    expect(countMarks(["present", "late", "absent", "excused", null])).toEqual({
      present: 2,
      absent: 2,
      unmarked: 1,
    });
  });
});

describe("isCurrentSession", () => {
  it("opens half an hour before and closes three hours after", () => {
    const session = { startsAt: "08:00", endsAt: "10:00" };
    expect(isCurrentSession(session, 7 * 60 + 29)).toBe(false);
    expect(isCurrentSession(session, 7 * 60 + 30)).toBe(true);
    expect(isCurrentSession(session, 13 * 60)).toBe(true);
    expect(isCurrentSession(session, 13 * 60 + 1)).toBe(false);
  });
});
