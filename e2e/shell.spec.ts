import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

const tabs = [
  { name: "Início", path: "/" },
  { name: "Transações", path: "/transacoes" },
  { name: "Cofrinhos", path: "/cofrinhos" },
  { name: "Análises", path: "/analises" },
];

const settingsPaths = [
  "/ajustes",
  "/ajustes/categorias",
  "/ajustes/cartoes",
  "/ajustes/cartoes/novo",
  "/ajustes/conta",
  "/ajustes/conta/exportar",
  "/ajustes/conta/excluir",
];

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme });

    test("tab bar navigates between sections", async ({ page }) => {
      test.slow();
      await page.goto("/");
      const nav = page.getByRole("navigation", { name: "Navegação principal" });

      for (const tab of tabs) {
        await nav.getByRole("link", { name: tab.name }).click();
        await expect(page).toHaveURL(tab.path);
        await expect(
          page.getByRole("heading", { level: 1, name: tab.name }),
        ).toBeVisible();
        await expect(nav.getByRole("link", { name: tab.name })).toHaveAttribute(
          "aria-current",
          "page",
        );
        await expectNoAxeViolations(page);
      }
    });

    test("settings opens from the header", async ({ page }) => {
      await page.goto("/");
      await page.getByRole("link", { name: "Ajustes" }).click();
      await expect(
        page.getByRole("heading", { level: 1, name: "Ajustes" }),
      ).toBeVisible();
      await expectNoAxeViolations(page);
    });

    test("new entry opens full screen and goes back", async ({ page }) => {
      await page.goto("/");
      await page.getByRole("link", { name: "Adicionar lançamento" }).click();
      await expect(
        page.getByRole("heading", { level: 1, name: "Novo lançamento" }),
      ).toBeVisible();
      await expectNoAxeViolations(page);
      await page.getByRole("button", { name: "Voltar" }).click();
      await expect(page).toHaveURL("/");
    });

    test("settings screens meet WCAG", async ({ page }) => {
      test.slow();
      for (const path of settingsPaths) {
        await page.goto(path);
        await expectNoAxeViolations(page);
      }
    });

    test("component gallery meets contrast", async ({ page }) => {
      await page.goto("/dev/ui");
      await expectNoAxeViolations(page);
    });
  });
}

test("no horizontal scroll at 320px", async ({ page }) => {
  test.slow();
  await page.setViewportSize({ width: 320, height: 640 });
  for (const path of [
    ...tabs.map((tab) => tab.path),
    ...settingsPaths,
    "/lancamentos/novo",
  ]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
