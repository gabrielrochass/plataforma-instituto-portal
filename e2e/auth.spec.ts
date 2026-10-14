import { readFile } from "node:fs/promises";
import { expect, type Page, type TestInfo, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { expectNoAxeViolations } from "./axe";
import "./env";

const password = "dev-only-local-password";
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const publicPages = ["/entrar", "/cadastro", "/termos", "/privacidade"];

function emailOf(alias: string) {
  return `e2e-${alias}@financial-tracker.local`;
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SECRET_KEY as string,
    options,
  );
}

function freshEmail(tag: string, testInfo: TestInfo) {
  return `e2e-${tag}-${testInfo.project.name}-${Date.now()}@financial-tracker.local`;
}

async function createPerson(email: string) {
  const { data, error } = await admin().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
    options,
  );
  await client.auth.signInWithPassword({ email, password });
  await client
    .from("profiles")
    .update({ onboarding_done_at: new Date().toISOString() })
    .eq("id", data.user.id)
    .throwOnError();
}

async function removePerson(email: string) {
  const { data } = await admin().auth.admin.listUsers({ perPage: 1000 });
  const user = data.users.find((candidate) => candidate.email === email);
  if (user) await admin().auth.admin.deleteUser(user.id);
}

async function fillCredentials(page: Page, email: string, secret: string) {
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(secret);
}

function signIn(page: Page, alias: string, next: string) {
  return page.goto(`/dev/entrar?as=${alias}&next=${encodeURIComponent(next)}`);
}

async function seedTransactions(alias: string, count: number) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
    options,
  );
  const { error } = await client.auth.signInWithPassword({
    email: emailOf(alias),
    password,
  });
  if (error) throw error;
  const categoryId = "0e5b0000-0000-4000-8000-000000000001";
  await client
    .from("categories")
    .upsert(
      {
        id: categoryId,
        kind: "expense",
        name: "Mercado",
        icon: "shopping-cart",
        color: "chart-3",
      },
      { onConflict: "id", ignoreDuplicates: true },
    )
    .throwOnError();
  const rows = Array.from({ length: count }, (_, index) => ({
    id: `0e5b0000-0000-4000-8000-${String(index + 10).padStart(12, "0")}`,
    kind: "expense",
    amount_cents: 1000 + index,
    occurred_on: `2026-09-${String((index % 28) + 1).padStart(2, "0")}`,
    description: `Compra ${index + 1}`,
    category_id: categoryId,
    payment_kind: "pix",
  }));
  for (let start = 0; start < rows.length; start += 500) {
    await client
      .from("transactions")
      .upsert(rows.slice(start, start + 500), {
        onConflict: "id",
        ignoreDuplicates: true,
      })
      .throwOnError();
  }
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`public pages meet WCAG in the ${colorScheme} theme`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    for (const path of publicPages) {
      await page.goto(path);
      await expectNoAxeViolations(page);
    }
  });
}

test("public pages fit a 320px screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  for (const path of publicPages) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

async function personClient(email: string, secret: string) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
    options,
  );
  const { error } = await client.auth.signInWithPassword({
    email,
    password: secret,
  });
  if (error) throw error;
  return client;
}

async function answerAccount(page: Page, email: string, secret: string) {
  const name = page.getByLabel("Seu nome");
  await expect(name).toBeFocused();
  await name.fill("Ana Souza");
  await name.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Prazer, Ana. Qual é o seu e-mail?" }),
  ).toBeVisible();
  await page.getByLabel("E-mail").fill(email);
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Senha", { exact: true }).fill(secret);
  await page.getByRole("button", { name: "Criar conta grátis" }).click();
}

