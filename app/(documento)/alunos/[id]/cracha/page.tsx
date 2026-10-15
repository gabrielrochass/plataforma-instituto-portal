import type { Metadata, Route } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { BackLink } from "@/components/app-shell/back-link";
import { PrintButton } from "@/components/app-shell/print-button";
import { BadgeSheet } from "@/components/students/badge-card";
import { getStudentBadge } from "@/lib/data/badges";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.badges.title };

export default async function StudentBadgePage({
  params,
}: PageProps<"/alunos/[id]/cracha">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const badge = await getStudentBadge(id);
  if (!badge) notFound();

  return (
    <div className="flex flex-col gap-6 print:gap-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <BackLink href={`/alunos/${id}` as Route} />
        <PrintButton />
      </div>
      <h1 className="text-title1 font-bold tracking-tight print:sr-only">
        {m.badges.cardLabel(badge.name)}
      </h1>
      <BadgeSheet badges={[badge]} />
    </div>
  );
}
