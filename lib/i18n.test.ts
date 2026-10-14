import { describe, expect, it } from "vitest";
import { legal, m } from "./i18n";

function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "function") {
    const sample = value("Ana", 2, 3);
    return typeof sample === "string" ? [sample] : [];
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
