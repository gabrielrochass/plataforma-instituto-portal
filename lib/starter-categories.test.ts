import { describe, expect, it } from "vitest";
import { categoryIcons } from "./category-icons";
import { paletteColors } from "./palette";
import { starterCategories } from "./starter-categories";

describe("starterCategories", () => {
  it("only uses icons and colors the app knows", () => {
    for (const category of starterCategories) {
      expect(Object.keys(categoryIcons), category.name).toContain(
        category.icon,
      );
      expect(paletteColors, category.name).toContain(category.color);
    }
  });

  it("has unique names per kind", () => {
    const keys = starterCategories.map(
      (c) => `${c.kind}:${c.name.toLowerCase()}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });
});
