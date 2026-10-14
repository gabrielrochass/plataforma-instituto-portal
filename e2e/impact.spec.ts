import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";
import { createClass, registerMinor, signIn, unique } from "./helpers";

test("coordination sees the impact of a class and prints the report", async ({
  page,
}) => {
  test.slow();
  await signIn(page, unique("admin-ra"), "/");
  const course = `Impacto ${Date.now()}`;
  const classId = await createClass(page, course);
  await registerMinor(page, classId, `Lia ${Date.now()}`);

  await page.goto("/mais");
  await page.getByRole("link", { name: /Impacto/ }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Impacto" }),
  ).toBeVisible();
  await page
    .getByLabel("Turma", { exact: true })
    .selectOption({ label: `${course}, RA` });
  await page.getByRole("button", { name: "Ver números" }).click();
  await expect(page).toHaveURL(/turma=/);

  const served = page
    .getByText("Alunos atendidos", { exact: true })
    .locator("..");
  await expect(served.getByRole("definition").first()).toHaveText("1");
  const age = page.getByRole("figure", { name: "Idade" });
  await expect(age).toContainText("Protegido");
  await expect(age).not.toContainText("15 a 17 anos");
  await expectNoAxeViolations(page);

  await page.getByRole("link", { name: "Relatório para imprimir" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Relatório de impacto" }),
  ).toBeVisible();
  await expect(
    page.getByText(`Filtros: Últimos 12 meses, Todas as unidades, ${course}`),
  ).toBeVisible();
  await expectNoAxeViolations(page);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 794, height: 1123 });
  await page.emulateMedia({ media: "print" });
  await expect(
    page.getByRole("button", { name: "Imprimir ou salvar em PDF" }),
  ).toBeHidden();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});

test("teachers do not see impact", async ({ page }) => {
  await signIn(page, unique("prof-ra"), "/impacto");
  await expect(
    page.getByRole("heading", { name: "Você não tem acesso a esta página" }),
  ).toBeVisible();
  await page.goto("/impacto/relatorio");
  await expect(
    page.getByRole("heading", { name: "Você não tem acesso a esta página" }),
  ).toBeVisible();
});
