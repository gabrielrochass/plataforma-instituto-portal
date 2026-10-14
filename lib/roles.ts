export type UnitRole = "admin" | "teacher";

export type Unit = { id: string; code: string; name: string };

export type Membership = { unit: Unit; role: UnitRole };

export type Viewer = {
  id: string;
  name: string | null;
  email: string;
  isAdminGeral: boolean;
  memberships: readonly Membership[];
  onboarded: boolean;
};

export function hasAccess(viewer: Viewer) {
  return viewer.isAdminGeral || viewer.memberships.length > 0;
}

export function isAdminOf(viewer: Viewer, unitId: string) {
  return (
    viewer.isAdminGeral ||
    viewer.memberships.some(
      (membership) =>
        membership.unit.id === unitId && membership.role === "admin",
    )
  );
}

export function adminUnits(viewer: Viewer, units: readonly Unit[]) {
  return units.filter((unit) => isAdminOf(viewer, unit.id));
}

export function invitableRoles(viewer: Viewer, unitId: string): UnitRole[] {
  if (viewer.isAdminGeral) return ["teacher", "admin"];
  return isAdminOf(viewer, unitId) ? ["teacher"] : [];
}

export const can = {
  manageTeam: (viewer: Viewer) =>
    viewer.isAdminGeral ||
    viewer.memberships.some((membership) => membership.role === "admin"),
  manageUnits: (viewer: Viewer) => viewer.isAdminGeral,
};
