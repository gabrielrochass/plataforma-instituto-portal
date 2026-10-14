import { SparklesIcon, UserRoundIcon } from "lucide-react";
import type { Metadata } from "next";
import { LinkList } from "@/components/app-shell/link-list";
import { PageHeader } from "@/components/app-shell/page-header";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.nav.settings };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title={m.nav.settings} />
      <LinkList
        links={[
          {
            href: "/ajustes/conta",
            title: m.account.title,
            hint: m.account.hint,
            icon: UserRoundIcon,
            color: "chart-1",
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
    </>
  );
}
