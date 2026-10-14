import {
  CalendarClockIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
} from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/brand/public-header";
import { buttonVariants } from "@/components/ui/button";
import { getOpenOffers } from "@/lib/data/requests";
import { formatFullDate } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { weekdaysSummary } from "@/lib/schedule";

export const metadata: Metadata = {
  title: m.requests.publicTitle,
  description: m.requests.publicIntro,
};

export default async function PublicOffersPage() {
  const offers = await getOpenOffers();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-8 py-12">
      <PublicHeader
        title={m.requests.publicTitle}
        text={m.requests.publicIntro}
      />
      {offers.length === 0 ? (
        <p className="rounded-2xl bg-card p-5 text-center text-body text-muted-foreground">
          {m.requests.noneOpen}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {offers.map((offer) => (
            <li
              key={offer.id}
              className="flex flex-col gap-3 rounded-2xl bg-card p-5"
            >
              <h2 className="text-title3 font-semibold">{offer.class_name}</h2>
              <p className="flex flex-wrap gap-x-4 gap-y-1 text-subhead text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPinIcon aria-hidden="true" className="size-4" />
                  {offer.unit_name}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDaysIcon aria-hidden="true" className="size-4" />
                  {`${weekdaysSummary(offer.weekdays)}. ${m.classes.periodRange(formatFullDate(offer.starts_on), formatFullDate(offer.ends_on))}`}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ClockIcon aria-hidden="true" className="size-4" />
                  {m.requests.hours(offer.workload_hours)}
                </span>
                {offer.closes_on && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClockIcon aria-hidden="true" className="size-4" />
                    {m.requests.closesOn(formatFullDate(offer.closes_on))}
                  </span>
                )}
              </p>
              {offer.description && (
                <p className="text-body whitespace-pre-line">
                  {offer.description}
                </p>
              )}
              <Link
                href={`/inscricao/${offer.id}` as Route}
                aria-label={m.requests.applyFor(
                  offer.class_name,
                  offer.unit_name,
                )}
                className={buttonVariants({
                  size: "lg",
                  className: "h-12 text-body",
                })}
              >
                {m.requests.apply}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
