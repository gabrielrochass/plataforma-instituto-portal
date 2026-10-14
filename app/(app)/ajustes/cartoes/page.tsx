import { ChevronRightIcon, CreditCardIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";
import { CardFace, MiniCard } from "@/components/cards/card-face";
import { buttonVariants } from "@/components/ui/button";
import { getCards } from "@/lib/data";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.settings.cards };

export default async function CardsPage() {
  const cards = await getCards();
  const active = cards.filter((card) => !card.archived_at);
  const archived = cards.filter((card) => card.archived_at);
  const newCard = (
    <Link
      href="/ajustes/cartoes/novo"
      className={buttonVariants({ size: "lg" })}
    >
      <PlusIcon aria-hidden="true" />
      {m.settings.newCard}
    </Link>
  );

  return (
    <>
      <PageHeader
        title={m.settings.cards}
        back={{ href: "/ajustes", label: m.nav.settings }}
        action={active.length > 0 && newCard}
      />
      <div className="flex flex-col gap-8">
        {active.length > 0 ? (
          <ul className="mx-auto flex w-full max-w-sm flex-col pt-1">
            {active.map((card) => (
              <li
                key={card.id}
                className="relative not-first:mt-[calc(3.5rem-63.05%)] has-focus-visible:z-10"
              >
                <Link
                  href={`/ajustes/cartoes/${card.id}`}
                  className="block rounded-2xl transition-transform hover:-translate-y-1"
                >
                  <CardFace
                    name={card.name}
                    design={card.design}
                    bestPurchaseDay={card.best_purchase_day}
                    dueDay={card.due_day}
                    className="shadow-[0_-2px_12px_rgb(0_0_0/0.18)]"
                  />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={CreditCardIcon}
            title={m.settings.emptyCards}
            description={m.settings.emptyCardsDescription}
            action={newCard}
          />
        )}
        {archived.length > 0 && (
          <section
            aria-labelledby="cartoes-arquivados"
            className="flex flex-col gap-3"
          >
            <h2
              id="cartoes-arquivados"
              className="px-1 text-footnote font-semibold text-muted-foreground"
            >
              {m.settings.archived}
            </h2>
            <ul className="divide-y overflow-hidden rounded-2xl bg-card">
              {archived.map((card) => (
                <li key={card.id}>
                  <Link
                    href={`/ajustes/cartoes/${card.id}`}
                    className="flex min-h-14 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/60 focus-visible:-outline-offset-2!"
                  >
                    <MiniCard design={card.design} className="h-6 w-9.5" />
                    <span className="min-w-0 flex-1 truncate text-body">
                      {card.name}
                    </span>
                    <ChevronRightIcon
                      aria-hidden="true"
                      className="size-5 text-muted-foreground"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
