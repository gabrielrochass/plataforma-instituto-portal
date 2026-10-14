import { expect, type Page, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { expectNoAxeViolations } from "./axe";
import "./env";

test.describe.configure({ mode: "serial" });

async function resetTour() {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error } = await client.auth.signInWithPassword({
    email: "e2e-tour@financial-tracker.local",
    password: "dev-only-local-password",
  });
  if (error) throw error;
  await client
    .from("profiles")
    .update({ onboarding_done_at: null })
    .not("id", "is", null)
    .throwOnError();
}

async function openFresh(page: Page) {
  await page.goto("/dev/entrar?as=tour&next=%2F");
  await resetTour();
  await page.reload();
}

function dialog(page: Page) {
  return page.getByRole("dialog");
}

test("the first visit walks through each button", async ({ page }) => {
  await openFresh(page);
  await expect(dialog(page)).toHaveAccessibleName("Boas-vindas ao Contadinho");
  await expect(page.getByRole("button", { name: "Começar" })).toBeFocused();
  await expectNoAxeViolations(page);

  await page.getByRole("button", { name: "Começar" }).click();
  await expect(dialog(page)).toHaveAccessibleName("Anote aqui");
  await expect(dialog(page)).toContainText("1 de 5");
  await expectNoAxeViolations(page);

  for (const title of ["Transações", "Cofrinhos", "Análises", "Ajustes"]) {
    await page.getByRole("button", { name: "Próximo" }).click();
    await expect(dialog(page)).toHaveAccessibleName(title);
  }
  await page.keyboard.press("ArrowLeft");
  await expect(dialog(page)).toHaveAccessibleName("Análises");
  await page.keyboard.press("ArrowRight");
  await page.getByRole("button", { name: "Próximo" }).click();
  await expect(dialog(page)).toHaveAccessibleName("Pronto. Agora é só contar.");
  await expect(
    dialog(page).getByRole("link", { name: "Anotar primeiro gasto" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fechar" }).click();
  await expect(dialog(page)).toHaveCount(0);
  await page.waitForLoadState("networkidle");

  await page.reload();
  await expect(page.getByRole("heading", { name: "Início" })).toBeVisible();
  await expect(dialog(page)).toHaveCount(0);
});

test("the tour can be replayed from Ajustes and skipped with Esc", async ({
  page,
}) => {
  await page.goto("/dev/entrar?as=tour&next=%2Fajustes");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.getByRole("link", { name: /Rever o tour/ }).click();
  await expect(dialog(page)).toHaveAccessibleName("Boas-vindas ao Contadinho");
  await page.getByRole("button", { name: "Começar" }).click();
  await expectNoAxeViolations(page);
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toHaveCount(0);
  await expect(page).toHaveURL("/");
});

test("the tour fits a 320px screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await openFresh(page);
  await page.getByRole("button", { name: "Começar" }).click();
  await expect(dialog(page)).toHaveAccessibleName("Anote aqui");
  await expect
    .poll(async () => {
      const box = await dialog(page).boundingBox();
      return box ? [box.x >= 0, box.x + box.width <= 320] : [];
    })
    .toEqual([true, true]);
  await page.keyboard.press("Escape");
});
