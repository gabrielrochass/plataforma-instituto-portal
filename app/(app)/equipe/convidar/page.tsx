import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell/page-header";
import { InviteForm } from "@/components/team/invite-form";
import { getUnits } from "@/lib/data/team";
import { requireTeamManager } from "@/lib/data/viewer";
import { m } from "@/lib/i18n";
import { adminUnits, invitableRoles } from "@/lib/roles";
import type { InviteKind } from "@/lib/schemas/team";

export const metadata: Metadata = { title: m.team.inviteTitle };

const kindByParam: Record<string, InviteKind> = {
  professor: "teacher",
  "adm-unidade": "unitAdmin",
  "adm-geral": "adminGeral",
};

export default async function InvitePage({
  searchParams,
}: PageProps<"/equipe/convidar">) {
  const viewer = await requireTeamManager();
  const units = adminUnits(viewer, await getUnits());
  const kinds: InviteKind[] = [
    "teacher",
    ...(units.some((unit) => invitableRoles(viewer, unit.id).includes("admin"))
      ? (["unitAdmin"] as const)
      : []),
    ...(viewer.isAdminGeral ? (["adminGeral"] as const) : []),
  ];
  const { papel } = await searchParams;
  const asked = typeof papel === "string" ? kindByParam[papel] : undefined;
  const initialKind = asked && kinds.includes(asked) ? asked : "teacher";

  return (
    <>
      <PageHeader
        title={
          kinds.length > 1 ? m.team.inviteTitle : m.team.kindTitles.teacher
        }
        back={{ href: "/equipe", label: m.team.title }}
      />
      <InviteForm
        kinds={kinds}
        initialKind={initialKind}
        unitsByKind={{
          teacher: units,
          unitAdmin: units.filter((unit) =>
            invitableRoles(viewer, unit.id).includes("admin"),
          ),
          adminGeral: [],
        }}
      />
    </>
  );
}
