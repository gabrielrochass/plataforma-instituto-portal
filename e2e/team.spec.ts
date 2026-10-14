import { type Browser, expect, type Page, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

function signIn(page: Page, alias: string, next: string) {
  return page.goto(`/dev/entrar?as=${alias}&next=${encodeURIComponent(next)}`);
}

async function freshPage(browser: Browser) {
  const context = await browser.newContext();
  return context.newPage();
}

function unique(tag: string) {
  return `${tag}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

test("a unit admin invites a teacher who joins from the link", async ({
  page,
  browser,
}) => {
  await signIn(page, unique("admin-ra"), "/equipe");
  await page.getByRole("link", { name: "Convidar" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Convidar professor" }),
  ).toBeVisible();
  await expect(page.getByRole("radio", { name: "Coordenação" })).toHaveCount(0);
  await page.getByRole("button", { name: "Gerar link de convite" }).click();
  await expect(page.getByLabel("Nome")).toHaveAccessibleDescription(
    "Informe o nome da pessoa",
  );
  await page.getByLabel("Nome").fill("Clara Mendes");
  await page.getByRole("button", { name: "Gerar link de convite" }).click();
  await expect(
    page.getByRole("heading", { name: "Convite para Clara Mendes pronto" }),
  ).toBeFocused();
  await expect(
    page.getByRole("link", { name: "Enviar no WhatsApp" }),
  ).toHaveAttribute("href", /^https:\/\/wa\.me\/\?text=/);
  await expectNoAxeViolations(page);
  const link = await page.getByRole("textbox", { name: "Link" }).inputValue();

  const guest = await freshPage(browser);
  await guest.goto(link);
  await expect(
    guest.getByText(
      "Olá, Clara Mendes! Você recebeu um convite para a equipe do Portal como Professor na unidade Recife Antigo.",
    ),
  ).toBeVisible();
  await expectNoAxeViolations(guest);
  await guest
    .getByLabel("E-mail")
    .fill(`e2e-${unique("convidada")}@portal.local`);
  await guest.getByLabel("Senha", { exact: true }).fill("uma frase só minha");
  await guest.getByRole("button", { name: "Criar acesso e entrar" }).click();
  await expect(guest).toHaveURL("/");
  await expect(
    guest.getByRole("heading", { level: 1, name: "Olá, Clara" }),
  ).toBeVisible();

  await guest.goto(link);
  await expect(
    guest.getByRole("heading", { name: "Este convite não vale mais" }),
  ).toBeVisible();

  await page.goto("/equipe");
  await expect(
    page.getByRole("link", {
      name: /Clara Mendes.*Professor em Recife Antigo/,
    }),
  ).toBeVisible();
  await guest.context().close();
});

test("a pending invite can be cancelled", async ({ page }) => {
  await signIn(page, unique("admin-bv"), "/equipe/convidar");
  const name = `Pessoa ${Date.now()}`;
  await page.getByLabel("Nome").fill(name);
  await page.getByRole("button", { name: "Gerar link de convite" }).click();
  await page.getByRole("link", { name: "Equipe" }).click();
  const cancel = page.getByRole("button", {
    name: `Cancelar convite de ${name}`,
  });
  await expect(cancel).toBeVisible();
  await expectNoAxeViolations(page);
  await cancel.click();
  await expect(cancel).toHaveCount(0);
});

test("teachers and unit admins only see what their role allows", async ({
  page,
}) => {
  await signIn(page, unique("prof-ra"), "/mais");
  await expect(page.getByRole("link", { name: /Equipe/ })).toHaveCount(0);
  for (const path of ["/equipe", "/unidades"]) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: "Você não tem acesso a esta página" }),
    ).toBeVisible();
  }
  await expectNoAxeViolations(page);

  await signIn(page, unique("admin-ra"), "/mais");
  await expect(page.getByRole("link", { name: /Equipe/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Unidades/ })).toHaveCount(0);
  await page.goto("/unidades");
  await expect(
    page.getByRole("heading", { name: "Você não tem acesso a esta página" }),
  ).toBeVisible();
});

test("people without a unit or deactivated stay out", async ({ page }) => {
  for (const alias of [unique("sem-vinculo"), unique("inativo")]) {
    await signIn(page, alias, "/turmas");
    await expect(page).toHaveURL("/sem-acesso");
    await expect(
      page.getByRole("heading", { name: "Sem acesso ao Portal" }),
    ).toBeVisible();
  }
  await expectNoAxeViolations(page);
});

test("a unit admin sends a new password link and deactivates a teacher", async ({
  page,
  browser,
}) => {
  const teacherAlias = unique("prof-ra");
  const teacher = await freshPage(browser);
  await signIn(teacher, teacherAlias, "/");
  await expect(teacher.getByRole("heading", { level: 1 })).toBeVisible();

  await signIn(page, unique("admin-ra"), "/equipe");
  await page
    .getByRole("link", { name: new RegExp(`Teste ${teacherAlias}`) })
    .click();
  await expect(
    page.getByText(`e2e-${teacherAlias}@portal.local`),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Gerar link para nova senha" })
    .click();
  const link = await page.getByRole("textbox", { name: "Link" }).inputValue();
  await expectNoAxeViolations(page);

  const reset = await freshPage(browser);
  await reset.goto(link);
  await reset.getByLabel("Nova senha").fill("senha nova da clara");
  await reset.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(reset).toHaveURL("/entrar?senha=nova");
  await expect(
    reset.getByText("Senha nova salva. Entre com ela."),
  ).toBeVisible();
  await reset.getByLabel("E-mail").fill(`e2e-${teacherAlias}@portal.local`);
  await reset.getByLabel("Senha", { exact: true }).fill("senha nova da clara");
  await reset.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(reset).toHaveURL("/");

  await page.getByRole("button", { name: "Desativar acesso" }).click();
  const dialog = page.getByRole("alertdialog");
  await expectNoAxeViolations(page);
  await dialog.getByRole("button", { name: "Desativar acesso" }).click();
  await expect(
    page.getByRole("button", { name: "Reativar acesso" }),
  ).toBeVisible();

  await teacher.goto("/turmas");
  await expect(teacher).toHaveURL("/sem-acesso");
  await teacher.context().close();
  await reset.context().close();
});

test("admin geral adds a unit", async ({ page }) => {
  await signIn(page, unique("admin-geral"), "/unidades");
  const code = `Z${Array.from({ length: 3 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join("")}`;
  await page.getByLabel("Sigla").fill("1");
  await page.getByRole("button", { name: "Criar unidade" }).click();
  await expect(page.getByLabel("Sigla")).toHaveAccessibleDescription(
    "Use de 2 a 6 letras, sem acento",
  );
  await page.getByLabel("Sigla").fill(code.toLowerCase());
  await page.getByLabel("Nome", { exact: true }).fill(`Unidade ${code}`);
  await page.getByRole("button", { name: "Criar unidade" }).click();
  await expect(
    page.getByRole("link", { name: new RegExp(`Unidade ${code}`) }),
  ).toBeVisible();
  await expectNoAxeViolations(page);
});
