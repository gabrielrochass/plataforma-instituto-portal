import { type Browser, expect, type Page, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

const timeZone = "America/Recife";
const today = new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());

function addDays(isoDate: string, days: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function unique(tag: string) {
  return `${tag}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function signIn(page: Page, alias: string, next: string) {
  return page.goto(`/dev/entrar?as=${alias}&next=${encodeURIComponent(next)}`);
}

function exact(text: string) {
  return new RegExp(`^${text}$`);
}

async function createCourse(page: Page, name: string) {
  await page.goto("/ajustes/cursos/novo");
  await page.getByLabel("Nome do curso").fill(name);
  await page.getByLabel("Carga horária em horas").fill("8");
  await page.getByRole("button", { name: "Criar curso" }).click();
  await expect(page).toHaveURL("/ajustes/cursos");
}

async function createClass(
  page: Page,
  course: string,
  name: string,
  check = false,
) {
  await page.goto("/turmas/nova");
  await expect(
    page.getByRole("heading", { name: "Qual curso e em qual unidade?" }),
  ).toBeFocused();
  if (check) await expectNoAxeViolations(page);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.locator("p", { hasText: "Escolha o curso" })).toBeVisible();
  const select = page.getByRole("combobox", { name: "Curso" });
  if (await select.count()) await select.selectOption({ label: course });
  else await page.locator("label", { hasText: exact(course) }).click();
  await page.getByLabel("Nome da turma").fill(name);
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(
    page.getByRole("heading", { name: "Quando acontecem as aulas?" }),
  ).toBeVisible();
  await page.getByLabel("Primeira aula").fill(today);
  await page.getByLabel("Última aula").fill(addDays(today, 27));
  for (const day of ["Seg", "Qua", "Sex"]) {
    await page.locator("label", { hasText: exact(day) }).click();
  }
  if (check) await expectNoAxeViolations(page);
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(
    page.getByRole("heading", { name: "Confira as aulas" }),
  ).toBeVisible();
  await expect(page.getByText(/\d+ aulas, de /)).toBeVisible();
  if (check) await expectNoAxeViolations(page);
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(
    page.getByRole("heading", { name: "Como os alunos são avaliados?" }),
  ).toBeVisible();
  await page.locator("label", { hasText: "Conceitos" }).click();
  await expect(
    page.getByText(
      "Aprovado quem tiver conceito Ótimo, Bom ou Regular e pelo menos 75% de presença.",
    ),
  ).toBeVisible();
  if (check) await expectNoAxeViolations(page);
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(
    page.getByRole("heading", { name: "Tudo certo?" }),
  ).toBeVisible();
  if (check) await expectNoAxeViolations(page);
  await page.getByRole("button", { name: "Criar turma" }).click();
  await expect(page).toHaveURL(/\/turmas\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  return page.url().split("/").at(-1) as string;
}

async function registerMinor(page: Page, classId: string, name: string) {
  await page.goto(`/turmas/${classId}/alunos`);
  await page.getByRole("button", { name: "Matricular aluno" }).click();
  await page
    .getByRole("link", { name: "Cadastrar aluno novo nesta turma" })
    .click();
  await expect(page).toHaveURL(`/alunos/novo?turma=${classId}`);
  await page.getByLabel("Nome completo").fill(name);
  await page.getByLabel("Data de nascimento").fill(addDays(today, -15 * 365));
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(
    page.getByText("Menor de idade: cadastre ao menos um responsável."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(
    page.getByText("Cadastre ao menos um responsável").first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Responsável 1" }).click();
  await page.getByLabel("Nome do responsável").fill("Joana Souza");
  await page.getByLabel("Telefone do responsável").fill("81999991234");
  await expect(page.getByLabel("Telefone do responsável")).toHaveValue(
    "(81) 99999-1234",
  );
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.locator("label", { hasText: exact("Visual") }).click();
  await page.getByLabel("O que ajuda na aula").fill("Senta na frente");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.getByRole("button", { name: "Cadastrar aluno" }).click();
  await expect(
    page.getByText("O termo de matrícula precisa estar assinado").first(),
  ).toBeVisible();
  await page
    .getByRole("checkbox", {
      name: "Termo de matrícula e uso de dados assinado",
    })
    .click();
  await page.getByRole("button", { name: "Cadastrar aluno" }).click();
  await expect(page).toHaveURL(/\/alunos\/[0-9a-f-]{36}$/);
  return page.url().split("/").at(-1) as string;
}

async function adminPage(browser: Browser) {
  const page = await (await browser.newContext()).newPage();
  await signIn(page, unique("admin-ra"), "/");
  return page;
}

test("a coordinator opens a course and a class in five steps", async ({
  page,
}) => {
  test.slow();
  await signIn(page, unique("admin-ra"), "/ajustes");
  const course = unique("Curso");
  await createCourse(page, course);
  await expect(
    page.getByRole("link", { name: new RegExp(course) }),
  ).toContainText("Aprovado quem tiver média 6 ou mais");
  const name = `Turma ${Date.now()}`;
  const classId = await createClass(page, course, name, true);
  await expect(page.getByText("Seg, Qua e Sex, 8h às 10h")).toBeVisible();
  await expect(page.getByText(/Aprovado quem tiver conceito/)).toBeVisible();
  await expectNoAxeViolations(page);

  await page.getByRole("link", { name: "Aulas" }).click();
  await expect(page).toHaveURL(`/turmas/${classId}/aulas`);
  await expectNoAxeViolations(page);

  await page.goto("/turmas");
  await expect(
    page.getByRole("link", { name: new RegExp(name) }),
  ).toContainText("0 alunos");
});

test("a teacher registers a minor in their class and only sees the classroom summary", async ({
  page,
  browser,
}) => {
  test.slow();
  const admin = await adminPage(browser);
  const course = unique("Curso");
  await createCourse(admin, course);
  await admin.context().close();

  await signIn(page, unique("prof-ra"), "/");
  const classId = await createClass(page, course, `Turma ${Date.now()}`);
  const studentName = `Maria ${Date.now()}`;
  const studentId = await registerMinor(page, classId, studentName);

  await expect(
    page.getByRole("heading", { level: 1, name: studentName }),
  ).toBeVisible();
  await expect(page.getByText("Menor de idade")).toBeVisible();
  await expect(page.getByText("Senta na frente")).toBeVisible();
  await expect(page.getByText("CPF")).toHaveCount(0);
  await expect(page.getByText("Ficha social pendente")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Ligar para Joana", exact: true }),
  ).toHaveAttribute("href", "tel:+5581999991234");
  await expectNoAxeViolations(page);

  await page.goto(`/turmas/${classId}/alunos`);
  await expect(
    page.getByRole("link", { name: new RegExp(studentName) }),
  ).toContainText("Acessibilidade");
  await expectNoAxeViolations(page);

  await page.goto("/alunos/novo");
  await page.getByLabel("Nome completo").fill(studentName.toLowerCase());
  await expect(
    page.getByRole("heading", { name: "Já existe cadastro parecido" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Abrir perfil" }),
  ).toHaveAttribute("href", `/alunos/${studentId}`);
});

test("a transfer keeps both classes in the student history", async ({
  page,
}) => {
  test.slow();
  await signIn(page, unique("admin-ra"), "/");
  const course = unique("Curso");
  await createCourse(page, course);
  const from = `Origem ${Date.now()}`;
  const to = `Destino ${Date.now()}`;
  const fromId = await createClass(page, course, from);
  await createClass(page, course, to);
  const studentName = `Pedro ${Date.now()}`;
  const studentId = await registerMinor(page, fromId, studentName);

  await page.goto(`/turmas/${fromId}/alunos`);
  await page.getByRole("button", { name: `Ações para ${studentName}` }).click();
  await page.getByRole("menuitem", { name: "Transferir" }).click();
  const dialog = page.getByRole("dialog", {
    name: `Transferir ${studentName}`,
  });
  await expectNoAxeViolations(page);
  await dialog.getByLabel("Para a turma").selectOption({ label: `${to} (RA)` });
  await dialog.getByRole("button", { name: "Transferir" }).click();
  await expect(page.getByText(`${studentName} transferido`)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Saíram da turma" }),
  ).toBeVisible();

  await page.goto(`/alunos/${studentId}/turmas`);
  await expect(
    page.getByRole("link").filter({ hasText: "Ativa" }).filter({ hasText: to }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("link").filter({ hasText: `Transferida para ${to}` }),
  ).toContainText(from);
  await expectNoAxeViolations(page);

  await page.goto(`/alunos/${studentId}`);
  await expect(page.getByText("Ficha social pendente")).toBeVisible();
});

test("a drop out can be undone right away", async ({ page }) => {
  test.slow();
  await signIn(page, unique("admin-bv"), "/");
  const course = unique("Curso");
  await createCourse(page, course);
  const classId = await createClass(page, course, `Turma ${Date.now()}`);
  const studentName = `Lia ${Date.now()}`;
  await registerMinor(page, classId, studentName);

  await page.goto(`/turmas/${classId}/alunos`);
  await page.getByRole("button", { name: `Ações para ${studentName}` }).click();
  await page.getByRole("menuitem", { name: "Encerrar matrícula" }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Motivo", { exact: true })
    .selectOption({ label: "Trabalho" });
  await dialog.getByRole("button", { name: "Encerrar matrícula" }).click();
  await expect(
    page.getByText(`Matrícula de ${studentName} encerrada`),
  ).toBeVisible();
  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(page.getByText("Matrícula reaberta")).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Saíram da turma" }),
  ).toHaveCount(0);
});

test("students search ignores accents", async ({ page }) => {
  test.slow();
  await signIn(page, unique("admin-ra"), "/");
  const course = unique("Curso");
  await createCourse(page, course);
  const classId = await createClass(page, course, `Turma ${Date.now()}`);
  const stamp = Date.now();
  await registerMinor(page, classId, `João Acentuado ${stamp}`);
  await page.goto("/alunos");
  const search = page.getByRole("searchbox", { name: "Buscar aluno" });
  await search.fill(`joao acentuado ${stamp}`);
  await search.press("Enter");
  await expect(
    page.getByRole("link", { name: new RegExp(`João Acentuado ${stamp}`) }),
  ).toBeVisible();
  await expectNoAxeViolations(page);
});

test("another unit cannot open the class or the student", async ({
  page,
  browser,
}) => {
  test.slow();
  const admin = await adminPage(browser);
  const course = unique("Curso");
  await createCourse(admin, course);
  const classId = await createClass(admin, course, `Turma ${Date.now()}`);
  const studentId = await registerMinor(admin, classId, `Rui ${Date.now()}`);
  await admin.context().close();

  await signIn(page, unique("prof-bv"), "/");
  for (const path of [`/turmas/${classId}`, `/alunos/${studentId}`]) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: "Página não encontrada" }),
    ).toBeVisible();
  }
});
