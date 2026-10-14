import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

const tabs = [
  { name: "Início", path: "/", heading: /^Olá/ },
  { name: "Turmas", path: "/turmas", heading: "Turmas" },
  { name: "Alunos", path: "/alunos", heading: "Alunos" },
  { name: "Mais", path: "/mais", heading: "Mais" },
];

const settingsPaths = [
  "/conta",
  "/conta/senha",
  "/equipe",
  "/equipe/convidar",
  "/unidades",
  "/turmas/nova",
  "/alunos/novo",
  "/inscricoes",
  "/inscricoes/ofertas",
  "/chamada",
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
          page.getByRole("heading", { level: 1, name: tab.heading }),
        ).toBeVisible();
        await expect(nav.getByRole("link", { name: tab.name })).toHaveAttribute(
          "aria-current",
          "page",
        );
        await expectNoAxeViolations(page);
      }
    });

    test("Mais shows every section and + offers what to add", async ({
      page,
    }) => {
      await page.goto("/mais");
      for (const name of [
        "Equipe",
        "Avisos",
        "Inscrições",
        "Impacto",
        "Unidades",
        "Minha conta",
      ]) {
        await expect(
          page.getByRole("link", { name: new RegExp(`^${name}`) }),
        ).toBeVisible();
      }
      await page.getByRole("button", { name: "Adicionar" }).click();
      const sheet = page.getByRole("dialog", {
        name: "O que você quer adicionar?",
      });
      for (const name of [
        "Aluno",
        "Turma",
        "Professor",
        "Adm da unidade",
        "Adm geral",
        "Aviso",
      ]) {
        await expect(
          sheet.getByRole("link", { name: new RegExp(`^${name}`) }),
        ).toBeVisible();
      }
      await expectNoAxeViolations(page);
      await sheet.getByRole("link", { name: /^Adm geral/ }).click();
      await expect(page).toHaveURL("/equipe/convidar?papel=adm-geral");
      await expect(
        page.getByRole("radio", { name: "Adm geral" }),
      ).toBeChecked();
    });

    test("settings screens meet WCAG", async ({ page }) => {
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

test("the tour shows each section once", async ({ page }) => {
  await page.goto("/?tour=1");
  const dialog = page.getByRole("dialog", { name: "Boas-vindas ao Portal" });
  await expect(dialog).toBeVisible();
  await expectNoAxeViolations(page);
  await dialog.getByRole("button", { name: "Começar" }).click();
  for (const title of ["Adicionar", "Turmas", "Alunos", "Mais"]) {
    await expect(page.getByRole("dialog", { name: title })).toBeVisible();
    await page.getByRole("button", { name: "Próximo" }).click();
  }
  await expect(
    page.getByRole("dialog", { name: "Pronto. Bom trabalho!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fechar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL("/");
});

test("no horizontal scroll at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  for (const path of [
    ...tabs.map((tab) => tab.path),
    ...settingsPaths,
    "/impacto",
    "/impacto/relatorio",
  ]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
