import { LogOutIcon } from "lucide-react";
import type { Metadata } from "next";
import { PublicHeader } from "@/components/brand/public-header";
import { SubmitButton } from "@/components/forms/submit-button";
import { signOut } from "@/lib/actions/account";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.noAccess.title };

export default function NoAccessPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 py-12">
      <PublicHeader title={m.noAccess.title} text={m.noAccess.text} />
      <form action={signOut}>
        <SubmitButton variant="secondary" size="lg" className="h-12 w-full">
          <LogOutIcon aria-hidden="true" />
          {m.account.signOut}
        </SubmitButton>
      </form>
    </div>
  );
}
