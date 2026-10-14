import { test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";
import { useTheme } from "./helpers";

const appPaths = [
  "/",
  "/turmas",
  "/alunos",
  "/mais",
  "/conta",
  "/equipe",
  "/equipe/convidar",
  "/unidades",
  "/turmas/nova",
  "/alunos/novo",
  "/inscricoes",
  "/inscricoes/ofertas",
  "/chamada",
  "/impacto",
  "/impacto/relatorio",
  "/avisos",
  "/avisos/novo",
];

for (const colorScheme of ["light", "dark"] as const) {
  test(`desktop screens meet WCAG in the ${colorScheme} theme`, async ({
    page,
  }) => {
    test.slow();
    await useTheme(page, colorScheme);
    for (const path of ["/entrar", "/termos", "/dev/ui"]) {
      await page.goto(path);
      await expectNoAxeViolations(page);
    }
    await page.goto(`/dev/entrar?as=desktop-${colorScheme}&next=/`);
    for (const path of appPaths) {
      await page.goto(path);
      await expectNoAxeViolations(page);
    }
  });
}
