export type SocialProfile = {
  id: string;
  assessed_on: string;
  moment: "intake" | "follow_up" | "exit";
  neighborhood: string | null;
  city: string | null;
  household_size: number | null;
  household_income_cents: number | null;
  housing: string | null;
  benefits: string[];
  has_internet: boolean | null;
  has_computer: boolean | null;
  schooling: string | null;
  studying_now: boolean | null;
  work: string | null;
  gender: string | null;
  race_color: string | null;
  disability: string[] | null;
  health_notes: string | null;
  notes: string | null;
};

export const comparedFields = [
  "household_size",
  "household_income_cents",
  "benefits",
  "neighborhood",
  "housing",
  "schooling",
  "studying_now",
  "work",
  "has_internet",
  "has_computer",
] as const satisfies readonly (keyof SocialProfile)[];

export type ComparedField = (typeof comparedFields)[number];

function same(a: unknown, b: unknown) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return [...a].sort().join() === [...b].sort().join();
  }
  return a === b;
}

export function changedFields(before: SocialProfile, after: SocialProfile) {
  return comparedFields.filter((field) => !same(before[field], after[field]));
}

export function perCapitaCents(profile: {
  household_size: number | null;
  household_income_cents: number | null;
}) {
  if (!profile.household_size || profile.household_income_cents === null) {
    return null;
  }
  return Math.round(profile.household_income_cents / profile.household_size);
}
