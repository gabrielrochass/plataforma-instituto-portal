import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

test.describe.configure({ mode: "serial" });

const longCategory = "Alimentação fora de casa e restaurantes";
const longCard = "Nubank Ultravioleta Mastercard Black PF";

test("a new user is guided to the first category", async ({ page }) => {
  await page.goto("/dev/entrar?as=novo&next=/lancamentos/novo");
  const newCategory = page.getByRole("textbox", { name: "Nova categoria" });
  await expect(newCategory).toBeVisible();
  await expect(newCategory).not.toBeFocused();

  await page.getByLabel("Valor").fill("1000");
  await page.getByRole("button", { name: "Adicionar despesa" }).click();
  await expect(page.locator("output")).toHaveText("Escolha uma categoria");
  await expect(newCategory).toBeFocused();
  await expectNoAxeViolations(page);

  await newCategory.fill(longCategory);
  await newCategory.press("Enter");
  await expect(page.getByRole("radio", { name: longCategory })).toBeChecked();
  await expect(page.locator("output")).toHaveText(
    `Categoria “${longCategory}” criada e selecionada`,
  );
});

test("pressing Enter on a card design creates the card, not the entry", async ({
  page,
}) => {
  await page.goto("/dev/entrar?as=novo&next=/lancamentos/novo");
  await page.getByRole("button", { name: "Novo cartão" }).click();
  await page.getByRole("textbox", { name: "Novo cartão" }).fill(longCard);
  await page.keyboard.press("Tab");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "Meia-noite" })).toBeChecked();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("radio", { name: longCard })).toBeChecked();
  await expect(page).toHaveURL("/lancamentos/novo");
});

test("long names stay inside a 320px screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/dev/entrar?as=novo&next=/lancamentos/novo");
  await expect(page.getByRole("radio", { name: longCard })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  const barOverflow = await page
    .locator("[data-entry-bar]")
    .evaluate((bar) => bar.scrollWidth - bar.clientWidth);
  expect(barOverflow).toBeLessThanOrEqual(0);
});
