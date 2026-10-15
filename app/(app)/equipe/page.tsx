import { ChevronRightIcon, PlusIcon, UserRoundXIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell/page-header";
import { PendingInvites } from "@/components/team/pending-invites";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getClasses } from "@/lib/data/classes";
import { getPendingInvites, getTeam, getUnits } from "@/lib/data/team";
import { requireTeamManager } from "@/lib/data/viewer";
import { formatFullDate, todayInRecife } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { listText } from "@/lib/schedule";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: m.team.title };

export default async function TeamPage() {
  const viewer = await requireTeamManager();
  const [team, invites, units, classes] = await Promise.all([
    getTeam(),
    getPendingInvites(),
    getUnits(),
    getClasses(),
  ]);
  const openClasses = classes.filter((row) => row.status === "open");
  const unitName = (id: string) =>
    units.find((unit) => unit.id === id)?.name ?? "";

  return (
    <>
      <PageHeader
        back={{ href: "/mais", mobileOnly: true }}
        title={m.team.title}
        action={
          <Link
            href="/equipe/convidar"
            className={buttonVariants({ size: "lg" })}
          >
            <PlusIcon aria-hidden="true" />
            {m.team.invite}
          </Link>
        }
      />
      <div className="flex flex-col gap-8">
        {invites.length > 0 && (
          <section aria-labelledby="convites" className="flex flex-col gap-3">
            <h2 id="convites" className="px-1 text-title3 font-semibold">
              {m.team.pending}
            </h2>
            <PendingInvites
              invites={invites.map((invite) => ({
                id: invite.id,
                name: invite.display_name,
                detail: invite.admin_geral
                  ? m.roles.adminGeral
                  : m.team.roleIn(
                      m.roles[invite.role],
                      unitName(invite.unit_id),
                    ),
                expires: m.team.expires(
                  formatFullDate(todayInRecife(new Date(invite.expires_at))),
                ),
              }))}
            />
          </section>
        )}
        <section aria-labelledby="pessoas" className="flex flex-col gap-3">
          <h2 id="pessoas" className="px-1 text-title3 font-semibold">
            {m.team.members}
          </h2>
          <ul className="divide-y overflow-hidden rounded-2xl bg-card">
            {team.map((member) => {
              const roles = [
                ...(member.is_admin_geral ? [m.roles.adminGeral] : []),
                ...member.memberships.map((row) =>
                  m.team.roleIn(m.roles[row.role], unitName(row.unit_id)),
                ),
              ];
              const teaches = openClasses
                .filter((row) => row.teacher_ids.includes(member.id))
                .map((row) => row.name);
              return (
                <li key={member.id}>
                  <Link
                    href={`/equipe/${member.id}`}
                    className="flex min-h-15 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60 focus-visible:-outline-offset-2!"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span
                        className={cn(
                          "flex flex-wrap items-center gap-2 text-body font-medium",
                          member.deactivated_at && "text-muted-foreground",
                        )}
                      >
                        {member.display_name ?? member.email}
                        {member.id === viewer.id && (
                          <Badge variant="secondary">{m.team.you}</Badge>
                        )}
                        {member.deactivated_at && (
                          <Badge variant="outline">
                            <UserRoundXIcon aria-hidden="true" />
                            {m.team.deactivated}
                          </Badge>
                        )}
                      </span>
                      <span className="text-footnote text-muted-foreground">
                        {roles.join(", ") || m.team.noUnits}
                      </span>
                      {teaches.length > 0 && (
                        <span className="text-footnote text-muted-foreground">
                          {m.team.teaches(listText(teaches))}
                        </span>
                      )}
                    </span>
                    <ChevronRightIcon
                      aria-hidden="true"
                      className="size-5 shrink-0 text-muted-foreground"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
