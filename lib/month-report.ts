export type Verdict = "better" | "worse" | "same";

export type CategoryChange = {
  categoryId: string;
  current: number;
  previous: number;
  change: number;
};

export function savingsRate(income: number, expenses: number) {
  return income > 0 ? Math.round(((income - expenses) / income) * 100) : null;
}

export function verdict(net: number, previousNet: number | null) {
  if (previousNet === null) return null;
  return net > previousNet ? "better" : net < previousNet ? "worse" : "same";
}

export function movers(
  current: Map<string, number>,
  previous: Map<string, number>,
  limit = 3,
) {
  const changes = [...new Set([...current.keys(), ...previous.keys()])]
    .map((categoryId) => {
      const now = current.get(categoryId) ?? 0;
      const before = previous.get(categoryId) ?? 0;
      return {
        categoryId,
        current: now,
        previous: before,
        change: now - before,
      };
    })
    .filter((row) => row.change !== 0)
    .sort(
      (a, b) =>
        Math.abs(b.change) - Math.abs(a.change) ||
        a.categoryId.localeCompare(b.categoryId),
    );
  return {
    up: changes.filter((row) => row.change > 0).slice(0, limit),
    down: changes.filter((row) => row.change < 0).slice(0, limit),
  };
}
