import { expect, type Page, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

test.describe.configure({ mode: "serial" });

const nextYear = `${new Date().getFullYear() + 1}-12-31`;

function login(page: Page, next: string) {
  return page.goto(`/dev/entrar?as=cofrinho&next=${encodeURIComponent(next)}`);
}

async function openJar(page: Page) {
  await login(page, "/cofrinhos");
  await page.getByRole("link", { name: /Viagem/ }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Viagem" }),
  ).toBeVisible();
}

function balance(page: Page) {
  return page.getByRole("region", { name: "Saldo do cofrinho" });
}

function total(page: Page) {
  return page.getByRole("region", { name: "Total guardado" });
}

test("creates a jar with a goal and what is already saved", async ({
  page,
}) => {
  await login(page, "/cofrinhos");
  await expect(page.getByText("Nenhum cofrinho ainda")).toBeVisible();
  await page.getByRole("link", { name: "Novo cofrinho" }).click();

  await page.getByLabel("Nome do cofrinho").fill("Viagem");
  await page.getByLabel("Meta").fill("1000000");
  await page.getByLabel("Prazo").fill(nextYear);
  await page.getByLabel("Quanto já tem guardado?").fill("200000");
  await page
    .locator("label", { has: page.getByRole("radio", { name: "Avião" }) })
    .click();
  await expectNoAxeViolations(page);
  await page.getByRole("button", { name: "Criar cofrinho" }).click();

  await expect(page).toHaveURL("/cofrinhos");
  await expect(total(page)).toContainText("R$ 2.000,00");
  await expect(page.getByRole("link", { name: /Viagem/ })).toContainText(
    "20% de R$ 10.000,00",
  );
  await expectNoAxeViolations(page);
});

test("deposits and withdrawals move the balance", async ({ page }) => {
  await openJar(page);
  const forecast = page.getByRole("region", { name: "Previsão" });
  await expect(forecast).toContainText(
    new RegExp(`Para chegar em dezembro de ${nextYear.slice(0, 4)}`),
  );
  await expect(forecast).toContainText("por mês");

  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByLabel("Valor")).toBeFocused();
  await page.getByLabel("Valor").fill("50000");
  await page.getByRole("button", { name: "Guardar R$ 500,00" }).click();
  await expect(balance(page)).toContainText("R$ 2.500,00");

  await page.getByRole("button", { name: "Retirar" }).click();
  await page.getByLabel("Valor").fill("300000");
  await page.getByRole("button", { name: "Retirar R$ 3.000,00" }).click();
  await expect(
    page.getByText("Este cofrinho tem R$ 2.500,00.").first(),
  ).toBeVisible();
  await page.getByLabel("Valor").fill("20000");
  await page.getByRole("button", { name: "Retirar R$ 200,00" }).click();
  await expect(balance(page)).toContainText("R$ 2.300,00");

  const history = page.getByRole("region", { name: "Movimentações" });
  await expect(history.getByRole("listitem")).toHaveCount(3);
  await expectNoAxeViolations(page);
});

test("a deleted movement can be brought back", async ({ page }) => {
  await openJar(page);
  await page
    .getByRole("button", { name: /Excluir movimentação: Retirada/ })
    .click();
  await expect(balance(page)).toContainText("R$ 2.500,00");
  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(balance(page)).toContainText("R$ 2.300,00");
});

test("editing a jar updates its goal", async ({ page }) => {
  await openJar(page);
  await page.getByRole("link", { name: "Editar" }).click();
  await page.getByLabel("Meta").fill("1200000");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(balance(page)).toContainText("19% de R$ 12.000,00");
});

test("an archived jar leaves the total", async ({ page }) => {
  await openJar(page);
  await page.getByRole("link", { name: "Editar" }).click();
  await page.getByRole("button", { name: "Arquivar" }).click();
  await expect(page).toHaveURL(/\/cofrinhos\/[^/]+$/);
  await page.goto("/cofrinhos");
  await expect(total(page)).toContainText("R$ 0,00");
  await expect(
    page
      .getByRole("region", { name: "Arquivados" })
      .getByRole("link", { name: /Viagem/ }),
  ).toBeVisible();
});
