import {
  CreditCardIcon,
  ShapesIcon,
  SparklesIcon,
  UserRoundIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell/page-header";
import { SettingsLinks } from "@/components/settings/settings-links";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.nav.settings };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title={m.nav.settings} />
      <div className="flex flex-col gap-6">
        <SettingsLinks
          links={[
            {
              href: "/ajustes/categorias",
              title: m.settings.categories,
              hint: m.settings.categoriesHint,
              icon: ShapesIcon,
              color: "chart-1",
            },
            {
              href: "/ajustes/cartoes",
              title: m.settings.cards,
              hint: m.settings.cardsHint,
              icon: CreditCardIcon,
              color: "chart-2",
            },
          ]}
        />
        <SettingsLinks
          links={[
            {
              href: "/ajustes/conta",
              title: m.account.title,
              hint: m.account.hint,
              icon: UserRoundIcon,
              color: "chart-other",
            },
            {
              href: "/?tour=1",
              title: m.tour.replay,
              hint: m.tour.replayHint,
              icon: SparklesIcon,
              color: "chart-5",
            },
          ]}
        />
      </div>
    </>
  );
}
