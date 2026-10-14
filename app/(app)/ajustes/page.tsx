import type { Metadata } from "next";
import { LinkList } from "@/components/app-shell/link-list";
import { PageHeader } from "@/components/app-shell/page-header";
import {
  adminLinks,
  personalLinks,
} from "@/components/settings/settings-links";
import { getViewer } from "@/lib/data/viewer";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.nav.settings };

export default async function SettingsPage() {
  const admin = adminLinks(await getViewer());

  return (
    <>
      <PageHeader title={m.nav.settings} />
      <div className="flex flex-col gap-6">
        {admin.length > 0 && <LinkList links={admin} />}
        <LinkList links={personalLinks} />
      </div>
    </>
  );
}
