import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";
import {
  createClass,
  createCourse,
  registerMinor,
  signIn,
  unique,
} from "./helpers";

test("coordination sees the impact of a course and prints the report", async ({
  page,
}) => {
  test.slow();
  await signIn(page, unique("admin-ra"), "/");
  const course = unique("Curso");
  await createCourse(page, course);
  const classId = await createClass(page, course, `Impacto ${Date.now()}`);
  await registerMinor(page, classId, `Lia ${Date.now()}`);

  await page.goto("/mais");
  await page.getByRole("link", { name: /Impacto/ }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Impacto" }),
  ).toBeVisible();
  await page.getByLabel("Curso").selectOption({ label: course });
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page).toHaveURL(/curso=/);

  const served = page
    .getByText("Pessoas atendidas", { exact: true })
    .locator("..");
  await expect(served.getByRole("definition").first()).toHaveText("1");
  await expect(
    page.getByRole("listitem").filter({ hasText: "15 a 17 anos" }),
  ).toContainText("Oculto");
  await expectNoAxeViolations(page);

  await page.getByRole("link", { name: "Relatório" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Relatório de impacto" }),
  ).toBeVisible();
  await expect(
    page.getByText(`Recorte: Últimos 12 meses, Todas as unidades, ${course}`),
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
