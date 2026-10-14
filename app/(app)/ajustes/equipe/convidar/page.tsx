import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell/page-header";
import { InviteForm } from "@/components/team/invite-form";
import { getUnits } from "@/lib/data/team";
import { requireTeamManager } from "@/lib/data/viewer";
import { m } from "@/lib/i18n";
import { adminUnits, invitableRoles } from "@/lib/roles";

export const metadata: Metadata = { title: m.team.inviteTitle };

export default async function InvitePage() {
  const viewer = await requireTeamManager();
  const units = adminUnits(viewer, await getUnits());

  return (
    <>
      <PageHeader
        title={m.team.inviteTitle}
        back={{ href: "/ajustes/equipe", label: m.team.title }}
      />
      <InviteForm
        units={units}
        rolesByUnit={Object.fromEntries(
          units.map((unit) => [unit.id, invitableRoles(viewer, unit.id)]),
        )}
      />
    </>
  );
}