test("a new person answers one question at a time and lands ready", async ({
  page,
}, testInfo) => {
  const email = freshEmail("cadastro", testInfo);
  const secret = "uma frase só minha";
  try {
    await page.goto("/entrar?next=/cofrinhos");
    await page.getByRole("link", { name: "Criar conta grátis" }).click();
    await expect(page).toHaveURL("/cadastro?next=%2Fcofrinhos");
    await expectNoAxeViolations(page);

    const name = page.getByLabel("Seu nome");
    await name.fill("Ana Souza");
    await name.press("Enter");
    await page.getByLabel("E-mail").fill(email.toUpperCase());
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByText("Passo 3 de 5")).toBeVisible();
    await page.getByLabel("Senha", { exact: true }).fill(secret);
    await page.getByRole("button", { name: "Voltar" }).click();
    await expect(page.getByLabel("E-mail")).toHaveValue(email.toUpperCase());
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByLabel("Senha", { exact: true })).toHaveValue(secret);
    await page.getByRole("button", { name: "Mostrar senha" }).click();
    await expect(page.getByLabel("Senha", { exact: true })).toHaveAttribute(
      "type",
      "text",
    );
    await expectNoAxeViolations(page);
    await page.getByRole("button", { name: "Criar conta grátis" }).click();

    await expect(page).toHaveURL("/comecar?next=%2Fcofrinhos");
    await expect(
      page.getByRole("heading", { name: "Onde você mais gasta?" }),
    ).toBeFocused();
    await expect(page.getByRole("checkbox", { name: "Mercado" })).toBeChecked();
    await page
      .getByRole("checkbox", { name: "Lazer" })
      .uncheck({ force: true });
    await page.getByLabel("Outra categoria").fill("Academia");
    await page.getByLabel("Outra categoria").press("Enter");
    await expect(
      page.getByRole("checkbox", { name: "Academia" }),
    ).toBeChecked();
    await expectNoAxeViolations(page);
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(
      page.getByRole("heading", { name: "Você usa cartão de crédito?" }),
    ).toBeVisible();
    await page.getByRole("radio", { name: "Sim" }).check({ force: true });
    await page.getByLabel("Nome do cartão").fill("Roxinho");
    await page.getByRole("radio", { name: "Ametista" }).check({ force: true });
    await expectNoAxeViolations(page);
    await page.getByRole("button", { name: "Concluir" }).click();

    await expect(page).toHaveURL("/cofrinhos");
    await expect(
      page.getByRole("dialog", { name: "Boas-vindas ao Contadinho" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Agora não" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    const client = await personClient(email, secret);
    const { data: categories } = await client
      .from("categories")
      .select("name")
      .throwOnError();
    const names = categories?.map((row) => row.name) ?? [];
    expect(names).toEqual(
      expect.arrayContaining(["Mercado", "Academia", "Salário"]),
    );
    expect(names).not.toContain("Lazer");
    const { data: cards } = await client
      .from("cards")
      .select("name, design")
      .throwOnError();
    expect(cards).toEqual([{ name: "Roxinho", design: "ametista" }]);

    await page.goto("/ajustes/conta");
    await expect(page.getByText("Ana Souza")).toBeVisible();
    await page.getByRole("button", { name: "Sair", exact: true }).click();
    await expect(page).toHaveURL("/entrar");
    await fillCredentials(page, email, secret);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL("/");
  } finally {
    await removePerson(email);
  }
});

test("skipping the setup still lands in the app", async ({
  page,
}, testInfo) => {
  const email = freshEmail("pular", testInfo);
  try {
    await page.goto("/cadastro");
    await answerAccount(page, email, password);
    await expect(page).toHaveURL("/comecar");
    await page.getByRole("button", { name: "Pular" }).click();
    await page.getByRole("radio", { name: "Não" }).check({ force: true });
    await page.getByRole("button", { name: "Concluir" }).click();
    await expect(page).toHaveURL("/");
    const client = await personClient(email, password);
    const { count } = await client
      .from("categories")
      .select("id", { count: "exact", head: true })
      .throwOnError();
    expect(count).toBe(0);
  } finally {
    await removePerson(email);
  }
});

test("sign-up explains each answer and catches a taken e-mail", async ({
  page,
}, testInfo) => {
  const email = freshEmail("repetido", testInfo);
  await createPerson(email);
  try {
    await page.goto("/cadastro");
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByLabel("Seu nome")).toHaveAccessibleDescription(
      "Digite como quer ser chamado.",
    );
    await page.getByLabel("Seu nome").fill("Ana");
    await page.getByRole("button", { name: "Continuar" }).click();

    const field = page.getByLabel("E-mail");
    await field.fill("ana");
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(field).toHaveAccessibleDescription("Falta o @ no e-mail?");
    await field.fill("ana@");
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(field).toHaveAccessibleDescription(
      "Digite um e-mail válido, como nome@exemplo.com.",
    );
    await expectNoAxeViolations(page);
    await field.fill(email);
    await page.getByRole("button", { name: "Continuar" }).click();

    const secret = page.getByLabel("Senha", { exact: true });
    await secret.fill("curta");
    await page.getByRole("button", { name: "Criar conta grátis" }).click();
    await expect(secret).toHaveAccessibleDescription(
      "Use pelo menos 8 caracteres.",
    );
    await secret.fill(password);
    await page.getByRole("button", { name: "Criar conta grátis" }).click();

    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      "Já existe uma conta com esse e-mail.",
    );
    await expect(
      page.getByRole("link", { name: "Entrar com ele" }),
    ).toBeVisible();
    await expect(page.getByLabel("E-mail")).toHaveValue(email);
  } finally {
    await removePerson(email);
  }
});

