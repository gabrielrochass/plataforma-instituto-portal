import { ChevronRightIcon, InboxIcon, SettingsIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/app-shell/empty-state";
import { FilterLinks } from "@/components/app-shell/filter-links";
import { PageHeader } from "@/components/app-shell/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getRequests, type RequestRow } from "@/lib/data/requests";
import { requireTeamManager } from "@/lib/data/viewer";
import { formatDate, todayInRecife } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { ageOn, displayName, formatPhone } from "@/lib/people";

export const metadata: Metadata = { title: m.requests.title };

const filters = ["pending", "waitlisted", "converted", "closed"] as const;
type Filter = (typeof filters)[number];

function matches(row: RequestRow, filter: Filter) {
  if (filter === "closed")
    return row.status === "declined" || row.status === "withdrawn";
  return row.status === filter;
}

export default async function RequestsPage({
  searchParams,
}: PageProps<"/inscricoes">) {
  await requireTeamManager();
  const params = await searchParams;
  const filter: Filter =
    filters.find((item) => item === params.situacao) ?? "pending";
  const rows = (await getRequests()).filter((row) => matches(row, filter));
  const today = todayInRecife();
  const groups = new Map<string, RequestRow[]>();
  for (const row of rows) {
    const key = `${row.course_name}, ${row.unit_code}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  const labels: Record<Filter, string> = {
    pending: m.requests.status.pending,
    waitlisted: m.requests.status.waitlisted,
    converted: m.requests.status.converted,
    closed: m.requests.filterClosed,
  };

  return (
    <div data-wide className="flex flex-col">
      <PageHeader
        title={m.requests.title}
        action={
          <Link
            href="/inscricoes/ofertas"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            <SettingsIcon aria-hidden="true" />
            {m.requests.offers}
          </Link>
        }
      />
      <div className="flex flex-col gap-6">
        <FilterLinks
          label={m.requests.filters}
          items={filters.map((item) => ({
            href: (item === "pending"
              ? "/inscricoes"
              : `/inscricoes?situacao=${item}`) as Route,
            label: labels[item],
            current: item === filter,
          }))}
        />
        {rows.length === 0 ? (
          <EmptyState
            icon={InboxIcon}
            title={m.requests.empty}
            description={m.requests.offersHint}
          />
        ) : (
          [...groups.entries()].map(([title, items]) => (
            <section
              key={title}
              aria-label={title}
              className="flex flex-col gap-3"
            >
              <h2 className="px-1 text-title3 font-semibold">{title}</h2>
              <ul className="divide-y overflow-hidden rounded-2xl bg-card">
                {items.map((row) => (
                  <li key={row.id}>
                    <Link
                      href={`/inscricoes/${row.id}` as Route}
                      className="flex min-h-15 items-center gap-3 px-4 py-2 hover:bg-muted/60 focus-visible:-outline-offset-2!"
                    >
                      {row.queue_position !== null && (
                        <span className="w-14 shrink-0 text-footnote font-semibold tabular-nums">
                          {m.requests.queue(row.queue_position)}
                        </span>
                      )}
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-body font-medium">
                          {displayName(row)}
                        </span>
                        <span className="text-footnote text-muted-foreground tabular-nums">
                          {`${m.requests.age(ageOn(row.birth_date, today))}. ${formatPhone(row.phone)}. ${m.requests.received(formatDate(todayInRecife(new Date(row.created_at)), today))}`}
                        </span>
                      </span>
                      <ChevronRightIcon
                        aria-hidden="true"
                        className="size-5 shrink-0 text-muted-foreground"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
