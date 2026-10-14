import { describe, expect, it } from "vitest";
import {
  adminUnits,
  can,
  hasAccess,
  invitableRoles,
  isAdminOf,
  type Viewer,
} from "./roles";

const ra = { id: "ra", code: "RA", name: "Recife Antigo" };
const bv = { id: "bv", code: "BV", name: "Boa Viagem" };

function viewer(overrides: Partial<Viewer>): Viewer {
  return {
    id: "1",
    name: "Ana",
    email: "ana@portal.local",
    isAdminGeral: false,
    memberships: [],
    onboarded: true,
    teaches: false,
    ...overrides,
  };
}

const geral = viewer({ isAdminGeral: true });
const adminRa = viewer({ memberships: [{ unit: ra, role: "admin" }] });
const teacher = viewer({
  memberships: [
    { unit: ra, role: "teacher" },
    { unit: bv, role: "teacher" },
  ],
});

describe("roles", () => {
  it("lets in only people with a unit or admin geral", () => {
    expect(hasAccess(viewer({}))).toBe(false);
    expect(hasAccess(geral)).toBe(true);
    expect(hasAccess(teacher)).toBe(true);
  });

  it("scopes admin power to the unit", () => {
    expect(isAdminOf(adminRa, "ra")).toBe(true);
    expect(isAdminOf(adminRa, "bv")).toBe(false);
    expect(isAdminOf(geral, "bv")).toBe(true);
    expect(adminUnits(adminRa, [ra, bv])).toEqual([ra]);
  });

  it("lets only admin geral invite other admins", () => {
    expect(invitableRoles(geral, "ra")).toEqual(["teacher", "admin"]);
    expect(invitableRoles(adminRa, "ra")).toEqual(["teacher"]);
    expect(invitableRoles(adminRa, "bv")).toEqual([]);
    expect(invitableRoles(teacher, "ra")).toEqual([]);
  });

  it("shows team and unit settings to the right people", () => {
    expect(can.manageTeam(adminRa)).toBe(true);
    expect(can.manageTeam(teacher)).toBe(false);
    expect(can.manageUnits(adminRa)).toBe(false);
    expect(can.manageUnits(geral)).toBe(true);
  });
});
