import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";
import {
  createClass,
  markAllPresent,
  newPage,
  registerMinor,
  signIn,
  today,
  unique,
  weekdayLabel,
} from "./helpers";

test("a teacher grades, reviews and closes the class", async ({
  page,
  browser,
}) => {
  test.slow();
  const admin = await newPage(browser, unique("admin-ra"));
  await admin.context().close();

  await signIn(page, unique("prof-ra"), "/");
  const className = `Notas ${Date.now()}`;
  const classId = await createClass(page, className, {
    days: [weekdayLabel(today)],
  });
  const ana = `Ana ${Date.now()}`;
  const beto = `Beto ${Date.now()}`;
  await registerMinor(page, classId, ana);
  const betoId = await registerMinor(page, classId, beto);

  await page.goto("/chamada");
  await markAllPresent(page);
  await page.getByRole("button", { name: "Salvar chamada" }).click();
  await expect(page).not.toHaveURL(/chamada/);

  await page.goto(`/turmas/${classId}/notas`);
  for (const [title, weight] of [
    ["Prova 1", "1"],
    ["Projeto", "2"],
  ]) {
    await page.getByLabel("Nome da avaliação").fill(title);
    await page.getByLabel("Peso").fill(weight);
    await page.getByRole("button", { name: "Criar avaliação" }).click();
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  }
  await expectNoAxeViolations(page);

  await page.getByRole("link", { name: "Lançar notas de Prova 1" }).click();
  await page.getByLabel(`Nota de ${ana}`).fill("7,5");
  await page.getByLabel(`Nota de ${beto}`).fill("11");
  await page.getByRole("button", { name: "Salvar notas" }).click();
  await expect(page.getByLabel(`Nota de ${beto}`)).toBeFocused();
  await expect(page.getByLabel(`Nota de ${beto}`)).toHaveAccessibleDescription(
    "Use um número de 0 a 10, como 7,5",
  );
  await expectNoAxeViolations(page);
  await page.getByLabel(`Nota de ${beto}`).fill("5");
  await page.getByRole("button", { name: "Salvar notas" }).click();
  await expect(page).toHaveURL(`/turmas/${classId}/notas`);

  await page.getByRole("link", { name: "Lançar notas de Projeto" }).click();
  await page.getByLabel(`Nota de ${ana}`).fill("9");
  await page.getByRole("checkbox", { name: "Não fez" }).nth(1).click();
  await page.getByRole("button", { name: "Salvar notas" }).click();
  await expect(page).toHaveURL(`/turmas/${classId}/notas`);

  const summary = page.getByRole("region", { name: "Situação dos alunos" });
  await expect(
    summary.getByRole("listitem").filter({ hasText: ana }),
  ).toContainText("Média 8,5");
  await expect(
    summary.getByRole("listitem").filter({ hasText: ana }),
  ).toContainText("Aprovado");
  await expect(
    summary.getByRole("listitem").filter({ hasText: beto }),
  ).toContainText("Abaixo da média");

  await page.getByRole("link", { name: "Encerrar turma" }).click();
  await expectNoAxeViolations(page);
  await page.getByRole("switch", { name: "Ajustar resultado" }).nth(1).click();
  await page.locator("label", { hasText: "Aprovar mesmo assim" }).click();
  await page.getByRole("button", { name: "Encerrar turma" }).click();
  await expect(
    page.getByText("Escreva a justificativa do ajuste").first(),
  ).toBeVisible();
  await page.getByLabel("Justificativa").fill("Recuperação concluída");
  await expect(page.getByText("2 aprovados, 0 não aprovados")).toBeVisible();
  await page.getByRole("button", { name: "Encerrar turma" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Encerrar turma" })
    .click();
  await expect(page).toHaveURL(`/turmas/${classId}`);
  await expect(page.getByText("Encerrada", { exact: true })).toBeVisible();

  await page.goto(`/alunos/${betoId}/turmas`);
  await expect(
    page.getByRole("link").filter({ hasText: className }),
  ).toContainText("Concluída");
  await expect(
    page.getByRole("link").filter({ hasText: className }),
  ).toContainText("Média final 1,67");
});
