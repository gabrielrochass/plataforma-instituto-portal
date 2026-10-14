import { expect, type Page, type TestInfo, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { expectNoAxeViolations } from "./axe";
import "./env";

const password = "dev-only-local-password";
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const publicPages = ["/entrar", "/termos", "/privacidade"];

function emailOf(alias: string) {
  return `e2e-${alias}@portal.local`;
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SECRET_KEY as string,
    options,
  );
}

function freshEmail(tag: string, testInfo: TestInfo) {
  return `e2e-${tag}-${testInfo.project.name}-${Date.now()}@portal.local`;
}

async function createPerson(email: string) {
  const { data, error } = await admin().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Ana Souza" },
  });
  if (error) throw error;
  await admin()
    .rpc("dev_set_persona", { p_user_id: data.user.id, p_persona: "prof-ra" })
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

test("there is no public sign-up", async ({ page, request }) => {
  expect((await request.get("/cadastro")).status()).toBe(404);
  await page.goto("/entrar");
  await expect(
    page.getByText("Ainda não tem acesso? Peça um convite"),
  ).toBeVisible();
  const { error } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
    options,
  ).auth.signUp({ email: "e2e-intruso@portal.local", password });
  expect(error).not.toBeNull();
});

test("a person signs in and lands where they were going", async ({
  page,
}, testInfo) => {
  const email = freshEmail("entrar", testInfo);
  await createPerson(email);
  try {
    await page.goto("/entrar?next=%2Falunos");
    await fillCredentials(page, email, password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL("/alunos");
    await expect(
      page.getByRole("heading", { level: 1, name: "Alunos" }),
    ).toBeVisible();
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

test("installing works without a session", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.name).toBe("Portal");
  for (const icon of manifest.icons) {
    expect((await request.get(icon.src)).ok(), icon.src).toBe(true);
  }
  for (const path of ["/apple-icon.png", "/icon.svg", "/favicon.ico"]) {
    expect((await request.get(path)).ok(), path).toBe(true);
  }
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

  for (const path of ["/entrar", "/dev/ui"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(await violations(), path).toEqual([]);
  }
  await signIn(page, "csp", "/");
  for (const path of ["/", "/turmas", "/alunos", "/mais", "/ajustes/conta"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(await violations(), path).toEqual([]);
  }
});
