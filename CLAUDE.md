@AGENTS.md

# Contadinho

Web app de finanças pessoais (pt-BR): registrar gastos rápido, ver custo por categoria e acompanhar cofrinhos com
previsão de meta. SaaS público, gratuito, Next.js 16 + Supabase + Vercel (região gru1).

## Comandos

- `npm run dev` — servidor local
- `npm run lint` / `npm run format` — Biome (checar / corrigir)
- `npm run typecheck` — tipos de rota + `tsc`
- `npm test` — Vitest (`lib/**/*.test.ts`)
- `npm run test:e2e` — Playwright + axe (`e2e/`), sobe o build com `DEV_UI=1`

## Princípios

- Simplicidade acima de tudo: sem dependência, abstração ou integração externa que a funcionalidade não exija.
- Sem comentários desnecessários; nomes claros dispensam explicação.
- Textos de interface só em `lib/i18n.ts`.
- Nada de ponto médio (·) nem travessão (— ou –) nos textos: use frases curtas, vírgulas e espaçamento.

## Dinheiro e datas

- Dinheiro em centavos inteiros (`number`); formatar e mascarar só com `lib/money.ts`. Nunca float.
- Datas de negócio como string `YYYY-MM-DD`; usar `lib/dates.ts`. Nunca `new Date("YYYY-MM-DD")` nem
  `toISOString().slice(0, 10)`.
- Meses como intervalos meio-abertos `[início, próximo início)`.

## UI

- shadcn/ui na base **Base UI**: compor com a prop `render`, nunca `asChild`; nunca misturar com Radix.
- Depois de `npx shadcn add`: trocar `import { cn } from "cn"` por `import { cn } from "@/lib/utils"` e traduzir para
  pt-BR os textos de leitor de tela do componente.
- Cores só por token (`bg-card`, `text-muted-foreground`…). Texto e ícone azul usam `text-link`; `primary` só para
  preenchimento.
- Tipografia pelas classes `text-caption|footnote|subhead|body|headline|title3|title2|title1|large-title|hero`; todo
  valor monetário com `tabular-nums`.
- Navegação é sempre `<Link>` (com `buttonVariants` quando parecer botão), nunca `Button` renderizando link.

## Acessibilidade (WCAG 2.2 AA)

- Alvos de toque ≥ 24px (44px no mobile); inputs ≥ 16px no mobile; nunca `maximum-scale` nem trava de orientação.
- Foco visível vem do `:focus-visible` global; não remover outline.
- Status nunca só por cor (ícone + texto); toda interação de arrastar tem alternativa por toque.
- Toasts acima da tab bar e da safe area.
- Componentes novos entram em `/dev/ui` quando tiverem variantes de cor.

## Next.js

- Server Components leem dados; Server Actions escrevem; checar autenticação dentro de cada action.
- `proxy.ts` (não `middleware.ts`) só renova sessão e redireciona.
