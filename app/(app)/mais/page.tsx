import {
  FileTextIcon,
  LogOutIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserRoundIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { LinkList } from "@/components/app-shell/link-list";
import { PageHeader } from "@/components/app-shell/page-header";
import { SubmitButton } from "@/components/forms/submit-button";
import { signOut } from "@/lib/actions/account";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.more.title };

export default function MorePage() {
  return (
    <>
      <PageHeader title={m.more.title} />
      <div className="flex flex-col gap-6">
        <LinkList
          links={[
            {
              href: "/ajustes",
              title: m.nav.settings,
              icon: SettingsIcon,
              color: "chart-other",
            },
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
        <LinkList
          links={[
            { href: "/termos", title: m.account.terms, icon: FileTextIcon },
            {
              href: "/privacidade",
              title: m.account.privacy,
              icon: ShieldCheckIcon,
            },
          ]}
        />
        <form action={signOut}>
          <SubmitButton variant="secondary" size="lg" className="w-full">
            <LogOutIcon aria-hidden="true" />
            {m.account.signOut}
          </SubmitButton>
        </form>
      </div>
    </>
  );
}
