import { describe, expect, it } from "vitest";
import {
  gradingRules,
  parseGrade,
  presets,
  resultOf,
  ruleSentence,
} from "./grading";

describe("ruleSentence", () => {
  it("explains each scheme in plain words", () => {
    expect(ruleSentence(presets.numeric_10)).toBe(
      "Aprovado quem tiver média 6 ou mais e pelo menos 75% de presença.",
    );
    expect(
      ruleSentence({
        ...presets.numeric_10,
        passingScore: 6.5,
        minAttendance: 70,
      }),
    ).toBe(
      "Aprovado quem tiver média 6,5 ou mais e pelo menos 70% de presença.",
    );
    expect(ruleSentence(presets.concept)).toBe(
      "Aprovado quem tiver conceito Ótimo, Bom ou Regular e pelo menos 75% de presença.",
    );
    expect(ruleSentence(presets.attendance_only)).toBe(
      "Aprovado quem tiver pelo menos 75% de presença.",
    );
  });
});

describe("gradingRules", () => {
  it("accepts every preset", () => {
    for (const preset of Object.values(presets)) {
      expect(gradingRules.safeParse(preset).success).toBe(true);
    }
  });

  it("refuses rules that do not fit the scheme", () => {
    expect(
      gradingRules.safeParse({ ...presets.numeric_10, passingScore: 60 })
        .success,
    ).toBe(false);
    expect(
      gradingRules.safeParse({
        ...presets.concept,
        conceptLabels: ["Bom", "bom"],
        conceptPassing: 1,
      }).success,
    ).toBe(false);
    expect(
      gradingRules.safeParse({ ...presets.concept, conceptPassing: 5 }).success,
    ).toBe(false);
  });
});

describe("parseGrade", () => {
  it("accepts a comma or a dot and stays inside the scale", () => {
    expect(parseGrade("7,5", "numeric_10")).toEqual({ ok: true, value: 7.5 });
    expect(parseGrade(" 10 ", "numeric_10")).toEqual({ ok: true, value: 10 });
    expect(parseGrade("", "numeric_10")).toEqual({ ok: true, value: null });
    expect(parseGrade("10,5", "numeric_10").ok).toBe(false);
    expect(parseGrade("85", "numeric_100")).toEqual({ ok: true, value: 85 });
    expect(parseGrade("sete", "numeric_10").ok).toBe(false);
    expect(parseGrade("7", "concept").ok).toBe(false);
  });
});

describe("resultOf", () => {
  it("names why a student did not pass", () => {
    expect(resultOf({ passed_score: true, passed_attendance: true })).toBe(
      "approved",
    );
    expect(resultOf({ passed_score: false, passed_attendance: true })).toBe(
      "failedScore",
    );
    expect(resultOf({ passed_score: true, passed_attendance: false })).toBe(
      "failedAttendance",
    );
    expect(resultOf({ passed_score: false, passed_attendance: false })).toBe(
      "failedBoth",
    );
  });
});
