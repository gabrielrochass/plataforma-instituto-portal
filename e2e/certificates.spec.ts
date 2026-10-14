import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";
import {
  createClass,
  markAllPresent,
  newPage,
  registerMinor,
  signIn,
  today,
  unique,
  weekdayLabel,
} from "./helpers";

test("coordination issues, prints and revokes certificates anyone can verify", async ({
  page,
  browser,
}) => {
  test.slow();
  const admin = await newPage(browser, unique("admin-ra"));

  await signIn(page, unique("prof-ra"), "/");
  const classId = await createClass(page, `Certificado ${Date.now()}`, {
    days: [weekdayLabel(today)],
    attendanceOnly: true,
  });
  const name = `Lara ${Date.now()}`;
  await registerMinor(page, classId, name);
  await page.goto("/chamada");
  await markAllPresent(page);
  await page.getByRole("button", { name: "Salvar chamada" }).click();
  await expect(page).not.toHaveURL(/chamada/);
  await page.goto(`/turmas/${classId}/encerrar`);
  await page.getByRole("button", { name: "Encerrar turma" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Encerrar turma" })
    .click();
  await expect(page).toHaveURL(`/turmas/${classId}`);
  await page.getByRole("link", { name: "Certificados" }).click();
  await expect(
    page.getByRole("button", { name: "Emitir certificados" }),
  ).toHaveCount(0);

  await admin.goto(`/turmas/${classId}/certificados`);
  await admin.getByRole("button", { name: "Emitir certificados" }).click();
  await expect(admin.getByText("1 certificado emitido")).toBeVisible();
  const row = admin.getByRole("listitem").filter({ hasText: name });
  const code = (await row.locator(".font-mono").textContent()) ?? "";
  expect(code).toMatch(
    /^[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/,
  );
  await expectNoAxeViolations(admin);

  await admin.getByRole("link", { name: "Imprimir todos" }).click();
  await expect(
    admin.getByRole("region", { name: `Certificado, ${name}` }),
  ).toContainText(code);
  await expectNoAxeViolations(admin);

  const visitor = await (await browser.newContext()).newPage();
  await visitor.goto(
    `/certificado?codigo=${code.toLowerCase().replaceAll("-", "")}`,
  );
  await expect(
    visitor.getByRole("heading", { name: "Certificado válido" }),
  ).toBeVisible();
  await expect(visitor.getByText(name)).toBeVisible();
  await expectNoAxeViolations(visitor);

  await admin.goto(`/turmas/${classId}/certificados`);
  await admin
    .getByRole("button", { name: `Revogar certificado de ${name}` })
    .click();
  const dialog = admin.getByRole("alertdialog");
  await dialog.getByLabel("Motivo").fill("Emitido por engano");
  await dialog.getByRole("button", { name: "Revogar" }).click();
  await expect(admin.getByText("Revogado: Emitido por engano")).toBeVisible();

  await visitor.reload();
  await expect(
    visitor.getByRole("heading", { name: "Certificado revogado" }),
  ).toBeVisible();
  await visitor.goto("/certificado?codigo=2222-2222-2222");
  await expect(
    visitor.getByRole("heading", { name: "Código não encontrado" }),
  ).toBeVisible();
});
