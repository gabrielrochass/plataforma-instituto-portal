import {
  FileTextIcon,
  KeyRoundIcon,
  LogOutIcon,
  ShieldCheckIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { LinkList } from "@/components/app-shell/link-list";
import { PageHeader } from "@/components/app-shell/page-header";
import { SubmitButton } from "@/components/forms/submit-button";
import { SignOutEverywhereForm } from "@/components/settings/sign-out-everywhere-form";
import { signOut } from "@/lib/actions/account";
import { m } from "@/lib/i18n";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: m.account.title };

export default async function AccountPage() {
  const { claims } = await requireUser();
  const fullName = claims.user_metadata?.full_name;
  const name = typeof fullName === "string" ? fullName : null;

  return (
    <>
      <PageHeader
        title={m.account.title}
        back={{ href: "/ajustes", label: m.nav.settings }}
      />
      <div className="flex flex-col gap-8">
        <section
          aria-labelledby="conectado"
          className="flex flex-col gap-0.5 rounded-2xl bg-card p-5"
        >
          <h2
            id="conectado"
            className="text-footnote font-medium text-muted-foreground"
          >
            {m.account.signedInAs}
          </h2>
          {name && <p className="text-headline font-semibold">{name}</p>}
          <p className="wrap-anywhere text-subhead text-muted-foreground">
            {claims.email}
          </p>
        </section>

        <LinkList
          links={[
            {
              href: "/ajustes/conta/senha",
              title: m.account.changePassword,
              hint: m.account.changePasswordHint,
              icon: KeyRoundIcon,
            },
            { href: "/termos", title: m.account.terms, icon: FileTextIcon },
            {
              href: "/privacidade",
              title: m.account.privacy,
              icon: ShieldCheckIcon,
            },
          ]}
        />

        <div className="flex flex-col gap-3">
          <form action={signOut}>
            <SubmitButton variant="secondary" size="lg" className="w-full">
              <LogOutIcon aria-hidden="true" />
              {m.account.signOut}
            </SubmitButton>
          </form>
          <SignOutEverywhereForm />
        </div>
      </div>
    </>
  );
}
