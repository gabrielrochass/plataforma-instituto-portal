import { expect, type Locator, type Page, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

test.describe.configure({ mode: "serial" });

const expenseRed = "rgb(201, 55, 44)";
const incomeGreen = "rgb(26, 127, 55)";

function chip(scope: Locator | Page, name: string) {
  return scope.locator("label", { hasText: new RegExp(`^${name}$`) });
}

function option(page: Page, name: string) {
  return page.locator("label", { has: page.getByRole("radio", { name }) });
}

async function openNewEntry(page: Page) {
  await page.goto("/transacoes");
  await page.getByRole("link", { name: "Adicionar lançamento" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Novo lançamento" }),
  ).toBeVisible();
}

test("creates categories quickly in settings", async ({ page }) => {
  await page.goto("/ajustes/categorias");
  const expenses = page.getByRole("region", { name: "Despesas" });
  const income = page.getByRole("region", { name: "Receitas" });

  const newExpense = expenses.getByLabel("Nova categoria de despesa");
  await newExpense.fill("Mercado");
  await newExpense.press("Enter");
  await expect(expenses.getByRole("link", { name: "Mercado" })).toBeVisible();
  await expect(newExpense).toHaveValue("");
  await expect(newExpense).toBeFocused();

  await newExpense.fill("Restaurantes");
  await expenses.getByRole("button", { name: "Criar" }).click();
  await expect(
    expenses.getByRole("link", { name: "Restaurantes" }),
  ).toBeVisible();

  await income.getByLabel("Nova categoria de receita").fill("Salário");
  await income.getByLabel("Nova categoria de receita").press("Enter");
  await expect(income.getByRole("link", { name: "Salário" })).toBeVisible();

  await newExpense.fill("mercado");
  await newExpense.press("Enter");
  await expect(
    expenses.getByText("Já existe um item com esse nome"),
  ).toBeVisible();
  await expectNoAxeViolations(page);
});

test("logs an expense on Pix", async ({ page }) => {
  await openNewEntry(page);
  const submit = page.getByRole("button", { name: "Adicionar despesa" });
  await expect(submit).toHaveCSS("background-color", expenseRed);

  await page.getByLabel("Valor").fill("4590");
  await expect(page.getByLabel("Valor")).toHaveValue("45,90");
  await page.getByLabel("Descrição").fill("Almoço no centro");
  await chip(page, "Restaurantes").click();
  await chip(page, "Pix").click();
  await expectNoAxeViolations(page);
  await submit.click();

  await expect(page).toHaveURL("/transacoes");
  const row = page.getByRole("link", { name: /Almoço no centro/ });
  await expect(row).toContainText("R$ 45,90");
  await expect(row).toContainText("Pix");
  await expectNoAxeViolations(page);
});

test("logs income with the income colors", async ({ page }) => {
  await openNewEntry(page);
  await chip(page, "Receita").click();
  const submit = page.getByRole("button", { name: "Adicionar receita" });
  await expect(submit).toHaveCSS("background-color", incomeGreen);
  await expect(chip(page, "Restaurantes")).toBeHidden();

  await page.getByLabel("Valor").fill("500000");
  await chip(page, "Salário").click();
  await expect(page.getByRole("radio", { name: "Pix" })).toBeChecked();
  await submit.click();

  await expect(page).toHaveURL("/transacoes");
  await expect(page.getByRole("link", { name: /Salário/ })).toContainText(
    "+R$ 5.000,00",
  );
});

test("suggests the category from a known description", async ({ page }) => {
  await openNewEntry(page);
  await page.getByLabel("Descrição").fill("almoco no CENTRO");
  await page.getByLabel("Descrição").blur();
  await expect(page.getByRole("radio", { name: "Restaurantes" })).toBeChecked();
  await page.getByRole("button", { name: "Voltar" }).click();
  await expect(page).toHaveURL("/transacoes");
});

test("creates a category and a card without leaving the form", async ({
  page,
}) => {
  await openNewEntry(page);
  await page.getByLabel("Valor").fill("100000");
  await page.getByLabel("Descrição").fill("Televisão");

  await page.getByRole("button", { name: "Nova categoria" }).click();
  await page.getByLabel("Nova categoria").fill("Eletrônicos");
  await page.getByLabel("Nova categoria").press("Enter");
  await expect(page.getByRole("radio", { name: "Eletrônicos" })).toBeChecked();
  await expect(
    page.getByRole("button", { name: "Nova categoria" }),
  ).toBeFocused();

  await page.getByRole("button", { name: "Novo cartão" }).click();
  await page.getByLabel("Novo cartão").fill("Nubank");
  await option(page, "Ametista").click();
  await page.getByRole("button", { name: "Criar" }).click();
  await expect(page.getByRole("radio", { name: "Nubank" })).toBeChecked();

  await expectNoAxeViolations(page);
  await page.getByRole("button", { name: "Adicionar despesa" }).click();

  await expect(page).toHaveURL("/transacoes");
  await expect(
    page.getByRole("link", { name: /Televisão.*Nubank/ }),
  ).toContainText("R$ 1.000,00");
});

test("bill days turn on the bill preview", async ({ page }) => {
  await page.goto("/ajustes/cartoes");
  await page.getByRole("link", { name: /Nubank/ }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Editar cartão" }),
  ).toBeVisible();

  await page.getByText("Acompanhar fatura", { exact: true }).click();
  await expect(
    page.getByRole("switch", { name: "Acompanhar fatura" }),
  ).toBeChecked();
  await page.getByLabel("Melhor dia de compra").selectOption("3");
  await page.getByLabel("Dia de vencimento").selectOption("10");
  await expect(
    page.getByText(/Uma compra feita hoje entra na fatura/),
  ).toBeVisible();
  await expectNoAxeViolations(page);
  await page.getByRole("button", { name: "Salvar", exact: true }).click();

  await expect(page).toHaveURL("/ajustes/cartoes");
  await expect(page.getByRole("link", { name: /Nubank/ })).toContainText(
    "Melhor dia 3, vence dia 10",
  );
  await expectNoAxeViolations(page);

  await page.getByRole("link", { name: "Adicionar lançamento" }).click();
  await page.getByLabel("Valor").fill("2000");
  await chip(page, "Nubank").click();
  await expect(
    page.getByText(/Entra na fatura de .* vence em \d{2}\/\d{2}/),
  ).toBeVisible();
});

test("deletes a purchase and brings it back with undo", async ({ page }) => {
  await page.goto("/transacoes");
  await page.getByRole("link", { name: /Televisão/ }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Editar lançamento" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Excluir lançamento" }).click();

  await expect(page).toHaveURL("/transacoes");
  await expect(page.getByRole("link", { name: /Televisão/ })).toBeHidden();
  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(page.getByRole("link", { name: /Televisão/ })).toBeVisible();
});

test("edits and archives a category", async ({ page }) => {
  await page.goto("/ajustes/categorias");
  await page.getByRole("link", { name: "Mercado" }).click();
  await option(page, "Verde").click();
  await option(page, "Carrinho").click();
  await expectNoAxeViolations(page);
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page).toHaveURL("/ajustes/categorias");

  await page.getByRole("link", { name: "Mercado" }).click();
  await page.getByRole("button", { name: "Arquivar" }).click();
  await expect(page).toHaveURL("/ajustes/categorias");
  const archived = page.getByRole("region", { name: "Arquivados" });
  await expect(archived.getByRole("link", { name: "Mercado" })).toBeVisible();
});
