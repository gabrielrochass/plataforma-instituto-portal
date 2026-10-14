export type ClassPhase =
  | "upcoming"
  | "current"
  | "toClose"
  | "finished"
  | "cancelled";

export function classPhase(
  row: {
    status: "open" | "finished" | "cancelled";
    starts_on: string;
    ends_on: string;
  },
  today: string,
): ClassPhase {
  if (row.status === "cancelled") return "cancelled";
  if (row.status === "finished") return "finished";
  if (row.starts_on > today) return "upcoming";
  if (row.ends_on < today) return "toClose";
  return "current";
}

export type ClassSituation = "current" | "upcoming" | "past" | "all";

export function parseSituation(value: unknown): ClassSituation {
  return value === "upcoming" || value === "past" || value === "all"
    ? value
    : "current";
}

export function matchesSituation(phase: ClassPhase, situation: ClassSituation) {
  if (situation === "all") return true;
  if (situation === "current")
    return phase === "current" || phase === "toClose";
  if (situation === "upcoming") return phase === "upcoming";
  return phase === "finished" || phase === "cancelled";
}
