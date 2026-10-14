import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";
import { newPage, signIn, unique } from "./helpers";

test("coordination posts to a unit and teachers confirm reading", async ({
  page,
  browser,
}) => {
  test.slow();
  const admin = await newPage(browser, unique("admin-ra"));
  await admin.goto("/avisos/novo");
  await expectNoAxeViolations(admin);
  await admin.getByRole("button", { name: "Publicar aviso" }).click();
  await expect(admin.getByText("Escreva um título.").first()).toBeVisible();
  const title = `Reunião ${Date.now()}`;
  await admin.getByLabel("Título").fill(title);
  await admin.getByLabel("Mensagem").fill("Sexta, 14h, na sala 2.");
  await admin.getByRole("button", { name: "Publicar aviso" }).click();
  await expect(admin).toHaveURL("/avisos");
  const posted = admin.getByRole("article", { name: title });
  await expect(posted).toContainText("0 pessoas leram");
  await expectNoAxeViolations(admin);

  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await signIn(page, unique("prof-ra"), "/");
  await page.getByRole("link", { name: /avisos? novos?/ }).click();
  const article = page.getByRole("article", { name: title });
  await expect(article).toContainText("Novo");
  await article.getByRole("button", { name: "Copiar para WhatsApp" }).click();
  await expect(page.getByText("Texto copiado")).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied.replaceAll("\r\n", "\n")).toBe(
    `*${title}*\n\nSexta, 14h, na sala 2.`,
  );
  await article.getByRole("button", { name: "Marcar como lido" }).click();
  await expect(
    article.getByRole("button", { name: "Marcar como lido" }),
  ).toHaveCount(0);
  await expect(
    article.getByRole("button", { name: `Arquivar aviso ${title}` }),
  ).toHaveCount(0);

  const other = await newPage(browser, unique("prof-bv"));
  await other.goto("/avisos");
  await expect(other.getByRole("article", { name: title })).toHaveCount(0);

  await admin.reload();
  await expect(posted).toContainText("1 pessoa leu");
  await posted.getByRole("button", { name: `Arquivar aviso ${title}` }).click();
  await expect(admin.getByText("Aviso arquivado")).toBeVisible();
  await expect(posted).toHaveCount(0);
});
