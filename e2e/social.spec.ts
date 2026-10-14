import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";
import {
  addDays,
  createClass,
  newPage,
  registerMinor,
  signIn,
  today,
  unique,
} from "./helpers";

test("coordination keeps a versioned social profile with consent and audit", async ({
  page,
}) => {
  test.slow();
  await signIn(page, unique("admin-ra"), "/");
  const classId = await createClass(page, `Social ${Date.now()}`);
  const name = `Iara ${Date.now()}`;
  const studentId = await registerMinor(page, classId, name);
  await expect(page.getByText("Ficha social pendente")).toBeVisible();

  await page.getByRole("link", { name: "Ficha social" }).click();
  await expectNoAxeViolations(page);
  await page.getByRole("link", { name: "Preencher ficha" }).click();
  await expect(
    page.getByText("Cor ou raça, deficiência e saúde são dados sensíveis."),
  ).toBeVisible();
  await page.getByLabel("Data da avaliação").fill(addDays(today, -30));
  await page.getByLabel("Pessoas que moram na casa").fill("4");
  await page.getByLabel("Renda total da família por mês").fill("150000");
  await page.locator("label", { hasText: "Bolsa Família" }).click();
  await page
    .getByLabel("Trabalho", { exact: true })
    .selectOption({ label: "Procurando trabalho" });
  await expectNoAxeViolations(page);
  await page.getByRole("button", { name: "Salvar ficha" }).click();
  await expect(page).toHaveURL(`/alunos/${studentId}/ficha`);
  await expect(
    page.getByText("R$ 1.500,00, R$ 375,00 por pessoa"),
  ).toBeVisible();
  await expect(page.getByText("Ficha social pendente")).toHaveCount(0);

  await page.getByRole("link", { name: "Dados", exact: true }).click();
  await page
    .getByRole("button", { name: "Registrar termo de Dados sensíveis" })
    .click();
  await expect(page.getByText("Termo registrado")).toBeVisible();
  await expectNoAxeViolations(page);

  await page.goto(`/alunos/${studentId}/ficha/nova`);
  await page.getByLabel("Renda total da família por mês").fill("250000");
  await page.getByLabel("Cor ou raça (IBGE)").selectOption({ label: "Preta" });
  await page.getByRole("button", { name: "Salvar ficha" }).click();
  await expect(page).toHaveURL(`/alunos/${studentId}/ficha`);
  await expect(page.getByText("Preta")).toBeVisible();
  const comparison = page.getByRole("region", { name: /Comparação de/ });
  await expect(
    comparison.getByRole("listitem").filter({ hasText: "Renda total" }),
  ).toContainText("Mudou");
  await expect(
    comparison.getByRole("listitem").filter({ hasText: "Pessoas que moram" }),
  ).not.toContainText("Mudou");
  await expectNoAxeViolations(page);

  await page.getByLabel("Situação").selectOption({ label: "Trabalhando" });
  await page.getByRole("checkbox", { name: "Com carteira assinada" }).click();
  await page.getByLabel("Onde (opcional)").fill("Padaria do bairro");
  await page.getByRole("button", { name: "Registrar situação" }).click();
  await expect(page.getByText("Padaria do bairro")).toBeVisible();

  await page.getByRole("link", { name: "Dados", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Quem acessou" }),
  ).toContainText("consultou a ficha social");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar todos os dados" }).click();
  const file = JSON.parse(
    await readFile(await (await download).path(), "utf8"),
  );
  expect(file.aluno.full_name).toBe(name);
  expect(file.fichas_sociais).toHaveLength(2);
  expect(file.egressos[0].organization).toBe("Padaria do bairro");
});

test("teachers never reach the social profile", async ({ page, browser }) => {
  test.slow();
  const admin = await newPage(browser, unique("admin-ra"));
  await admin.context().close();

  await signIn(page, unique("prof-ra"), "/");
  const classId = await createClass(page, `Prof ${Date.now()}`);
  const studentId = await registerMinor(page, classId, `Rui ${Date.now()}`);
  await expect(page.getByRole("link", { name: "Ficha social" })).toHaveCount(0);
  for (const path of ["ficha", "dados", "ficha/nova"]) {
    await page.goto(`/alunos/${studentId}/${path}`);
    await expect(
      page.getByRole("heading", { name: "Página não encontrada" }),
    ).toBeVisible();
  }
});

test("admin geral anonymizes on request", async ({ page }) => {
  test.slow();
  await signIn(page, unique("admin-geral"), "/");
  const classId = await createClass(page, `Anon ${Date.now()}`);
  const studentId = await registerMinor(page, classId, `Zoe ${Date.now()}`);
  await page.goto(`/alunos/${studentId}/dados`);
  await page.getByRole("button", { name: "Anonimizar" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(
    dialog.getByRole("button", { name: "Anonimizar" }),
  ).toBeDisabled();
  await dialog.getByLabel("Confirmação").fill("anonimizar");
  await dialog.getByRole("button", { name: "Anonimizar" }).click();
  await expect(
    page.getByText("Este cadastro foi anonimizado a pedido do titular."),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: "Pessoa anonimizada" }),
  ).toBeVisible();
  await page.goto(`/turmas/${classId}/alunos`);
  await expect(page.getByText("Pessoa anonimizada")).toBeVisible();
});
