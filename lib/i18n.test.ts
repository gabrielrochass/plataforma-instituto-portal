import { describe, expect, it } from "vitest";
import { legal, m } from "./i18n";

function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "function") {
    for (const args of [
      ["Ana", 2, 3],
      [["Seg", "Ter"], "8h", "10h"],
    ]) {
      try {
        const sample = value(...args);
        if (typeof sample === "string") return [sample];
      } catch {}
    }
    return [];
  }
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(strings);
  }
  return [];
}

describe("interface copy", () => {
  it("never uses a middle dot or long dashes", () => {
    const offenders = strings({ m, legal }).filter((text) =>
      /[·—–]/.test(text),
    );
    expect(offenders).toEqual([]);
  });
});
