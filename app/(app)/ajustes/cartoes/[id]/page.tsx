import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app-shell/page-header";
import { CardEditor } from "@/components/settings/card-editor";
import { getCards } from "@/lib/data";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.settings.editCard };

export default async function EditCardPage({
  params,
}: PageProps<"/ajustes/cartoes/[id]">) {
  const { id } = await params;
  const card = (await getCards()).find((candidate) => candidate.id === id);
  if (!card) notFound();

  return (
    <>
      <PageHeader
        title={m.settings.editCard}
        back={{ href: "/ajustes/cartoes", label: m.settings.cards }}
      />
      <CardEditor card={card} />
    </>
  );
}
