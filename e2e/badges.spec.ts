import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";
import { createClass, registerMinor, signIn, unique } from "./helpers";

const photo = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEklEQVR4nGP4z8CAFWEXHbQSACj/P8Fu7N9hAAAAAElFTkSuQmCC",
  "base64",
);

test("a student gets a photo and a badge with a QR for attendance", async ({
  page,
}) => {
  test.slow();
  await signIn(page, unique("admin-ra"), "/");
  const classId = await createClass(page, `Crachá ${Date.now()}`);
  const name = `Bia ${Date.now()}`;
  const studentId = await registerMinor(page, classId, name);

  await page.getByLabel("Tirar ou escolher foto").setInputFiles({
    name: "foto.png",
    mimeType: "image/png",
    buffer: photo,
  });
  await expect(page.getByText("Foto salva")).toBeVisible();
  await page.reload();
  await expect(page.locator("header img").first()).toHaveAttribute(
    "src",
    /student-photos/,
  );
  await expectNoAxeViolations(page);

  await page.getByRole("link", { name: "Imprimir crachá" }).click();
  await expect(page).toHaveURL(`/alunos/${studentId}/cracha`);
  const badge = page.getByRole("article", { name: `Crachá de ${name}` });
  await expect(
    badge.getByRole("img", { name: `QR de presença de ${name}` }),
  ).toBeVisible();
  const token = (await badge.locator(".font-mono").textContent()) ?? "";
  await expectNoAxeViolations(page);

  await page.goto(`/alunos/${studentId}`);
  await page.getByRole("button", { name: "Gerar novo QR" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Gerar novo QR" })
    .click();
  await expect(
    page.getByText("QR novo gerado. Imprima o crachá de novo."),
  ).toBeVisible();
  await page.goto(`/alunos/${studentId}/cracha`);
  await expect(badge.locator(".font-mono")).not.toHaveText(token);

  await page.goto(`/turmas/${classId}`);
  await page.getByRole("link", { name: "Imprimir crachás" }).click();
  await expect(page).toHaveURL(`/turmas/${classId}/crachas`);
  await expect(
    page.getByRole("article", { name: `Crachá de ${name}` }),
  ).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(
    page.getByRole("button", { name: "Imprimir ou salvar em PDF" }),
  ).toBeHidden();
});
