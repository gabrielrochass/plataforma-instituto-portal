import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/app-shell/page-header";
import { UnitForm } from "@/components/team/unit-form";
import { getUnits } from "@/lib/data/team";
import { requireAdminGeral } from "@/lib/data/viewer";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.units.edit };

export default async function UnitPage({
  params,
}: PageProps<"/ajustes/unidades/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  await requireAdminGeral();
  const unit = (await getUnits()).find((candidate) => candidate.id === id);
  if (!unit) notFound();

  return (
    <>
      <PageHeader
        title={unit.name}
        back={{ href: "/ajustes/unidades", label: m.units.title }}
      />
      <UnitForm unit={unit} />
    </>
  );
}
