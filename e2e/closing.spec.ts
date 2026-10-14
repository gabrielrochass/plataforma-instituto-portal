import { expect, type Page, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { expectNoAxeViolations } from "./axe";
import "./env";

test.describe.configure({ mode: "serial" });

const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
}).format(new Date());
const [year, monthNumber] = today.split("-").map(Number);

function monthAgo(delta: number) {
  return new Date(Date.UTC(year, monthNumber - 1 - delta, 1))
    .toISOString()
    .slice(0, 7);
}

function nameOf(month: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T00:00:00Z`));
}

const month = today.slice(0, 7);
const previous = monthAgo(1);
const older = monthAgo(2);
const previousName = nameOf(previous);
const capitalized = previousName[0].toUpperCase() + previousName.slice(1);
const expenseId = "c1050000-0000-4000-8000-000000000021";

async function seed() {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error } = await client.auth.signInWithPassword({
    email: "e2e-fechamento@financial-tracker.local",
    password: "dev-only-local-password",
  });
  if (error) throw error;
  await client
    .from("month_closings")
    .delete()
    .gte("month", "2000-01-01")
    .throwOnError();
  await client
    .from("profiles")
    .update({ closing_snoozed_month: null })
    .not("id", "is", null)
    .throwOnError();
  const market = "c1050000-0000-4000-8000-000000000001";
  const salary = "c1050000-0000-4000-8000-000000000002";
  await client
    .from("categories")
    .upsert(
      [
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
  const row = (
    id: string,
    kind: "expense" | "income",
    cents: number,
    on: string,
  ) => ({
    id,
    kind,
    amount_cents: cents,
    occurred_on: on,
    description: kind === "income" ? "Salário" : "Mercado do mês",
    category_id: kind === "income" ? salary : market,
    payment_kind: "pix" as const,
  });
  await client
    .from("transactions")
    .upsert(
      [
        row(
          "c1050000-0000-4000-8000-000000000010",
          "income",
          300000,
          `${older}-05`,
        ),
        row(
          "c1050000-0000-4000-8000-000000000011",
          "expense",
          300000,
          `${older}-10`,
        ),
        row(
          "c1050000-0000-4000-8000-000000000020",
          "income",
          300000,
          `${previous}-05`,
        ),
        row(expenseId, "expense", 424000, `${previous}-10`),
        row(
          "c1050000-0000-4000-8000-000000000030",
          "expense",
          50000,
          `${month}-01`,
        ),
      ],
      { onConflict: "id", ignoreDuplicates: true },
    )
    .throwOnError();
}

function open(page: Page, next: string) {
  return page.goto(
    `/dev/entrar?as=fechamento&next=${encodeURIComponent(next)}`,
  );
}

test("a negative month shows in red and the ended month asks for a closing", async ({
  page,
}) => {
  await open(page, "/");
  await seed();
  await page.reload();
  const balance = page.getByRole("region", { name: /Saldo de/ });
  await expect(balance).toContainText("-R$ 500,00");
  await expect(balance).toContainText("Gastou mais do que recebeu");
  await expectNoAxeViolations(page);

  await page
    .getByRole("region", { name: `${capitalized} terminou` })
    .getByRole("link", { name: "Ver balanço" })
    .click();
  await expect(page).toHaveURL(`/balanco?mes=${previous}`);
  const report = page.getByRole("region", {
    name: `Saldo de ${previousName}`,
  });
  await expect(report).toContainText("-R$ 1.240,00");
  await expect(report).toContainText(
    `Pior que ${nameOf(older)}: R$ 1.240,00 a menos de saldo`,
  );
  await expect(
    page.getByText("Gastou 41% a mais do que recebeu"),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: `Mais gastos que em ${nameOf(older)}` }),
  ).toContainText("R$ 1.240,00 a mais");
  await expectNoAxeViolations(page);
});

test("closing locks the month until it is reopened", async ({ page }) => {
  await open(page, `/balanco?mes=${previous}`);
  await page.getByRole("button", { name: `Fechar ${previousName}` }).click();
  await expect(page.getByText(/^Fechado em/)).toBeVisible();

  await page.goto("/");
  await expect(page.getByText(`${capitalized} terminou`)).toHaveCount(0);

  await page.goto(`/transacoes?mes=${previous}`);
  await expect(page.getByText("Mês fechado")).toBeVisible();
  await page.goto(`/lancamentos/${expenseId}`);
  await expect(page.getByText("Mês fechado")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Salvar alterações" }),
  ).toBeDisabled();
  await expectNoAxeViolations(page);

  await page.goto(`/balanco?mes=${previous}`);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload();
  await expectNoAxeViolations(page);
  await page.getByRole("button", { name: "Reabrir mês" }).click();
  await expect(
    page.getByRole("button", { name: `Fechar ${previousName}` }),
  ).toBeVisible();
});

test("the ended month card can wait and the report stays in Análises", async ({
  page,
}) => {
  await open(page, "/");
  const prompt = page.getByRole("region", { name: `${capitalized} terminou` });
  await prompt.getByRole("button", { name: "Agora não" }).click();
  await expect(prompt).toHaveCount(0);
  await page.goto(`/analises?mes=${previous}`);
  const report = page.getByRole("link", {
    name: new RegExp(`Balanço de ${previousName}`),
  });
  await expect(report).toContainText("Aberto");
  await report.click();
  await expect(page).toHaveURL(`/balanco?mes=${previous}`);
});

test("the report fits a 320px screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await open(page, `/balanco?mes=${previous}`);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
