import { describe, expect, it } from "vitest";
import { classPhase, matchesSituation, parseSituation } from "./class-phase";

const open = {
  status: "open" as const,
  starts_on: "2026-08-01",
  ends_on: "2026-12-18",
};

describe("classPhase", () => {
  it("derives the phase from dates while the class is open", () => {
    expect(classPhase(open, "2026-07-31")).toBe("upcoming");
    expect(classPhase(open, "2026-10-14")).toBe("current");
    expect(classPhase(open, "2026-12-19")).toBe("toClose");
    expect(classPhase({ ...open, status: "finished" }, "2026-10-14")).toBe(
      "finished",
    );
    expect(classPhase({ ...open, status: "cancelled" }, "2026-10-14")).toBe(
      "cancelled",
    );
  });
});

describe("situations", () => {
  it("keeps classes waiting to be closed among the current ones", () => {
    expect(matchesSituation("toClose", "current")).toBe(true);
    expect(matchesSituation("upcoming", "current")).toBe(false);
    expect(matchesSituation("cancelled", "past")).toBe(true);
    expect(parseSituation("nada")).toBe("current");
    expect(parseSituation("past")).toBe("past");
  });
});
