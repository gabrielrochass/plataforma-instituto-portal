import { expect, type Page, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";
import {
  addDays,
  createClass,
  createCourse,
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
  const course = unique("Curso");
  await createCourse(admin, course);
  await admin.context().close();

  await signIn(page, unique("prof-ra"), "/");
  const name = `Chamada ${Date.now()}`;
  const classId = await createClass(page, course, name, {
    startsOn,
    days: [weekdayLabel(today)],
    from: "00:00",
    to: "23:59",
  });
  return { classId, name };
}

function mark(page: Page, student: string, status: "Presente" | "Falta") {
  return page
    .getByRole("group", { name: student })
    .locator("label", { hasText: status })
    .click();
}

test("a teacher takes today's attendance from the home screen", async ({
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
  const today = page.getByRole("region", { name: "Aulas de hoje" });
  await expect(today).toContainText(name);
  await expectNoAxeViolations(page);

  await page.getByRole("link", { name: "Fazer chamada" }).first().click();
  await expect(page).toHaveURL(new RegExp(`/turmas/${classId}/chamada/`));
  await expectNoAxeViolations(page);

  await page.getByRole("button", { name: "Salvar chamada" }).click();
  await expect(page.getByText("Falta marcar 2 alunos.")).toBeVisible();

  await mark(page, beto, "Falta");
  await page.reload();
  await expect(
    page.getByText("Rascunho guardado neste aparelho"),
  ).toBeVisible();
  await expect(
    page
      .getByRole("group", { name: beto })
      .getByRole("radio", { name: "Falta" }),
  ).toBeChecked();

  await page
    .getByRole("button", { name: "Marcar todos como presentes" })
    .click();
  await expect(
    page
      .getByRole("group", { name: ana })
      .getByRole("radio", { name: "Presente" }),
  ).toBeChecked();
  await page.getByRole("button", { name: `Mais opções para ${beto}` }).click();
  await page
    .getByRole("dialog")
    .locator("label", { hasText: "Falta justificada" })
    .click();
  await page.getByRole("dialog").getByLabel("Observação").fill("Atestado");
  await expectNoAxeViolations(page);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Fechar" })
    .first()
    .click();
  await page.getByLabel("O que foi trabalhado na aula").fill("Variáveis");
  await expect(page.getByText("1 presente, 1 falta")).toBeVisible();
  await page.getByRole("button", { name: "Salvar chamada" }).click();
  await expect(page.getByText("Chamada salva").first()).toBeVisible();

  await page.goto("/");
  await expect(
    page.getByRole("region", { name: "Aulas de hoje" }),
  ).toContainText("1 presente, 1 falta");

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

  await page.goto(
    `/turmas/${classId}/aulas?mes=${addDays(today, -14).slice(0, 7)}`,
  );
  for (const offset of [-14, -7]) {
    await page.goto(
      `/turmas/${classId}/aulas?mes=${addDays(today, offset).slice(0, 7)}`,
    );
    await page
      .getByRole("listitem")
      .filter({ has: page.getByRole("link", { name: /^Fazer chamada:/ }) })
      .first()
      .getByRole("link", { name: /^Fazer chamada:/ })
      .click();
    await mark(page, caio, "Falta");
    await page.getByRole("button", { name: "Salvar chamada" }).click();
    await expect(page).not.toHaveURL(/chamada/);
  }

  await page.goto("/chamada");
  await expect(page).toHaveURL(new RegExp(`/turmas/${classId}/chamada/`));
  await expect(page.getByText("2 faltas seguidas")).toBeVisible();
  await mark(page, caio, "Falta");
  await page.getByRole("button", { name: "Salvar chamada" }).click();
  await expect(
    page.getByRole("heading", { name: "Entraram em alerta" }),
  ).toBeFocused();
  await expectNoAxeViolations(page);
  await expect(
    page.getByRole("link", { name: "Ligar para Joana Souza" }),
  ).toHaveAttribute("href", "tel:+5581999991234");

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
  await expectNoAxeViolations(page);

  await page.goto("/");
  await expect(
    page.getByRole("region", { name: "Precisam de atenção" }),
  ).not.toContainText(caio);
});

test("a class that did not happen leaves the attendance and can come back", async ({
  page,
  browser,
}) => {
  test.slow();
  const { classId } = await teacherWithClass(page, browser);
  await registerMinor(page, classId, `Dora ${Date.now()}`);
  await page.goto("/chamada");
  await page.getByRole("button", { name: "A aula não aconteceu" }).click();
  const dialog = page.getByRole("dialog", { name: "A aula não aconteceu?" });
  await expectNoAxeViolations(page);
  await dialog.locator("label", { hasText: "Chuva ou alagamento" }).click();
  await dialog.getByRole("button", { name: "Confirmar" }).click();
  await expect(page).toHaveURL(`/turmas/${classId}/aulas`);
  await expect(
    page.getByText("Não aconteceu: Chuva ou alagamento"),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Desfazer/ }).click();
  await expect(page.getByText("Aula de volta")).toBeVisible();
  await expect(
    page.getByRole("link", { name: /^Fazer chamada:/ }),
  ).toBeVisible();
});
