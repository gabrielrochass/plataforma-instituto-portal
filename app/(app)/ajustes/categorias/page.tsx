import { ChevronRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell/page-header";
import { NewCategory } from "@/components/settings/new-category";
import { categoryIcon } from "@/lib/category-icons";
import { type Category, getCategories } from "@/lib/data";
import { m } from "@/lib/i18n";
import { formatBRL } from "@/lib/money";
import { swatch } from "@/lib/palette";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: m.settings.categories };

const kinds = [
  {
    kind: "expense",
    title: m.settings.expenseCategories,
    tone: "text-expense",
  },
  { kind: "income", title: m.settings.incomeCategories, tone: "text-income" },
] as const;

export default async function CategoriesPage() {
  const categories = await getCategories();
  const archived = categories.filter((category) => category.archived_at);

  return (
    <>
      <PageHeader
        title={m.settings.categories}
        back={{ href: "/ajustes", label: m.nav.settings }}
      />
      <div className="flex flex-col gap-8">
        {kinds.map(({ kind, title, tone }) => {
          const items = categories.filter(
            (category) => category.kind === kind && !category.archived_at,
          );
          return (
            <section
              key={kind}
              aria-labelledby={`categorias-${kind}`}
              className="flex flex-col gap-3"
            >
              <h2
                id={`categorias-${kind}`}
                className={cn("px-1 text-footnote font-semibold", tone)}
              >
                {title}
              </h2>
              <NewCategory kind={kind} />
              {items.length > 0 && <CategoryList categories={items} />}
            </section>
          );
        })}
        {archived.length > 0 && (
          <section
            aria-labelledby="categorias-arquivadas"
            className="flex flex-col gap-3"
          >
            <h2
              id="categorias-arquivadas"
              className="px-1 text-footnote font-semibold text-muted-foreground"
            >
              {m.settings.archived}
            </h2>
            <CategoryList categories={archived} />
          </section>
        )}
      </div>
    </>
  );
}

function CategoryList({ categories }: { categories: Category[] }) {
  return (
    <ul className="divide-y overflow-hidden rounded-2xl bg-card">
      {categories.map((category) => {
        const Icon = categoryIcon(category.icon);
        return (
          <li key={category.id}>
            <Link
              href={`/ajustes/categorias/${category.id}`}
              className="flex min-h-14 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/60 focus-visible:-outline-offset-2!"
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full text-swatch-foreground",
                  swatch(category.color),
                )}
              >
                <Icon aria-hidden="true" className="size-4.5" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-body">{category.name}</span>
                {category.monthly_limit_cents != null && (
                  <span className="text-footnote text-muted-foreground tabular-nums">
                    {m.settings.limitSummary(
                      formatBRL(category.monthly_limit_cents),
                    )}
                  </span>
                )}
              </span>
              <ChevronRightIcon
                aria-hidden="true"
                className="size-5 text-muted-foreground"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
