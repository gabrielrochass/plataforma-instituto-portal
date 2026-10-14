import type { ComparedField, SocialProfile } from "@/lib/ficha";
import { m } from "@/lib/i18n";
import { formatBRL } from "@/lib/money";

const s = m.social;

function bool(value: boolean | null) {
  return value === null ? s.notInformed : value ? s.yes : s.no;
}

function pick<T extends Record<string, string>>(
  labels: T,
  value: string | null,
) {
  return value ? (labels[value as keyof T] ?? value) : s.notInformed;
}

export const fieldLabels: Record<ComparedField, string> = {
  household_size: s.householdSize,
  household_income_cents: s.householdIncome,
  benefits: s.benefits,
  neighborhood: s.neighborhood,
  housing: s.housing,
  schooling: s.schooling,
  studying_now: s.studyingNow,
  work: s.work,
  has_internet: s.hasInternet,
  has_computer: s.hasComputer,
};

export function fieldValue(profile: SocialProfile, field: ComparedField) {
  switch (field) {
    case "household_size":
      return profile.household_size === null
        ? s.notInformed
        : String(profile.household_size);
    case "household_income_cents":
      return profile.household_income_cents === null
        ? s.notInformed
        : formatBRL(profile.household_income_cents);
    case "benefits":
      return profile.benefits.length === 0
        ? s.notInformed
        : profile.benefits
            .map((benefit) => pick(s.benefitKinds, benefit))
            .join(", ");
    case "neighborhood":
      return profile.neighborhood ?? s.notInformed;
    case "housing":
      return pick(s.housingKinds, profile.housing);
    case "schooling":
      return pick(s.schoolingLevels, profile.schooling);
    case "studying_now":
      return bool(profile.studying_now);
    case "work":
      return pick(s.workKinds, profile.work);
    case "has_internet":
      return bool(profile.has_internet);
    case "has_computer":
      return bool(profile.has_computer);
  }
}

export function identityLines(profile: SocialProfile) {
  return [
    [s.gender, pick(s.genders, profile.gender)],
    [s.raceColor, pick(s.races, profile.race_color)],
    [
      s.disability,
      profile.disability?.length
        ? profile.disability
            .map((item) => pick(s.disabilities, item))
            .join(", ")
        : s.notInformed,
    ],
    ...(profile.health_notes ? [[s.healthNotes, profile.health_notes]] : []),
    ...(profile.notes ? [[s.notes, profile.notes]] : []),
  ] as const;
}
