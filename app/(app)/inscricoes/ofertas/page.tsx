import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell/page-header";
import {
  OfferForm,
  OfferToggle,
  PublicOffersLink,
} from "@/components/requests/offer-controls";
import { getClasses } from "@/lib/data/classes";
import { getOffers } from "@/lib/data/requests";
import { requireTeamManager } from "@/lib/data/viewer";
import { formatFullDate, todayInRecife } from "@/lib/dates";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.requests.offers };

export default async function OffersPage() {
  await requireTeamManager();
  const today = todayInRecife();
  const [offers, classes] = await Promise.all([getOffers(), getClasses()]);
  const sections = [
    {
      id: "abertas",
      title: m.requests.openList,
      rows: offers.filter((offer) => offer.is_open),
    },
    {
      id: "encerradas",
      title: m.requests.closedList,
      rows: offers.filter((offer) => !offer.is_open),
    },
  ];

  return (
    <>
      <PageHeader
        title={m.requests.offers}
        subtitle={m.requests.offersHint}
        back={{ href: "/inscricoes" }}
      />
      <div className="flex flex-col gap-8">
        <PublicOffersLink />
        {sections.map((section) => (
          <section
            key={section.id}
            aria-labelledby={section.id}
            className="flex flex-col gap-3"
          >
            <h2 id={section.id} className="px-1 text-title3 font-semibold">
              {section.title}
            </h2>
            {section.rows.length === 0 ? (
              <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
                {m.requests.noOffers}
              </p>
            ) : (
              <ul className="divide-y overflow-hidden rounded-2xl bg-card">
                {section.rows.map((offer) => (
                  <li
                    key={offer.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="text-body font-medium">
                        {offer.classes?.name}
                      </span>
                      <span className="text-footnote text-muted-foreground">
                        {offer.units?.name}
                        {offer.closes_on
                          ? `, ${m.requests.closesOn(formatFullDate(offer.closes_on))}`
                          : ""}
                      </span>
                    </span>
                    <OfferToggle
                      id={offer.id}
                      course={offer.classes?.name ?? ""}
                      isOpen={offer.is_open}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <section aria-labelledby="nova-oferta" className="flex flex-col gap-3">
          <h2 id="nova-oferta" className="px-1 text-title3 font-semibold">
            {m.requests.newOffer}
          </h2>
          <OfferForm
            classes={classes
              .filter(
                (row) =>
                  row.manageable &&
                  row.status === "open" &&
                  row.ends_on >= today,
              )
              .map((row) => ({
                id: row.id,
                name: `${row.name}, ${row.unit_code}`,
              }))}
          />
        </section>
      </div>
    </>
  );
}
