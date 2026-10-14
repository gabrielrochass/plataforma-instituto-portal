import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";
import {
  addDays,
  createClass,
  createCourse,
  signIn,
  today,
  unique,
} from "./helpers";

test("someone signs up online and the coordination enrolls them", async ({
  page,
  browser,
}) => {
  test.slow();
  await signIn(page, unique("admin-ra"), "/");
  const course = unique("Curso");
  await createCourse(page, course);

  await page.goto("/inscricoes/ofertas");
  await page
    .getByLabel("Curso", { exact: true })
    .selectOption({ label: course });
  await page
    .getByLabel("Informações para quem se inscreve (opcional)")
    .fill("Aulas à noite");
  await page
    .getByRole("button", { name: "Abrir inscrições", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Inscrições abertas agora" }),
  ).toContainText(course);
  await expectNoAxeViolations(page);

  const visitor = await (await browser.newContext()).newPage();
  await visitor.goto("/inscricao");
  await expectNoAxeViolations(visitor);
  await visitor
    .getByRole("link", { name: `Inscrição em ${course}, Recife Antigo` })
    .click();
  const name = `Lia ${Date.now()}`;
  await visitor.getByLabel("Nome completo").fill(name);
  await visitor
    .getByLabel("Data de nascimento")
    .fill(addDays(today, -15 * 365));
  await visitor
    .getByLabel("Telefone com WhatsApp")
    .fill(`8199${String(Date.now()).slice(-7)}`);
  await visitor.getByRole("button", { name: "Enviar inscrição" }).click();
  await expect(
    visitor.getByText("Para menores de 18 anos, informe o responsável").first(),
  ).toBeVisible();
  await visitor.getByLabel("Nome do responsável").fill("Rosa Melo");
  await visitor.getByLabel("Telefone do responsável").fill("81977776666");
  await visitor.getByRole("button", { name: "Enviar inscrição" }).click();
  await expect(
    visitor.getByText("É preciso autorizar o uso dos dados para se inscrever"),
  ).toBeVisible();
  await visitor
    .getByRole("checkbox", { name: /Autorizo o Instituto Portal/ })
    .click();
  await expectNoAxeViolations(visitor);
  await visitor.waitForTimeout(3000);
  await visitor.getByRole("button", { name: "Enviar inscrição" }).click();
  await expect(visitor).toHaveURL(
    /\/inscricao\/enviada\?protocolo=[2-9A-Z]{8}$/,
  );
  await expect(
    visitor.getByRole("heading", { name: "Inscrição recebida" }),
  ).toBeVisible();
  await expectNoAxeViolations(visitor);
  await visitor.context().close();

  await page.goto("/");
  await expect(
    page.getByRole("link", { name: /inscrição nova|inscrições novas/ }),
  ).toBeVisible();
  await page.goto("/inscricoes");
  const row = page.getByRole("link", { name: new RegExp(name) });
  await expect(row).toContainText("º na fila");
  await expectNoAxeViolations(page);
  await row.click();
  await expect(page.getByText("Rosa Melo. (81) 97777-6666")).toBeVisible();
  await page.getByRole("button", { name: "Pôr na lista de espera" }).click();
  await expect(
    page.getByText(`${course}, Recife Antigo. Lista de espera`),
  ).toBeVisible();
  const requestUrl = page.url();

  await createClass(page, course, `Noite ${Date.now()}`);
  await page.goto(requestUrl);
  await expect(page.getByText("Nenhuma turma aberta")).toHaveCount(0);
  await expectNoAxeViolations(page);
  await page
    .getByRole("button", { name: "Criar cadastro novo e matricular" })
    .click();
  await expect(page).toHaveURL(/\/alunos\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(page.getByText("1 turma ativa")).toBeVisible();
  await expect(page.getByText("Rosa Melo")).toBeVisible();

  await page.goto("/inscricoes/ofertas");
  await page
    .getByRole("button", { name: `Encerrar inscrições de ${course}` })
    .click();
  await expect(page.getByRole("region", { name: "Encerradas" })).toContainText(
    course,
  );
  await page.goto("/inscricao");
  await expect(page.getByText(course)).toHaveCount(0);
});

test("the public pages fit a small phone", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  for (const path of ["/inscricao", "/inscricao/enviada?protocolo=ABCD2345"]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
