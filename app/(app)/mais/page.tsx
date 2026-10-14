import {
  FileTextIcon,
  LogOutIcon,
  MegaphoneIcon,
  SettingsIcon,
  ShieldCheckIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { LinkList } from "@/components/app-shell/link-list";
import { PageHeader } from "@/components/app-shell/page-header";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  adminLinks,
  personalLinks,
} from "@/components/settings/settings-links";
import { signOut } from "@/lib/actions/account";
import { getViewer } from "@/lib/data/viewer";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.more.title };

export default async function MorePage() {
  const admin = adminLinks(await getViewer());

  return (
    <>
      <PageHeader title={m.more.title} />
      <div className="flex flex-col gap-6">
        <LinkList
          links={[
            {
              href: "/avisos",
              title: m.announcements.title,
              hint: m.announcements.hint,
              icon: MegaphoneIcon,
              color: "chart-2",
            },
          ]}
        />
        {admin.length > 0 && <LinkList links={admin} />}
        <LinkList
          links={[
            {
              href: "/ajustes",
              title: m.nav.settings,
              icon: SettingsIcon,
              color: "chart-other",
            },
            ...personalLinks,
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
