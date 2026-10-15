import { MegaphoneIcon, PlusIcon, SparkleIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AnnouncementActions } from "@/components/announcements/announcement-actions";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getAnnouncements } from "@/lib/data/announcements";
import { getViewer } from "@/lib/data/viewer";
import { formatDate, todayInRecife } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { can } from "@/lib/roles";

const a = m.announcements;

export const metadata: Metadata = { title: a.title };

export default async function AnnouncementsPage() {
  const [viewer, announcements] = await Promise.all([
    getViewer(),
    getAnnouncements(),
  ]);
  const today = todayInRecife();

  return (
    <>
      <PageHeader
        back={{ href: "/mais", mobileOnly: true }}
        title={a.title}
        action={
          can.postAnnouncement(viewer) ? (
            <Link
              href="/avisos/novo"
              className={buttonVariants({ size: "lg" })}
            >
              <PlusIcon aria-hidden="true" />
              {a.new}
            </Link>
          ) : undefined
        }
      />
      {announcements.length === 0 ? (
        <EmptyState
          icon={MegaphoneIcon}
          title={a.empty}
          description={a.emptyHint}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {announcements.map((item) => {
            const target =
              item.audience === "everyone"
                ? a.everyone
                : item.audience === "unit"
                  ? item.unit_name
                  : `${item.class_name}, ${item.unit_name}`;
            return (
              <li key={item.id}>
                <article
                  aria-labelledby={`aviso-${item.id}`}
                  className="flex flex-col gap-3 rounded-2xl bg-card p-4"
                >
                  <header className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {!item.read_at && (
                        <Badge>
                          <SparkleIcon aria-hidden="true" />
                          {a.unread}
                        </Badge>
                      )}
                      <span className="text-footnote text-muted-foreground">
                        {target}
                      </span>
                    </div>
                    <h2
                      id={`aviso-${item.id}`}
                      className="text-headline font-semibold"
                    >
                      {item.title}
                    </h2>
                    <p className="text-footnote text-muted-foreground">
                      {a.by(
                        item.author_name ?? m.team.title,
                        formatDate(item.created_at.slice(0, 10), today),
                      )}
                      {item.expires_on &&
                        `, ${a.expires(formatDate(item.expires_on, today))}`}
                      {item.read_count !== null &&
                        `, ${a.readCount(item.read_count)}`}
                    </p>
                  </header>
                  <p className="text-body whitespace-pre-line">{item.body}</p>
                  <AnnouncementActions
                    id={item.id}
                    title={item.title}
                    body={item.body}
                    unread={!item.read_at}
                    canArchive={item.can_archive}
                  />
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
