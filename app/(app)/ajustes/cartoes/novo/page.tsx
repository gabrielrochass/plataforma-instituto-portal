import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell/page-header";
import { CardEditor } from "@/components/settings/card-editor";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.settings.newCard };

export default function NewCardPage() {
  return (
    <>
      <PageHeader
        title={m.settings.newCard}
        back={{ href: "/ajustes/cartoes", label: m.settings.cards }}
      />
      <CardEditor card={null} />
    </>
  );
}
