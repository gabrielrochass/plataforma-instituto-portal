import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/app-shell/page-header";
import { MemberEditor } from "@/components/team/member-editor";
import { getTeam, getUnits } from "@/lib/data/team";
import { requireTeamManager } from "@/lib/data/viewer";
import { m } from "@/lib/i18n";
import { adminUnits } from "@/lib/roles";

export const metadata: Metadata = { title: m.team.title };

export default async function MemberPage({
  params,
}: PageProps<"/ajustes/equipe/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const viewer = await requireTeamManager();
  const [team, units] = await Promise.all([getTeam(), getUnits()]);
  const member = team.find((candidate) => candidate.id === id);
  if (!member) notFound();

  return (
    <>
      <PageHeader
        title={member.display_name ?? member.email}
        subtitle={member.email}
        back={{ href: "/ajustes/equipe", label: m.team.title }}
      />
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
