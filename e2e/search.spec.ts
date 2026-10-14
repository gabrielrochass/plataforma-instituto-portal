import { expect, type Page, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { expectNoAxeViolations } from "./axe";
import "./env";

test.describe.configure({ mode: "serial" });

const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
}).format(new Date());
const month = today.slice(0, 7);
const [year, monthNumber] = month.split("-").map(Number);
const previous = new Date(Date.UTC(year, monthNumber - 2, 1))
  .toISOString()
  .slice(0, 7);

async function seed() {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error } = await client.auth.signInWithPassword({
    email: "e2e-busca@financial-tracker.local",
    password: "dev-only-local-password",
  });
  if (error) throw error;
  const restaurants = "5eac0000-0000-4000-8000-000000000001";
  const market = "5eac0000-0000-4000-8000-000000000002";
  const salary = "5eac0000-0000-4000-8000-000000000003";
  const card = "5eac0000-0000-4000-8000-000000000010";
  await client
    .from("categories")
    .upsert(
      [
        {
          id: restaurants,
          kind: "expense",
          name: "Restaurantes",
          icon: "utensils",
          color: "chart-2",
        },
        {
          id: market,
          kind: "expense",
          name: "Mercado",
          icon: "shopping-cart",
          color: "chart-3",
        },
        {
          id: salary,
          kind: "income",
          name: "Salário",
          icon: "briefcase",
          color: "chart-1",
        },
      ],
      { onConflict: "id", ignoreDuplicates: true },
    )
    .throwOnError();
  await client
    .from("cards")
    .upsert(
      { id: card, name: "Nubank", design: "ametista" },
      { onConflict: "id", ignoreDuplicates: true },
    )
    .throwOnError();
  await client
    .from("transactions")
    .upsert(
      [
        {
          id: "5eac0000-0000-4000-8000-000000000020",
          kind: "expense",
          amount_cents: 1500,
          occurred_on: `${previous}-15`,
          description: "Café da manhã",
          category_id: restaurants,
          payment_kind: "pix",
        },
        {
          id: "5eac0000-0000-4000-8000-000000000021",
          kind: "expense",
          amount_cents: 800,
          occurred_on: `${month}-02`,
          description: "Café expresso",
          category_id: restaurants,
          payment_kind: "card",
          card_id: card,
        },
        {
          id: "5eac0000-0000-4000-8000-000000000022",
          kind: "expense",
          amount_cents: 25000,
          occurred_on: `${month}-03`,
          description: "Mercado Extra",
          category_id: market,
          payment_kind: "card",
          card_id: card,
        },
        {
          id: "5eac0000-0000-4000-8000-000000000023",
          kind: "income",
          amount_cents: 500000,
          occurred_on: `${month}-01`,
          description: "Salário",
          category_id: salary,
          payment_kind: "pix",
        },
      ],
      { onConflict: "id", ignoreDuplicates: true },
    )
    .throwOnError();
}

function open(page: Page) {
  return page.goto(
    `/dev/entrar?as=busca&next=${encodeURIComponent("/transacoes")}`,
  );
}

function summary(page: Page) {
  return page.getByRole("main").getByRole("status");
}

test("search finds entries in any month and ignores accents", async ({
  page,
}) => {
  await open(page);
  await seed();
  await page.reload();
  await page
    .getByRole("searchbox", { name: "Buscar lançamentos" })
    .fill("cafe");
  await expect(page).toHaveURL(/q=cafe/);
  await expect(summary(page)).toContainText("2 resultados");
  await expect(page.getByText("Café da manhã")).toBeVisible();
  await expect(page.getByText("Café expresso")).toBeVisible();
  await expect(page.getByText("Mercado Extra")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Mês anterior" })).toHaveCount(0);
  await expectNoAxeViolations(page);
});

test("filters narrow the month and stay when the month changes", async ({
  page,
}) => {
  await open(page);
  await page
    .getByRole("combobox", { name: "Categoria" })
    .selectOption({ label: "Mercado" });
  await expect(page).toHaveURL(/categoria=/);
  await expect(summary(page)).toContainText("1 lançamento");
  await expect(page.getByText("Mercado Extra")).toBeVisible();
  await expect(page.getByText("Café expresso")).toHaveCount(0);
  await expectNoAxeViolations(page);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload();
  await expectNoAxeViolations(page);

  await page.getByRole("link", { name: "Mês anterior" }).click();
  await expect(page).toHaveURL(new RegExp(`mes=${previous}.*categoria=`));
  await expect(page.getByText("Nenhum lançamento encontrado")).toBeVisible();
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await expect(page).toHaveURL(`/transacoes?mes=${previous}`);
  await expect(page.getByText("Café da manhã")).toBeVisible();
});

test("the payment filter shows one card", async ({ page }) => {
  await open(page);
  await page
    .getByRole("combobox", { name: "Pagamento" })
    .selectOption({ label: "Nubank" });
  await expect(summary(page)).toContainText("2 lançamentos");
  await expect(summary(page)).toContainText("R$ 258,00");
  await page
    .getByRole("combobox", { name: "Tipo" })
    .selectOption({ label: "Receitas" });
  await expect(summary(page)).toContainText("0 lançamentos");
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await expect(page).toHaveURL(`/transacoes?mes=${month}`);
  await expect(summary(page)).toContainText("3 lançamentos");
});
