@AGENTS.md

# Portal

Sistema interno do Instituto Portal (pt-BR, unidades RA e BV): turmas, alunos e matrículas com histórico,
chamada pelo celular, notas, acompanhamento social e impacto para patrocinadores. Papéis: adm geral, adm de unidade,
professor; aluno só na fase de atividades. Next.js 16 + Supabase + Vercel (região gru1).

## Comandos

- `npm run dev`: servidor local
- `npm run lint` / `npm run format`: Biome (checar / corrigir)
- `npm run typecheck`: tipos de rota + `tsc`
- `npm test`: Vitest (`lib/**/*.test.ts`)
- `supabase test db`: pgTAP (`supabase/tests/database`)
- `npm run test:e2e`: Playwright + axe (`e2e/`), sobe o build com `DEV_UI=1`

## Princípios

- Simplicidade acima de tudo: sem dependência, abstração ou integração externa que a funcionalidade não exija.
- Sem comentários desnecessários; nomes claros dispensam explicação.
- Textos de interface só em `lib/i18n.ts`.
- Nada de ponto médio (·) nem travessão (— ou –) nos textos: use frases curtas, vírgulas e espaçamento.
- Banco e código em inglês, rotas e textos em pt-BR. Glossário: unidade `unit`, turma `class`, dia de chamada
  `class_session`, matrícula `enrollment`, chamada `attendance`, avaliação `assessment`, nota `grade`, aluno
  `student`, responsável `guardian`, ficha social `social_profile`, acompanhamento `case_note`, egresso
  `alumni_outcome`, inscrição `enrollment_request`, aviso `announcement`.

## Dados e permissões

- RLS é a fonte da verdade; a página e cada Server Action também checam o papel (`forbidden()` ou `notFound()`).
  Nunca confiar só no layout.
- Escritas com várias linhas ou mudança de status passam por função no Postgres; status nunca é coluna gravável pelo
  cliente.
- Professor nunca lê ficha social nem CPF; dados sensíveis ficam em tabelas próprias, só para a coordenação.
- Nunca colocar CPF, renda, saúde ou outro dado da ficha em URL, log, toast ou chave de cache.
- Registros institucionais não são apagados: arquivar, cancelar ou anonimizar.

## Dinheiro e datas

- Dinheiro em centavos inteiros (`number`); formatar e mascarar só com `lib/money.ts`. Nunca float.
- Datas de negócio como string `YYYY-MM-DD` no fuso de Recife; usar `lib/dates.ts`. Nunca `new Date("YYYY-MM-DD")`
  nem `toISOString().slice(0, 10)`.
- Meses como intervalos meio-abertos `[início, próximo início)`.

## UI

- shadcn/ui na base **Base UI**: compor com a prop `render`, nunca `asChild`; nunca misturar com Radix.
- Depois de `npx shadcn add`: trocar `import { cn } from "cn"` por `import { cn } from "@/lib/utils"` e traduzir para
  pt-BR os textos de leitor de tela do componente.
- Cores só por token (`bg-card`, `text-muted-foreground`…). Texto e ícone de link usam `text-link` (dourado escuro);
  `primary` (dourado) só para preenchimento, sempre com `text-primary-foreground` escuro.
- Tipografia pelas classes `text-caption|footnote|subhead|body|headline|title3|title2|title1|large-title|hero`; todo
  número em tabela, contagem ou valor com `tabular-nums`.
- Navegação é sempre `<Link>` (com `buttonVariants` quando parecer botão), nunca `Button` renderizando link.
- Telas largas (tabelas) marcam o conteúdo com `data-wide`; fluxos de tela cheia usam `FlowHeader` e `FlowBar`.

## Acessibilidade (WCAG 2.2 AA)

- Alvos de toque ≥ 24px (44px no mobile); inputs ≥ 16px no mobile; nunca `maximum-scale` nem trava de orientação.
- Foco visível vem do `:focus-visible` global; não remover outline.
- Status nunca só por cor (ícone + texto); toda interação de arrastar tem alternativa por toque.
- Toasts acima da tab bar e da safe area.
- Componentes novos entram em `/dev/ui` quando tiverem variantes de cor.

## Next.js

- Server Components leem dados; Server Actions escrevem; checar autenticação e papel dentro de cada action.
- `proxy.ts` (não `middleware.ts`) só renova sessão e redireciona.
