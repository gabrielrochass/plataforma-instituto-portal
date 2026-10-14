import { describe, expect, it } from "vitest";
import { changedFields, perCapitaCents, type SocialProfile } from "./ficha";

const base: SocialProfile = {
  id: "1",
  assessed_on: "2026-01-10",
  moment: "intake",
  neighborhood: "Coque",
  city: "Recife",
  household_size: 4,
  household_income_cents: 150000,
  housing: "rented",
  benefits: ["bolsa_familia", "cadunico"],
  has_internet: false,
  has_computer: false,
  schooling: "high_school_incomplete",
  studying_now: true,
  work: "unemployed",
  gender: "woman",
  race_color: null,
  disability: null,
  health_notes: null,
  notes: null,
};

describe("changedFields", () => {
  it("lists only what changed and ignores the order of benefits", () => {
    expect(
      changedFields(base, {
        ...base,
        id: "2",
        assessed_on: "2026-06-10",
        household_income_cents: 250000,
        benefits: ["cadunico", "bolsa_familia"],
        work: "formal",
      }),
    ).toEqual(["household_income_cents", "work"]);
  });
});

describe("perCapitaCents", () => {
  it("divides the family income by the people in the house", () => {
    expect(perCapitaCents(base)).toBe(37500);
    expect(
      perCapitaCents({ household_size: null, household_income_cents: 100 }),
    ).toBeNull();
    expect(
      perCapitaCents({ household_size: 3, household_income_cents: null }),
    ).toBeNull();
  });
});