test("a wrong password and an unknown e-mail get the same answer", async ({
  page,
}, testInfo) => {
  const email = freshEmail("senha-errada", testInfo);
  await createPerson(email);
  try {
    await page.goto("/entrar");
    const alert = page.getByRole("main").getByRole("alert");
    await fillCredentials(page, email, "senha-errada");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(alert).toHaveText("E-mail ou senha incorretos.");
    await expectNoAxeViolations(page);

    await fillCredentials(page, `ninguem-${email}`, password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(alert).toHaveText("E-mail ou senha incorretos.");
    await expect(page).toHaveURL("/entrar");
  } finally {
    await removePerson(email);
  }
});

test("changing the password asks for the current one", async ({
  page,
}, testInfo) => {
  const email = freshEmail("trocar-senha", testInfo);
  const newSecret = "outra frase bem minha";
  await createPerson(email);
  try {
    await page.goto("/entrar?next=/ajustes/conta");
    await fillCredentials(page, email, password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.getByRole("link", { name: /Alterar senha/ }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Alterar senha" }),
    ).toBeVisible();
    await expectNoAxeViolations(page);

    await page.getByLabel("Senha atual").fill("senha-errada");
    await page.getByLabel("Nova senha").fill(newSecret);
    await page.getByRole("button", { name: "Alterar senha" }).click();
    await expect(page.getByLabel("Senha atual")).toHaveAccessibleDescription(
      "A senha atual está incorreta.",
    );

    await page.getByLabel("Senha atual").fill(password);
    await page.getByRole("button", { name: "Alterar senha" }).click();
    await expect(page).toHaveURL("/ajustes/conta");
    await expect(page.getByText("Senha alterada.")).toBeVisible();

    await page.getByRole("button", { name: "Sair", exact: true }).click();
    await fillCredentials(page, email, newSecret);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL("/");
  } finally {
    await removePerson(email);
  }
});

test("Sair ends the session on this device", async ({ page }) => {
  await signIn(page, "sair", "/ajustes/conta");
  await expect(
    page.getByRole("heading", { level: 1, name: "Conta" }),
  ).toBeVisible();
  await expect(page.getByText(emailOf("sair"))).toBeVisible();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL("/entrar");
  await expect(
    page.getByRole("button", { name: "Entrar", exact: true }),
  ).toBeVisible();
});

test("Sair de todos os aparelhos ends the session", async ({ page }) => {
  await signIn(page, "sair-todos", "/ajustes/conta");
  await page
    .getByRole("button", { name: "Sair de todos os aparelhos" })
    .click();
  await expect(page).toHaveURL("/entrar");
});

test("deleting the account erases it", async ({ page }) => {
  await signIn(page, "excluir", "/ajustes/conta/excluir");
  await expectNoAxeViolations(page);
  await page
    .getByRole("checkbox", { name: /Entendo que isso apaga tudo/ })
    .check();
  await page.getByRole("button", { name: "Excluir conta" }).click();
  await expect(page).toHaveURL("/entrar?conta=excluida");
  await expect(page.getByRole("status")).toContainText(
    "Sua conta foi excluída",
  );
  const { data, error } = await admin().auth.admin.listUsers({
    perPage: 1000,
  });
  if (error) throw error;
  expect(data.users.some((user) => user.email === emailOf("excluir"))).toBe(
    false,
  );
});

test("exports 2.500 entries to a spreadsheet", async ({ page }) => {
  await signIn(page, "exportar", "/ajustes/conta/exportar");
  await seedTransactions("exportar", 2500);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar Lançamentos" }).click();
  const csv = await readFile(await (await download).path(), "utf8");
  expect(csv.charCodeAt(0)).toBe(0xfeff);
  const lines = csv.slice(1).trimEnd().split("\r\n");
  expect(lines).toHaveLength(2501);
  expect(lines[0]).toBe(
    '"Data";"Tipo";"Valor";"Descrição";"Categoria";"Pagamento";"Cartão";"Vencimento da fatura";"Parcela"',
  );
  expect(lines[1]).toMatch(
    /^"2026-09-01";"Despesa";"\d+,\d{2}";"Compra \d+";"Mercado";"Pix";"";"";""$/,
  );
  expect(lines.at(-1)).toMatch(/^"2026-09-28";/);
  const descriptions = new Set(
    lines.slice(1).map((line) => line.split(";")[3]),
  );
  expect(descriptions.size).toBe(2500);
  await expect(page.getByRole("status")).toHaveText(
    "Lançamentos: 2.500 linhas baixadas",
  );
  await expectNoAxeViolations(page);
});

test("installing works without a session", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.shortcuts[0].url).toBe("/lancamentos/novo");
  const icons = [...manifest.icons, ...manifest.shortcuts[0].icons];
  for (const icon of icons) {
    expect((await request.get(icon.src)).ok(), icon.src).toBe(true);
  }
  expect((await request.get("/apple-icon.png")).ok()).toBe(true);
});

test("pages send security headers", async ({ request }) => {
  const headers = (await request.get("/entrar")).headers();
  expect(headers["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("pages run under the content security policy", async ({ page }) => {
  await page.addInitScript(() => {
    const store = window as unknown as { violations: string[] };
    store.violations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      store.violations.push(`${event.violatedDirective} ${event.blockedURI}`);
    });
  });
  const violations = () =>
    page.evaluate(
      () => (window as unknown as { violations: string[] }).violations,
    );

  for (const path of ["/entrar", "/cadastro", "/dev/ui"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(await violations(), path).toEqual([]);
  }
  await signIn(page, "csp", "/");
  for (const path of [
    "/",
    "/cofrinhos",
    "/ajustes/conta",
    "/lancamentos/novo",
  ]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(await violations(), path).toEqual([]);
  }
});
