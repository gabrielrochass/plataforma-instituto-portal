import {
  FileTextIcon,
  LogOutIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LinkList } from "@/components/app-shell/link-list";
import { accountNav, workNav } from "@/components/app-shell/nav-items";
import { PageHeader } from "@/components/app-shell/page-header";
import { ThemePicker } from "@/components/app-shell/theme-picker";
import { SubmitButton } from "@/components/forms/submit-button";
import { signOut } from "@/lib/actions/account";
import { getViewer } from "@/lib/data/viewer";
import { m } from "@/lib/i18n";
import { parseTheme, themeCookie } from "@/lib/theme";

export const metadata: Metadata = { title: m.more.title };

export default async function MorePage() {
  const work = workNav(await getViewer());

  return (
    <>
      <PageHeader title={m.more.title} />
      <div className="flex flex-col gap-6">
        <LinkList
          links={work.map((item) => ({
            href: item.href,
            title: item.label,
            hint: item.hint,
            icon: item.icon,
            color: item.color,
          }))}
        />
        <ThemePicker
          initial={parseTheme((await cookies()).get(themeCookie)?.value)}
        />
        <LinkList
          links={[
            {
              href: accountNav.href,
              title: accountNav.label,
              hint: accountNav.hint,
              icon: accountNav.icon,
              color: accountNav.color,
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
