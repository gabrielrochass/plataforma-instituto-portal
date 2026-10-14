import { describe, expect, it } from "vitest";
import { gradingRules, presets, ruleSentence } from "./grading";

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
