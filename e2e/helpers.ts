import { type Browser, expect, type Page } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

const timeZone = "America/Recife";

export const today = new Intl.DateTimeFormat("en-CA", { timeZone }).format(
  new Date(),
);

const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function addDays(isoDate: string, days: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

export function weekdayLabel(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return weekdayLabels[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

export function unique(tag: string) {
  return `${tag}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function signIn(page: Page, alias: string, next: string) {
  return page.goto(`/dev/entrar?as=${alias}&next=${encodeURIComponent(next)}`);
}

export function exact(text: string) {
  return new RegExp(`^${text}$`);
}

export async function newPage(browser: Browser, alias: string) {
  const page = await (await browser.newContext()).newPage();
  await signIn(page, alias, "/");
  return page;
}

export async function createCourse(page: Page, name: string) {
  await page.goto("/ajustes/cursos/novo");
  await page.getByLabel("Nome do curso").fill(name);
  await page.getByLabel("Carga horária em horas").fill("8");
  await page.getByRole("button", { name: "Criar curso" }).click();
  await expect(page).toHaveURL("/ajustes/cursos");
}

export async function createClass(
  page: Page,
  course: string,
  name: string,
  options: {
    check?: boolean;
    startsOn?: string;
    days?: string[];
    from?: string;
    to?: string;
    concepts?: boolean;
  } = {},
) {
  const check = options.check ?? false;
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
  if (await page.getByRole("radio", { name: "Recife Antigo" }).count()) {
    await page.locator("label", { hasText: exact("Recife Antigo") }).click();
  }
  await page.getByLabel("Nome da turma").fill(name);
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(
    page.getByRole("heading", { name: "Quando acontecem as aulas?" }),
  ).toBeVisible();
  const startsOn = options.startsOn ?? today;
  await page.getByLabel("Primeira aula").fill(startsOn);
  await page.getByLabel("Última aula").fill(addDays(today, 27));
  for (const day of options.days ?? ["Seg", "Qua", "Sex"]) {
    await page.locator("label", { hasText: exact(day) }).click();
  }
  if (options.from) await page.getByLabel("Começa").fill(options.from);
  if (options.to) await page.getByLabel("Termina").fill(options.to);
  if (check) await expectNoAxeViolations(page);
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(
    page.getByRole("heading", { name: "Confira as aulas" }),
  ).toBeVisible();
  if (check) await expectNoAxeViolations(page);
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(
    page.getByRole("heading", { name: "Como os alunos são avaliados?" }),
  ).toBeVisible();
  if (options.concepts) {
    await page.locator("label", { hasText: "Conceitos" }).click();
    await expect(
      page.getByText(
        "Aprovado quem tiver conceito Ótimo, Bom ou Regular e pelo menos 75% de presença.",
      ),
    ).toBeVisible();
  }
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

export async function registerMinor(
  page: Page,
  classId: string,
  name: string,
  enrolledOn?: string,
) {
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
  if (enrolledOn) await page.getByLabel("Na turma desde").fill(enrolledOn);
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
