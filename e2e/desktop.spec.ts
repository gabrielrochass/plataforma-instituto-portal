import { test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

const appPaths = [
  "/",
  "/transacoes",
  "/cofrinhos",
  "/analises",
  "/ajustes",
  "/ajustes/conta",
  "/lancamentos/novo",
];

for (const colorScheme of ["light", "dark"] as const) {
  test(`desktop screens meet WCAG in the ${colorScheme} theme`, async ({
    page,
  }) => {
    test.slow();
    await page.emulateMedia({ colorScheme });
    for (const path of ["/entrar", "/termos", "/dev/ui"]) {
      await page.goto(path);
      await expectNoAxeViolations(page);
    }
    await page.goto(`/dev/entrar?as=desktop-${colorScheme}&next=/`);
    for (const path of appPaths) {
      await page.goto(path);
      await expectNoAxeViolations(page);
    }
  });
}
