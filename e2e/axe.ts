import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

export async function expectNoAxeViolations(page: Page) {
  await expect(page).toHaveTitle(/\S/);
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every((animation) => animation.playState !== "running"),
  );
  const { violations } = await new AxeBuilder({ page })
    .withTags(wcagTags)
    .analyze();
  expect(
    violations.flatMap(({ id, nodes }) =>
      nodes.map((node) => `${id} ${node.target} → ${node.failureSummary}`),
    ),
  ).toEqual([]);
}
