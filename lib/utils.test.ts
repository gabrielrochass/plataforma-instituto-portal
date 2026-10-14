import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { cn } from "./utils";

const css = readFileSync(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);
const sizes = [...css.matchAll(/--text-([a-z0-9-]+):/g)]
  .map(([, name]) => name)
  .filter((name) => !name.endsWith("--line-height"));

describe("cn", () => {
  it.each(sizes)("keeps the text color next to text-%s", (size) => {
    expect(cn("text-primary-foreground", `text-${size}`)).toBe(
      `text-primary-foreground text-${size}`,
    );
  });
});
