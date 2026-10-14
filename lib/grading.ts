import { z } from "zod";
import { m } from "@/lib/i18n";

export const gradingSchemes = [
  "numeric_10",
  "numeric_100",
  "concept",
  "attendance_only",
] as const;

export type GradingScheme = (typeof gradingSchemes)[number];

export type GradingRules = {
  scheme: GradingScheme;
  passingScore: number | null;
  conceptLabels: string[] | null;
  conceptPassing: number | null;
  minAttendance: number;
};

export const defaultConcepts = ["Ótimo", "Bom", "Regular", "Insuficiente"];

export const presets: Record<GradingScheme, GradingRules> = {
  numeric_10: {
    scheme: "numeric_10",
    passingScore: 6,
    conceptLabels: null,
    conceptPassing: null,
    minAttendance: 75,
  },
  numeric_100: {
    scheme: "numeric_100",
    passingScore: 60,
    conceptLabels: null,
    conceptPassing: null,
    minAttendance: 75,
  },
  concept: {
    scheme: "concept",
    passingScore: null,
    conceptLabels: defaultConcepts,
    conceptPassing: 3,
    minAttendance: 75,
  },
  attendance_only: {
    scheme: "attendance_only",
    passingScore: null,
    conceptLabels: null,
    conceptPassing: null,
    minAttendance: 75,
  },
};

export const maxScore: Record<GradingScheme, number | null> = {
  numeric_10: 10,
  numeric_100: 100,
  concept: null,
  attendance_only: null,
};

const scoreFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
});

export function formatScore(value: number) {
  return scoreFormat.format(value);
}

function joinOr(items: readonly string[]) {
  return items.length <= 1
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} ou ${items.at(-1)}`;
}

export function ruleSentence(rules: GradingRules) {
  switch (rules.scheme) {
    case "numeric_10":
    case "numeric_100":
      return m.grading.ruleNumeric(
        formatScore(rules.passingScore ?? 0),
        rules.minAttendance,
      );
    case "concept":
      return m.grading.ruleConcept(
        joinOr((rules.conceptLabels ?? []).slice(0, rules.conceptPassing ?? 0)),
        rules.minAttendance,
      );
    default:
      return m.grading.ruleAttendance(rules.minAttendance);
  }
}

const label = z.string().trim().min(1).max(20);

export const gradingRules = z
  .object({
    scheme: z.enum(gradingSchemes),
    passingScore: z.number().min(0).max(100).nullable(),
    conceptLabels: z.array(label).min(2).max(10).nullable(),
    conceptPassing: z.number().int().min(1).max(10).nullable(),
    minAttendance: z.number().int().min(0).max(100),
  })
  .refine(
    (rules) => {
      const max = maxScore[rules.scheme];
      if (max !== null) {
        return (
          rules.passingScore !== null &&
          rules.passingScore <= max &&
          rules.conceptLabels === null
        );
      }
      if (rules.scheme === "concept") {
        const labels = rules.conceptLabels ?? [];
        return (
          rules.passingScore === null &&
          labels.length >= 2 &&
          new Set(labels.map((item) => item.toLowerCase())).size ===
            labels.length &&
          rules.conceptPassing !== null &&
          rules.conceptPassing <= labels.length
        );
      }
      return rules.passingScore === null && rules.conceptLabels === null;
    },
    { message: m.grading.invalid, path: ["scheme"] },
  );

export function toGradingColumns(rules: GradingRules) {
  return {
    grading_scheme: rules.scheme,
    passing_score: rules.passingScore,
    concept_labels: rules.conceptLabels,
    concept_passing: rules.conceptPassing,
    min_attendance: rules.minAttendance,
  };
}

export function fromGradingColumns(row: {
  grading_scheme: GradingScheme;
  passing_score: number | null;
  concept_labels: string[] | null;
  concept_passing: number | null;
  min_attendance: number;
}): GradingRules {
  return {
    scheme: row.grading_scheme,
    passingScore: row.passing_score,
    conceptLabels: row.concept_labels,
    conceptPassing: row.concept_passing,
    minAttendance: row.min_attendance,
  };
}

export function parseGrade(text: string, scheme: GradingScheme) {
  const max = maxScore[scheme];
  const cleaned = text.trim().replace(",", ".");
  if (cleaned === "") return { ok: true as const, value: null };
  if (max === null || !/^\d{1,3}(\.\d{1,2})?$/.test(cleaned)) {
    return { ok: false as const };
  }
  const value = Number(cleaned);
  return value <= max ? { ok: true as const, value } : { ok: false as const };
}

export function resultOf(row: {
  passed_score: boolean;
  passed_attendance: boolean;
}) {
  if (row.passed_score && row.passed_attendance) return "approved" as const;
  if (!row.passed_score && !row.passed_attendance) return "failedBoth" as const;
  return row.passed_score
    ? ("failedAttendance" as const)
    : ("failedScore" as const);
}
