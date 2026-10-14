import { UsersRoundIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { LinkList } from "@/components/app-shell/link-list";
import { PageHeader } from "@/components/app-shell/page-header";
import { MemberEditor } from "@/components/team/member-editor";
import { getClasses } from "@/lib/data/classes";
import { getTeam, getUnits } from "@/lib/data/team";
import { requireTeamManager } from "@/lib/data/viewer";
import { m } from "@/lib/i18n";
import { adminUnits } from "@/lib/roles";

export const metadata: Metadata = { title: m.team.title };

export default async function MemberPage({
  params,
}: PageProps<"/equipe/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const viewer = await requireTeamManager();
  const [team, units, classes] = await Promise.all([
    getTeam(),
    getUnits(),
    getClasses(),
  ]);
  const member = team.find((candidate) => candidate.id === id);
  if (!member) notFound();
  const taught = classes.filter(
    (row) => row.status === "open" && row.teacher_ids.includes(member.id),
  );

  return (
    <>
      <PageHeader
        title={member.display_name ?? member.email}
        subtitle={member.email}
        back={{ href: "/equipe", label: m.team.title }}
      />
      <section aria-labelledby="turmas" className="mb-8 flex flex-col gap-3">
        <h2 id="turmas" className="px-1 text-title3 font-semibold">
          {m.team.classesTitle}
        </h2>
        {taught.length === 0 ? (
          <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
            {m.team.noClasses}
          </p>
        ) : (
          <LinkList
            links={taught.map((row) => ({
              href: `/turmas/${row.id}` as Route,
              title: row.name,
              hint: `${row.unit_code}, ${m.classes.students(row.active_count, row.capacity)}`,
              icon: UsersRoundIcon,
            }))}
          />
        )}
      </section>
      <MemberEditor
        member={member}
        units={units}
        adminUnitIds={adminUnits(viewer, units).map((unit) => unit.id)}
        viewerIsAdminGeral={viewer.isAdminGeral}
        isSelf={member.id === viewer.id}
      />
    </>
  );
}
