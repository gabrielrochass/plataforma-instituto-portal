import { ChevronLeftIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PrintButton } from "@/components/app-shell/print-button";
import { BadgeSheet } from "@/components/students/badge-card";
import { getClassBadges } from "@/lib/data/badges";
import { getClass } from "@/lib/data/classes";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.badges.title };

export default async function ClassBadgesPage({
  params,
}: PageProps<"/turmas/[id]/crachas">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const row = await getClass(id);
  if (!row || !row.operable) notFound();
  const badges = await getClassBadges(id);

  return (
    <div className="flex flex-col gap-6 print:gap-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/turmas/${id}` as Route}
          className="-ml-1 flex min-h-11 items-center gap-0.5 text-body text-link"
        >
          <ChevronLeftIcon aria-hidden="true" className="size-5" />
          {m.badges.back}
        </Link>
        <PrintButton />
      </div>
      <div className="flex flex-col gap-1 print:hidden">
        <h1 className="text-title1 font-bold tracking-tight">
          {m.badges.title}, {row.name}
        </h1>
        <p className="text-subhead text-muted-foreground">{m.badges.hint}</p>
      </div>
      {badges.length === 0 ? (
        <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
          {m.badges.empty}
        </p>
      ) : (
        <BadgeSheet badges={badges} />
      )}
    </div>
  );
}
