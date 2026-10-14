import { expect, type Page, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";
import {
  addDays,
  createClass,
  newPage,
  registerMinor,
  signIn,
  today,
  unique,
  weekdayLabel,
} from "./helpers";

async function teacherWithClass(
  page: Page,
  browser: import("@playwright/test").Browser,
  startsOn = today,
) {
  const admin = await newPage(browser, unique("admin-ra"));
  await admin.context().close();

  await signIn(page, unique("prof-ra"), "/");
  const name = `Chamada ${Date.now()}`;
  const classId = await createClass(page, name, {
    startsOn,
    days: [weekdayLabel(today)],
  });
  return { classId, name };
}

async function saveDay(page: Page, classId: string, day: string) {
  await page.goto(`/turmas/${classId}/chamada?data=${day}`);
  await expect(page.getByLabel("Dia da aula")).toHaveValue(day);
  await page.getByRole("button", { name: "Salvar chamada" }).click();
  await expect(page).toHaveURL(`/turmas/${classId}`);
}

test("a teacher takes attendance with a checklist and a note", async ({
  page,
  browser,
}) => {
  test.slow();
  const { classId, name } = await teacherWithClass(page, browser);
  const ana = `Ana ${Date.now()}`;
  const beto = `Beto ${Date.now()}`;
  await registerMinor(page, classId, ana);
  await registerMinor(page, classId, beto);

  await page.goto("/");
  const todays = page.getByRole("region", { name: "Aulas de hoje" });
  await expect(todays).toContainText(name);
  await expectNoAxeViolations(page);

  await todays.getByRole("link", { name: new RegExp(name) }).click();
  await expect(page).toHaveURL(`/turmas/${classId}/chamada`);
  await expect(page.getByLabel("Dia da aula")).toHaveValue(today);
  await expect(page.locator("output").first()).toHaveText("0 de 2 presentes");
  await expectNoAxeViolations(page);

  await expect(async () => {
    await page.getByRole("checkbox", { name: new RegExp(ana) }).check();
    await expect(page.locator("output").first()).toHaveText(
      "1 de 2 presentes",
      { timeout: 1000 },
    );
  }).toPass();
  await page.getByLabel("Observação (opcional)").fill("Aula de revisão");
  await page.getByRole("button", { name: "Salvar chamada" }).click();
  await expect(page).toHaveURL(`/turmas/${classId}`);

  await page.getByRole("link", { name: "Chamadas" }).click();
  const history = page.getByRole("region", { name: "Chamadas feitas" });
  await expect(history).toContainText("1 presente, 1 falta");
  await expect(history).toContainText("Aula de revisão");
  await expectNoAxeViolations(page);

  await history.getByRole("link").first().click();
  await expect(
    page.getByText(
      "Chamada deste dia já feita. Dá para corrigir e salvar de novo.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: new RegExp(ana) }),
  ).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: new RegExp(beto) }),
  ).not.toBeChecked();
  await expect(page.getByLabel("Observação (opcional)")).toHaveValue(
    "Aula de revisão",
  );

  await page.goto(`/turmas/${classId}/alunos`);
  await expect(page.getByRole("link", { name: new RegExp(ana) })).toContainText(
    "100% de presença",
  );
  await expect(
    page.getByRole("link", { name: new RegExp(beto) }),
  ).toContainText("0% de presença");
});

test("three absences in a row raise an alert until someone calls the family", async ({
  page,
  browser,
}) => {
  test.slow();
  const { classId } = await teacherWithClass(
    page,
    browser,
    addDays(today, -14),
  );
  const caio = `Caio ${Date.now()}`;
  const studentId = await registerMinor(
    page,
    classId,
    caio,
    addDays(today, -14),
  );

  await saveDay(page, classId, addDays(today, -14));
  await saveDay(page, classId, addDays(today, -7));
  await page.goto(`/turmas/${classId}/chamada`);
  await expect(page.getByText("2 faltas seguidas")).toBeVisible();
  await page.getByRole("button", { name: "Salvar chamada" }).click();
  await expect(page).toHaveURL(`/turmas/${classId}`);

  await page.goto("/");
  const attention = page.getByRole("region", { name: "Precisam de atenção" });
  await expect(attention).toContainText(caio);
  await expect(attention).toContainText("3 faltas seguidas");
  await attention
    .getByRole("link", { name: `Registrar contato com ${caio}` })
    .click();
  await expect(page).toHaveURL(
    `/alunos/${studentId}/acompanhamento?tipo=family_contact`,
  );
  await expect(
    page.getByRole("radio", { name: "Contato com a família" }),
  ).toBeChecked();
  await page
    .getByLabel("O que aconteceu")
    .fill("Liguei, ele mudou de turno no trabalho.");
  await page.getByRole("button", { name: "Salvar anotação" }).click();
  await expect(
    page.getByText("Liguei, ele mudou de turno no trabalho."),
  ).toBeVisible();

  await page.goto("/");
  await expect(
    page.getByRole("region", { name: "Precisam de atenção" }),
  ).not.toContainText(caio);
});

test("a wrong day of attendance can be deleted", async ({ page, browser }) => {
  test.slow();
  const { classId } = await teacherWithClass(page, browser);
  await registerMinor(page, classId, `Dora ${Date.now()}`);
  await saveDay(page, classId, today);
  await page.goto(`/turmas/${classId}/chamada?data=${today}`);
  await page.getByRole("button", { name: "Apagar chamada deste dia" }).click();
  const dialog = page.getByRole("alertdialog");
  await expectNoAxeViolations(page);
  await dialog
    .getByRole("button", { name: "Apagar chamada deste dia" })
    .click();
  await expect(page).toHaveURL(`/turmas/${classId}`);
  await page.goto(`/turmas/${classId}/chamadas`);
  await expect(page.getByText("Nenhuma chamada ainda.")).toBeVisible();
});
