import { expect, type Page, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

test.describe.configure({ mode: "serial" });

const timeZone = "America/Sao_Paulo";
const today = new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
const monthName = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  timeZone,
}).format(new Date());
const [year, month] = today.split("-").map(Number);
const previousMonth =
  month === 1
    ? `${year - 1}-12`
    : `${year}-${String(month - 1).padStart(2, "0")}`;

function login(page: Page, next: string) {
  return page.goto(`/dev/entrar?as=analise&next=${encodeURIComponent(next)}`);
}

async function addExpense(
  page: Page,
  cents: string,
  category: string,
  date?: string,
) {
  await page.getByRole("link", { name: "Adicionar lançamento" }).click();
  await page.getByLabel("Valor").fill(cents);
  await page.locator("label", { hasText: new RegExp(`^${category}$`) }).click();
  await page.locator("label", { hasText: /^Pix$/ }).click();
  if (date) {
    await page.locator("label", { hasText: /^Outra data$/ }).click();
    await page.getByRole("textbox", { name: "Data" }).fill(date);
  }
  await page.getByRole("button", { name: "Adicionar despesa" }).click();
  await expect(page).not.toHaveURL(/lancamentos/);
}

test("one expense is enough to see where the money went", async ({ page }) => {
  await login(page, "/ajustes/categorias");
  const expenses = page.getByRole("region", { name: "Despesas" });
  for (const name of ["Mercado", "Restaurantes"]) {
    await expenses.getByLabel("Nova categoria de despesa").fill(name);
    await expenses.getByLabel("Nova categoria de despesa").press("Enter");
    await expect(expenses.getByRole("link", { name })).toBeVisible();
  }

  await addExpense(page, "4590", "Restaurantes");
  await addExpense(page, "12000", "Mercado");

  await page.goto("/analises");
  await expect(
    page.getByRole("region", { name: `Gastos em ${monthName}` }),
  ).toContainText("R$ 165,90");
  const byCategory = page.getByRole("region", { name: "Por categoria" });
  await expect(byCategory.getByRole("link", { name: /Mercado/ })).toContainText(
    "72%",
  );
  await expect(
    byCategory.getByRole("link", { name: /Restaurantes/ }),
  ).toContainText("R$ 45,90");
  await expect(
    page.getByText("A tendência aparece a partir do 2º mês."),
  ).toBeVisible();
  await expectNoAxeViolations(page);
});

test("a category shows its own month and entries", async ({ page }) => {
  await login(page, "/analises");
  await page
    .getByRole("region", { name: "Por categoria" })
    .getByRole("link", { name: /Mercado/ })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Mercado" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: `Lançamentos de ${monthName}` }),
  ).toContainText("R$ 120,00");
  await expectNoAxeViolations(page);
});

test("a monthly limit shows how much is left on the home screen", async ({
  page,
}) => {
  await login(page, "/ajustes/categorias");
  await page.getByRole("link", { name: "Mercado" }).click();
  await page.getByLabel("Limite mensal").fill("10000");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page).toHaveURL("/ajustes/categorias");
  await expect(page.getByRole("link", { name: /Mercado/ })).toContainText(
    "Limite de R$ 100,00 por mês",
  );

  await page.goto("/");
  const limits = page.getByRole("region", { name: "Limites do mês" });
  await expect(limits).toContainText("R$ 120,00 de R$ 100,00");
  await expect(limits).toContainText("R$ 20,00 acima do limite");
  await expectNoAxeViolations(page);
});

test("the trend appears from the second month", async ({ page }) => {
  await login(page, "/transacoes");
  await addExpense(page, "9000", "Mercado", `${previousMonth}-10`);

  await page.goto("/analises");
  const trend = page.getByRole("figure", { name: /Últimos 12 meses/ });
  await expect(trend).toBeVisible();
  await expect(trend.getByRole("link", { name: /R\$\s90,00/ })).toBeVisible();
  await expect(trend.getByRole("link", { name: /parcial/ })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expectNoAxeViolations(page);
});
